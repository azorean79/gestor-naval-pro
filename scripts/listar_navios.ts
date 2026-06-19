import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const navios = await prisma.navio.findMany({
    select: { nome: true, matricula: true, ilha: true, tipoPesca: true },
    orderBy: { nome: 'asc' },
  });
  console.table(navios);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
