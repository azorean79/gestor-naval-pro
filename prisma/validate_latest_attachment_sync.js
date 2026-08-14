const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const refs = ['41423001', '08211009', '20883001', '5606009', '07945009', '06231001', '43858001', '06729009'];
  const rows = await prisma.stock.findMany({
    where: {
      OR: [
        { referencia: { in: refs } },
        { codigoFabricante: { in: refs } },
      ],
    },
    select: {
      referencia: true,
      codigoFabricante: true,
      descricao: true,
      quantidadeMinima: true,
      quantidade: true,
      aplicavelModeloJangada: true,
      observacoes: true,
    },
    orderBy: { referencia: 'asc' },
  });

  console.log(JSON.stringify(rows, null, 2));
  console.log(`TOTAL_AMOSTRA=${rows.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
