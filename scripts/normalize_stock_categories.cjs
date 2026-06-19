require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.gestornavalpro_DATABASE_URL ||
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

function normalizeCategoryText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ');
}

function normalizeStockCategory(value, descricao) {
  const normalized = normalizeCategoryText(value);
  const description = normalizeCategoryText(descricao);

  const exactMap = {
    geral: 'EQUIPAMENTO',
    sinalizacao: 'SINALIZAÇÃO',
    pirotecnia: 'SINALIZAÇÃO',
    'iluminacao': 'ILUMINAÇÃO',
    'iluminacao e baterias': 'ILUMINAÇÃO',
    sobrevivencia: 'SOBREVIVÊNCIA',
    'mecanica e sistemas de disparo': 'EQUIPAMENTO',
    'cabecas de disparo': 'EQUIPAMENTO',
    'sobrevivencia e consumiveis': 'CONSUMÍVEIS',
    'primeiros socorros': 'PRIMEIROS SOCORROS',
    'consumiveis': 'CONSUMÍVEIS',
    equipamento: 'EQUIPAMENTO',
    'manutencao e etiquetagem': 'EQUIPAMENTO',
    'sistemas de insuflacao': 'EQUIPAMENTO',
    'componentes criticos de conexao': 'EQUIPAMENTO',
    'jangada lr97': 'EQUIPAMENTO',
  };

  if (exactMap[normalized]) return exactMap[normalized];
  if (/farm|first aid|primeiros socorros|enjoo|tablet|comprim/.test(description)) return 'PRIMEIROS SOCORROS';
  if (/agua|water|racao|ration|copo|vomito|bag/.test(description)) return 'CONSUMÍVEIS';
  if (/manta|thermal|surviv|heliogra|pesca|whistle|apito/.test(description)) return 'SOBREVIVÊNCIA';
  if (/luz|light|lanterna|torch|bateria|battery/.test(description)) return 'ILUMINAÇÃO';
  if (/foguete|facho|smoke|fumo|sinal|piro/.test(description)) return 'SINALIZAÇÃO';
  return 'EQUIPAMENTO';
}

async function main() {
  const apply = process.argv.includes('--apply');
  const rows = await prisma.stock.findMany({
    select: {
      id: true,
      referencia: true,
      descricao: true,
      categoria: true,
    },
    orderBy: { id: 'asc' },
  });

  const changes = rows
    .map((row) => ({
      ...row,
      categoriaNova: normalizeStockCategory(row.categoria || row.descricao, row.descricao),
    }))
    .filter((row) => (row.categoriaNova || null) !== (row.categoria || null));

  console.log(`Stock rows found: ${rows.length}`);
  console.log(`Rows needing category normalization: ${changes.length}`);

  for (const row of changes.slice(0, 50)) {
    console.log(`- [${row.id}] ${row.referencia} :: ${row.categoria || '∅'} -> ${row.categoriaNova || '∅'}`);
  }

  if (!apply) {
    console.log('\nDry-run complete. Re-run with --apply to persist changes.');
    return;
  }

  let updated = 0;
  for (const row of changes) {
    await prisma.stock.update({
      where: { id: row.id },
      data: { categoria: row.categoriaNova },
    });
    updated += 1;
  }

  console.log(`\nApplied category normalization to ${updated} stock row(s).`);
}

main()
  .catch((error) => {
    console.error('Error normalizing stock categories:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
