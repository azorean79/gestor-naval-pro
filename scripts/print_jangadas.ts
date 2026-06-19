import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? process.env.gestornavalpro_DATABASE_URL ?? process.env.GESTOR_DB;
if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const jangadas = await prisma.jangada.findMany({
    select: {
      serial: true,
      shipNameManual: true,
      packType: true,
      artigos: true,
    },
    orderBy: { serial: 'asc' },
  });
  for (const j of jangadas) {
    console.log(`${j.serial} | ${j.shipNameManual} | ${j.packType} | ${j.artigos}`);
  }
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
