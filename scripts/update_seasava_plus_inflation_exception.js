const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const baseWhere = {
    model: {
      contains: 'SEASAVA PLUS',
      mode: 'insensitive',
    },
  };

  const thanner = await prisma.jangada.updateMany({
    where: {
      ...baseWhere,
      serial: { startsWith: '4' },
    },
    data: {
      cylinderSistema: 'THANNER',
    },
  });

  const leafield = await prisma.jangada.updateMany({
    where: {
      ...baseWhere,
      NOT: {
        serial: { startsWith: '4' },
      },
    },
    data: {
      cylinderSistema: 'Leafield',
    },
  });

  console.log(
    JSON.stringify(
      {
        seasavaPlusThannerPrefix4: thanner.count,
        seasavaPlusLeafieldOther: leafield.count,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('Erro ao atualizar sistema de insuflação SEASAVA PLUS:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
