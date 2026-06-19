const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizeDottedCode(code) {
  return String(code || '').replace(/\./g, '').trim();
}

async function main() {
  const rows = await prisma.stock.findMany({
    where: {
      codigoFabricante: {
        not: null,
      },
      OR: [
        { aplicavelMarcaJangada: { contains: 'DSB', mode: 'insensitive' } },
        { descricao: { contains: 'DSB', mode: 'insensitive' } },
        { referencia: { contains: 'DSB', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      referencia: true,
      descricao: true,
      codigoFabricante: true,
      aplicavelMarcaJangada: true,
    },
    take: 10000,
  });

  const dotted = rows.filter((r) => /^\d+(\.\d+)+$/.test(String(r.codigoFabricante || '').trim()));

  const allRows = await prisma.stock.findMany({
    where: {
      codigoFabricante: {
        not: null,
      },
    },
    select: {
      id: true,
      referencia: true,
      descricao: true,
      codigoFabricante: true,
      aplicavelMarcaJangada: true,
    },
    take: 20000,
  });

  const dottedGlobal = allRows.filter((r) => /^\d+(\.\d+)+$/.test(String(r.codigoFabricante || '').trim()));
  const workset = dotted.length > 0 ? dotted : dottedGlobal;

  let updated = 0;
  let skippedConflict = 0;

  for (const row of workset) {
    const oldCode = String(row.codigoFabricante || '').trim();
    const newCode = normalizeDottedCode(oldCode);
    if (!newCode || newCode === oldCode) continue;

    const conflict = await prisma.stock.findFirst({
      where: {
        codigoFabricante: newCode,
        NOT: { id: row.id },
      },
      select: { id: true, referencia: true, descricao: true },
    });

    if (conflict) {
      skippedConflict++;
      console.log(
        `SKIP conflito: ID ${row.id} (${oldCode} -> ${newCode}) já existe no ID ${conflict.id} (${conflict.referencia || 'sem-ref'})`
      );
      continue;
    }

    await prisma.stock.update({
      where: { id: row.id },
      data: { codigoFabricante: newCode },
    });

    updated++;
  }

  const remaining = await prisma.stock.findMany({
    where: {
      codigoFabricante: {
        not: null,
      },
      OR: [
        { aplicavelMarcaJangada: { contains: 'DSB', mode: 'insensitive' } },
        { descricao: { contains: 'DSB', mode: 'insensitive' } },
        { referencia: { contains: 'DSB', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      codigoFabricante: true,
    },
    take: 10000,
  });

  const dottedRemaining = remaining.filter((r) => /^\d+(\.\d+)+$/.test(String(r.codigoFabricante || '').trim()));

  const remainingGlobal = await prisma.stock.findMany({
    where: {
      codigoFabricante: {
        not: null,
      },
    },
    select: {
      id: true,
      codigoFabricante: true,
    },
    take: 20000,
  });

  const dottedRemainingGlobal = remainingGlobal.filter((r) => /^\d+(\.\d+)+$/.test(String(r.codigoFabricante || '').trim()));

  console.log('\n=== Normalização DSB codigoFabricante ===');
  console.log(`Registos DSB avaliados: ${rows.length}`);
  console.log(`Registos com formato pontuado encontrados: ${dotted.length}`);
  console.log(`Registos globais com formato pontuado encontrados: ${dottedGlobal.length}`);
  console.log(`Conjunto efetivo normalizado: ${workset.length} (${dotted.length > 0 ? 'DSB' : 'GLOBAL'})`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Ignorados por conflito: ${skippedConflict}`);
  console.log(`Ainda pontuados após execução: ${dottedRemaining.length}`);
  console.log(`Ainda pontuados no stock (global): ${dottedRemainingGlobal.length}`);
}

main()
  .catch((error) => {
    console.error('Erro na normalização DSB:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
