const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.jangada.updateMany({
    where: { packType: 'ORC' },
    data: { packType: 'R' },
  });

  console.log(JSON.stringify({ packTypeOrcToR: result.count }, null, 2));
}

main()
  .catch((error) => {
    console.error('Erro ao atualizar pack ORC -> R:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
