const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function resolveReferenceDate(row) {
  return row.dataAbertura
    || row.createdAt
    || row.dataPlaneadaInicio
    || row.dataPrevista
    || row.dataInicio
    || row.dataConclusao
    || new Date();
}

function buildPrefixFromYear(year) {
  return `FO10${String(year).slice(-2)}`;
}

function buildNumero(prefix, sequence) {
  return `${prefix}${String(sequence).padStart(5, "0")}`;
}

function planChanges(rows) {
  const grouped = rows.reduce((acc, row) => {
    const referenceDate = resolveReferenceDate(row);
    const year = referenceDate.getFullYear();
    if (!acc.has(year)) acc.set(year, []);
    acc.get(year).push(row);
    return acc;
  }, new Map());

  const changes = [];

  for (const [year, yearRows] of Array.from(grouped.entries()).sort((a, b) => a[0] - b[0])) {
    const sorted = [...yearRows].sort((a, b) => {
      const aDate = resolveReferenceDate(a).getTime();
      const bDate = resolveReferenceDate(b).getTime();
      if (aDate !== bDate) return aDate - bDate;
      return a.id - b.id;
    });

    const prefix = buildPrefixFromYear(year);

    sorted.forEach((row, index) => {
      const nextNumero = buildNumero(prefix, index + 1);
      if (row.numeroOrdem === nextNumero) return;
      changes.push({
        id: row.id,
        from: row.numeroOrdem,
        to: nextNumero,
        year,
        referenceDate: resolveReferenceDate(row),
      });
    });
  }

  return changes;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const rows = await prisma.ordemServico.findMany({
    select: {
      id: true,
      numeroOrdem: true,
      dataAbertura: true,
      createdAt: true,
      dataPlaneadaInicio: true,
      dataPrevista: true,
      dataInicio: true,
      dataConclusao: true,
    },
    orderBy: [{ dataAbertura: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });

  const changes = planChanges(rows);
  const byYear = changes.reduce((acc, change) => {
    acc[String(change.year)] = (acc[String(change.year)] || 0) + 1;
    return acc;
  }, {});

  console.log(`[ot-number-backfill] total OT: ${rows.length}`);
  console.log(`[ot-number-backfill] mudanças planeadas: ${changes.length}`);
  console.log(`[ot-number-backfill] por ano: ${JSON.stringify(byYear)}`);

  if (changes.length > 0) {
    console.log("[ot-number-backfill] amostra:");
    for (const change of changes.slice(0, 20)) {
      console.log(`  #${change.id} ${change.from} -> ${change.to} (${change.referenceDate.toISOString().slice(0, 10)})`);
    }
  }

  if (!apply) {
    console.log("[ot-number-backfill] preview concluído. Use --apply para gravar.");
    return;
  }

  if (changes.length === 0) {
    console.log("[ot-number-backfill] nada para atualizar.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const change of changes) {
      await tx.ordemServico.update({
        where: { id: change.id },
        data: { numeroOrdem: `TMP-OT-${change.id}` },
      });
    }

    for (const change of changes) {
      await tx.ordemServico.update({
        where: { id: change.id },
        data: { numeroOrdem: change.to },
      });
    }
  });

  console.log(`[ot-number-backfill] aplicado com sucesso: ${changes.length} OT renumeradas.`);
}

main()
  .catch((error) => {
    console.error("[ot-number-backfill] falhou", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });