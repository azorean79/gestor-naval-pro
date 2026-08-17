const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  for (const id of [782, 876]) {
    const js = await p.jangada.findMany({ where: { shipId: id }, select: { id: true, serial: true, brand: true } });
    const insp = await p.inspecao.findMany({ where: { navioId: id }, select: { id: true, certificadoNumero: true, jangadaId: true, jangadaSerial: true, navioNome: true, dataInspecao: true, dataProxInspecao: true } });
    console.log(`\n#${id}:`);
    console.log('  jangadas:', JSON.stringify(js));
    console.log('  inspecoes:', JSON.stringify(insp));
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
