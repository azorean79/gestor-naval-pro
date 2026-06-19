// Script para listar ligações entre jangadas e navios
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const jangadas = await prisma.jangada.findMany({ include: { navio: true } });
  const ligacoes = jangadas.map(j => ({
    jangada: j,
    navio: j.navio
  }));
  console.log(JSON.stringify(ligacoes, null, 2));
}

main().finally(() => prisma.$disconnect());
