const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });
(async () => {
  const seriais = await p.jangada.findMany({ where: { serial: { contains: '50173303' } }, select: { id: true, brand: true, model: true, serial: true, shipId: true, shipNameManual: true, owner: true, packType: true } });
  console.log('Jangadas com serial contendo 50173303:');
  console.log(JSON.stringify(seriais, null, 2));

  const navio752 = await p.navio.findUnique({ where: { id: 752 }, select: { id: true, nome: true, matricula: true, cfr: true, ativo: true, clienteId: true } });
  console.log('\nNavio 752:', JSON.stringify(navio752, null, 2));

  const jangadas752 = await p.jangada.findMany({ where: { shipId: 752 }, select: { id: true, brand: true, model: true, serial: true, shipNameManual: true } });
  console.log('\nJangadas do navio 752:', JSON.stringify(jangadas752, null, 2));

  const cliente = await p.cliente.findUnique({ where: { id: navio752?.clienteId } , select: { id: true, nome: true, nif: true }});
  console.log('\nCliente 752:', JSON.stringify(cliente, null, 2));
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
