import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.itemStock.findMany({ orderBy: { createdAt: 'desc' } });
  const out = { data: items, total: items.length, page: 1, limit: items.length, totalPages: 1 };
  const file = path.join(__dirname, '..', 'data', 'stock-snapshot.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf-8');
  console.log('Wrote', items.length, 'items to', file);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
