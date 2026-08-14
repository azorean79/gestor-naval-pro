const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ accelerateUrl: process.env.DATABASE_URL });

async function main() {
  const clientes = await prisma.cliente.count();
  const navios = await prisma.navio.count();
  console.log(JSON.stringify({ clientes, navios }));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
