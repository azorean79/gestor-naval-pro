const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const refs = ['15199001', '11785009', '11788009', '08279009', '08280009', '06729009', '01174009', '12865009'];
  const rows = await prisma.stock.findMany({
    where: { referencia: { in: refs } },
    select: {
      referencia: true,
      estadoArtigo: true,
      referenciaSubstituta: true,
      associavelJangada: true,
    },
    orderBy: { referencia: 'asc' },
  });

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
