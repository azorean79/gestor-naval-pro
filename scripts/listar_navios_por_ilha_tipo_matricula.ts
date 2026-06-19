import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const navios = await prisma.navio.findMany({
    select: {
      nome: true,
      matricula: true,
      ilha: true,
      tipoPesca: true,
    },
    orderBy: [
      { ilha: 'asc' },
      { tipoPesca: 'asc' },
      { nome: 'asc' },
    ],
  });

  // Agrupa por ilha e tipo de pesca
  const agrupado = {};
  for (const n of navios) {
    if (!agrupado[n.ilha]) agrupado[n.ilha] = {};
    if (!agrupado[n.ilha][n.tipoPesca]) agrupado[n.ilha][n.tipoPesca] = [];
    agrupado[n.ilha][n.tipoPesca].push({ nome: n.nome, matricula: n.matricula });
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
