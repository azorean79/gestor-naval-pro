const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CANONICAL_REF = '30202051';
const ALIAS_REFS = [
  'AUTO-1773408960266-138',
  'AUTO-1773408845474-509',
  'AUTO-1773408764789-222',
  '1174009',
];

function appendNote(existing, extra) {
  const base = String(existing || '').trim();
  if (!base) return extra;
  if (base.includes(extra)) return base;
  return `${base} | ${extra}`;
}

async function main() {
  const rows = await prisma.stock.findMany({
    where: { referencia: { in: [CANONICAL_REF, ...ALIAS_REFS] } },
    orderBy: { id: 'asc' },
  });

  const canonical = rows.find((row) => row.referencia === CANONICAL_REF);
  if (!canonical) {
    throw new Error(`Referência canónica não encontrada: ${CANONICAL_REF}`);
  }

  const aliases = rows.filter((row) => ALIAS_REFS.includes(row.referencia));
  if (aliases.length === 0) {
    console.log('Nenhum alias encontrado para fundir.');
    return;
  }

  const preferredManufacturer = aliases.find((row) => row.referencia === '1174009')?.codigoFabricante || '1174009';
  const preferredCost = aliases.find((row) => row.precoCompra != null)?.precoCompra ?? canonical.precoCompra;
  const preferredSale = aliases.find((row) => Number(row.precoVenda || 0) > 0)?.precoVenda ?? canonical.precoVenda;
  const mergedQuantity = Number(canonical.quantidade || 0) + aliases.reduce((sum, row) => sum + Number(row.quantidade || 0), 0);
  const mergedMin = Math.max(Number(canonical.quantidadeMinima || 0), ...aliases.map((row) => Number(row.quantidadeMinima || 0)));
  const aliasSummary = `Referências fundidas em ${CANONICAL_REF}: ${ALIAS_REFS.join(', ')}.`;
  const noteSummary = 'Alias SUR0005 / Tablet, Anti-seasickness consolidado no artigo canónico.';

  await prisma.$transaction(async (tx) => {
    await tx.stock.update({
      where: { id: canonical.id },
      data: {
        descricao: 'Comprimidos p/ Enjoo / Seasickness Tablets',
        codigoFabricante: preferredManufacturer,
        precoCompra: preferredCost,
        precoVenda: preferredSale,
        quantidade: mergedQuantity,
        quantidadeMinima: mergedMin,
        categoria: canonical.categoria || 'Equip. de Emergência',
        associavelJangada: true,
        observacoes: appendNote(appendNote(canonical.observacoes, noteSummary), aliasSummary),
      },
    });

    await tx.stock.deleteMany({
      where: { id: { in: aliases.map((row) => row.id) } },
    });
  });

  console.log(`✓ Fundidos ${aliases.length} registos em ${CANONICAL_REF}`);
  console.log(`  Código fabricante final: ${preferredManufacturer}`);
  console.log(`  Preço compra final: ${preferredCost}`);
  console.log(`  Preço venda final: ${preferredSale}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
