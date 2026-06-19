const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.gestornavalpro_DATABASE_URL ||
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const OUT_JSON = path.join(process.cwd(), 'scripts', 'stock_report.json');
const OUT_CSV = path.join(process.cwd(), 'scripts', 'stock_report.csv');
const OUT_SOLAS_ISO_JSON = path.join(process.cwd(), 'scripts', 'stock_report_solas_iso.json');
const OUT_SOLAS_ISO_CSV = path.join(process.cwd(), 'scripts', 'stock_report_solas_iso.csv');

function toCsvValue(value) {
  const text = value == null ? '' : String(value);
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toCsv(rows) {
  const headers = [
    'referencia',
    'descricao',
    'categoria',
    'precoVenda',
    'quantidade',
    'codigoFabricante',
    'associavelJangada',
    'aplicavelMarcaJangada',
    'aplicavelModeloJangada',
    'createdAt',
    'updatedAt',
  ];

  const lines = [headers.map(toCsvValue).join(',')];

  for (const row of rows) {
    const line = headers
      .map((key) => {
        const value = row[key];
        if (value instanceof Date) return toCsvValue(value.toISOString());
        return toCsvValue(value);
      })
      .join(',');
    lines.push(line);
  }

  return lines.join('\n');
}

async function exportStockReport() {
  const rows = await prisma.stock.findMany({
    orderBy: [{ categoria: 'asc' }, { referencia: 'asc' }],
    select: {
      referencia: true,
      descricao: true,
      categoria: true,
      precoVenda: true,
      quantidade: true,
      codigoFabricante: true,
      associavelJangada: true,
      aplicavelMarcaJangada: true,
      aplicavelModeloJangada: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2), 'utf8');
  fs.writeFileSync(OUT_CSV, toCsv(rows), 'utf8');

  const solasIsoRows = rows.filter((row) => {
    const fabricante = String(row.codigoFabricante || '').toUpperCase();
    return fabricante.includes('SOLAS') || fabricante.includes('ISO');
  });

  fs.writeFileSync(OUT_SOLAS_ISO_JSON, JSON.stringify(solasIsoRows, null, 2), 'utf8');
  fs.writeFileSync(OUT_SOLAS_ISO_CSV, toCsv(solasIsoRows), 'utf8');

  const categories = [...new Set(rows.map((r) => r.categoria || 'SEM CATEGORIA'))].sort((a, b) =>
    a.localeCompare(b, 'pt')
  );

  console.log('Relatório de stock exportado com sucesso.');
  console.log(`Itens: ${rows.length}`);
  console.log(`Categorias: ${categories.length}`);
  console.log(`JSON: ${OUT_JSON}`);
  console.log(`CSV: ${OUT_CSV}`);
  console.log(`SOLAS/ISO Itens: ${solasIsoRows.length}`);
  console.log(`SOLAS/ISO JSON: ${OUT_SOLAS_ISO_JSON}`);
  console.log(`SOLAS/ISO CSV: ${OUT_SOLAS_ISO_CSV}`);
}

if (require.main === module) {
  exportStockReport()
    .catch((error) => {
      console.error('Erro ao exportar stock:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { exportStockReport };
