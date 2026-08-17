const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const js = await p.jangada.findMany({ where: { id: { in: [59, 71] } }, select: { id: true, serial: true, shipId: true } });
  console.log('Jangadas 59/71:', JSON.stringify(js));

  for (const id of [85, 98]) {
    const i = await p.inspecao.findUnique({ where: { id }, select: { id: true, certificadoNumero: true, navioId: true, jangadaId: true } });
    console.log(`Inspecao #${id}: navioId=${i.navioId} jangadaId=${i.jangadaId}`);
  }

  const res = await p.inspecao.updateMany({ where: { id: { in: [85, 98] } }, data: { navioId: null } });
  console.log('navioId limpo em:', res.count);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
