const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.stock.findMany({
    where: {
      referencia: { in: ['00940350', '30202051'] },
    },
    select: {
      referencia: true,
      estadoArtigo: true,
      referenciaSubstituta: true,
      associavelJangada: true,
      codigoFabricante: true,
    },
    orderBy: { referencia: 'asc' },
  });

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
