const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.navio.findMany({
    where: { nome: { contains: 'MARIA SANTA', mode: 'insensitive' } },
    include: { cliente: true }
  });
  console.log(JSON.stringify(res, null, 2));
}

main().then(() => prisma.$disconnect()).catch(() => prisma.$disconnect());
