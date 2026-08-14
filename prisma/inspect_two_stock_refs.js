const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  const refs = ['00940350', '30202051'];
  const rows = await prisma.stock.findMany({
    where: { referencia: { in: refs } },
    select: {
      id: true,
      referencia: true,
      codigoFabricante: true,
      descricao: true,
      quantidade: true,
      quantidadeMinima: true,
      observacoes: true,
      updatedAt: true,
    },
    orderBy: { referencia: 'asc' },
  });

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
