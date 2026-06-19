// Script para listar todos os navios
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const navios = await prisma.navio.findMany();
  console.log(JSON.stringify(navios, null, 2));
}

main().finally(() => prisma.$disconnect());
