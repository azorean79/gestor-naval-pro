// Script para listar todos os clientes
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clientes = await prisma.cliente.findMany();
  console.log(JSON.stringify(clientes, null, 2));
}

main().finally(() => prisma.$disconnect());
