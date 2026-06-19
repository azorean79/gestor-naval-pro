// Script para listar todas as jangadas
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const jangadas = await prisma.jangada.findMany();
  console.log(JSON.stringify(jangadas, null, 2));
}

main().finally(() => prisma.$disconnect());
