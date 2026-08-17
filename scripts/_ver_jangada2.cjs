const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });
(async () => {
  const j = await p.jangada.findUnique({
    where: { id: 2 },
    select: { id: true, brand: true, model: true, serial: true, shipId: true, shipNameManual: true, owner: true, dataFabrico: true, packType: true, dataInspecao: true, dataProxInspecao: true, ultimoCertificadoNumero: true, certificadoExternoNumero: true, certificadoExternoUrl: true, cylinderSerial: true, serviceStationId: true, capacity: true, launchType: true },
  });
  console.log('Jangada 2 (NANCI MARIA):');
  console.log(JSON.stringify(j, null, 2));

  const unassigned = await p.jangada.findMany({
    where: { OR: [{ shipId: null }, { shipNameManual: null }] },
    select: { id: true, brand: true, model: true, serial: true, shipId: true, shipNameManual: true, owner: true },
    take: 30,
  });
  console.log('\nJangadas sem navio (amostra 30):', unassigned.length);
  console.log(JSON.stringify(unassigned, null, 2));
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
