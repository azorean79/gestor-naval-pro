import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Lista todas as jangadas, agrupando por posto de serviço
  const jangadas = await prisma.jangada.findMany({
    select: {
      serial: true,
      brand: true,
      model: true,
      packType: true,
      capacity: true,
      dataFabrico: true,
      dataInspecao: true,
      dataProxInspecao: true,
      shipNameManual: true,
      postoServico: true,
    },
    orderBy: [
      { postoServico: 'asc' },
      { shipNameManual: 'asc' },
      { serial: 'asc' },
    ],
  });

  // Agrupa por posto de serviço
  const agrupado = {};
  for (const j of jangadas) {
    const posto = j.postoServico || 'N/D';
    if (!agrupado[posto]) agrupado[posto] = [];
    agrupado[posto].push(j);
  }

  console.dir(agrupado, { depth: null });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
