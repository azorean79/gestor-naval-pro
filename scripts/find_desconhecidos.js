const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const navios = await p.navio.findMany({
    where: {
      OR: [
        { nome: { contains: 'DESCONHECIDO' } },
        { nome: { contains: 'desconhecido' } },
        { nome: { contains: 'Desconhecido' } },
        { nome: { contains: 'DESCONHE' } },
      ],
    },
    select: { id: true, nome: true, matricula: true, callSignal: true, mmsi: true, imo: true },
    orderBy: { id: 'asc' },
  });
  console.log(`Found ${navios.length} navios with DESCONHECIDO name:`);
  for (const n of navios) {
    console.log(`  ID=${n.id} | Nome="${n.nome}" | Matricula="${n.matricula || ''}" | Call="${n.callSignal || ''}" | MMSI="${n.mmsi || ''}" | IMO="${n.imo || ''}"`);
  }
  await p.$disconnect();
})();
