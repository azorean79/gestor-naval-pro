// Script para listar ligações entre navios e clientes
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const navios = await prisma.navio.findMany({ include: { cliente: true } });
  const ligacoes = navios.map(n => ({
    navio: n,
    cliente: n.cliente
  }));
  console.log(JSON.stringify(ligacoes, null, 2));
}

main().finally(() => prisma.$disconnect());
