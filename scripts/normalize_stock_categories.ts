#!/usr/bin/env tsx

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizeStockCategory } from '../src/lib/stock-categories';

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
      categoriaNova: normalizeStockCategory(row.categoria || row.descricao),
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
