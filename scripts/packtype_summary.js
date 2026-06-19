const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const grouped = await prisma.jangada.groupBy({
    by: ['packType'],
    _count: { _all: true },
    orderBy: { _count: { packType: 'desc' } },
  });

  const total = grouped.reduce((acc, row) => acc + row._count._all, 0);

  console.log(JSON.stringify({ total, byPackType: grouped }, null, 2));
}

main()
  .catch((error) => {
    console.error('Erro ao gerar resumo por packType:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
