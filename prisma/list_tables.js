const { PrismaClient } = require('@prisma/client');
let PrismaPg;
try { PrismaPg = require('@prisma/adapter-pg').PrismaPg; } catch (e) { PrismaPg = null; }

const connectionString = process.env.DATABASE_URL;
const prisma = PrismaPg ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) }) : new PrismaClient({});

async function main() {
  const rows = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('public tables:', rows.map(r => r.table_name));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
