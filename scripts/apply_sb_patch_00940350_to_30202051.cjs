const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const NOTE = 'SB 12/24 Ver.1 - Consolidação aplicada (patch 00940350 -> 30202051)';

function appendNote(existing, extra) {
  const base = String(existing || '').trim();
  if (!base) return extra;
  if (base.includes(extra)) return base;
  return `${base} | ${extra}`;
}

async function ensureCanonical30202051() {
  const existing = await prisma.stock.findUnique({ where: { referencia: '30202051' } });

  if (!existing) {
    await prisma.stock.create({
      data: {
        referencia: '30202051',
        descricao: 'Comprimidos p/ Enjoo / Seasickness Tablets',
        estadoArtigo: 'ATIVO',
        referenciaSubstituta: '01174009',
        categoria: 'Equip. de Emergência',
        associavelJangada: false,
        codigoFabricante: '01174009',
        precoVenda: 0,
        quantidade: 0,
        observacoes: `${NOTE}. Encomendar 01174009 em substituição de 00940350/DSB00940350/Z64514/Z7406.`,
      },
    });
    return 'created';
  }

  await prisma.stock.update({
    where: { referencia: '30202051' },
    data: {
      estadoArtigo: 'ATIVO',
      categoria: existing.categoria || 'Equip. de Emergência',
      associavelJangada: false,
      codigoFabricante: existing.codigoFabricante || '01174009',
      referenciaSubstituta: existing.referenciaSubstituta || '01174009',
      observacoes: appendNote(existing.observacoes, `${NOTE}. Encomendar 01174009 em substituição de 00940350/DSB00940350/Z64514/Z7406.`),
    },
  });
  return 'updated';
}

async function tagLegacy(ref) {
  const rows = await prisma.stock.findMany({
    where: {
      OR: [
        { referencia: ref },
        { codigoFabricante: ref },
      ],
    },
  });

  let changed = 0;
  for (const row of rows) {
    if (row.referencia === '30202051') continue;
    await prisma.stock.update({
      where: { id: row.id },
      data: {
        estadoArtigo: 'INATIVO',
        referenciaSubstituta: '30202051',
        associavelJangada: false,
        observacoes: appendNote(row.observacoes, `${NOTE}. Referência substituída por 30202051.`),
      },
    });
    changed += 1;
  }

  return changed;
}

async function main() {
  const canonicalResult = await ensureCanonical30202051();
  const changed00940350 = await tagLegacy('00940350');
  const changedDSB = await tagLegacy('DSB00940350');

  console.log('✅ Patch SB aplicado');
  console.log(JSON.stringify({
    canonical30202051: canonicalResult,
    legacy00940350Inactivated: changed00940350,
    legacyDSB00940350Inactivated: changedDSB,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
