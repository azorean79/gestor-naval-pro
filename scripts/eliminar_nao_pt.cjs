const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const isPT = (m) => /^PT/i.test(String(m || '').trim());

(async () => {
  const all = await p.navio.findMany({ select: { id: true, matricula: true, estadoNavio: true, clienteId: true } });
  const jangadas = await p.jangada.findMany({ select: { shipId: true } });
  const jangadaShipIds = new Set(jangadas.map((j) => j.shipId).filter((x) => x != null));

  const deleteIds = all
    .filter((n) => !isPT(n.matricula))
    .filter((n) => (n.estadoNavio || '').toLowerCase() !== 'naufragado')
    .filter((n) => n.clienteId == null)
    .filter((n) => !jangadaShipIds.has(n.id))
    .map((n) => n.id);

  console.log('Total a eliminar:', deleteIds.length);

  const inspecoes = await p.inspecao.findMany({ where: { navioId: { in: deleteIds } }, select: { id: true, navioNome: true } });
  console.log('Inspecoes a desligar (navioId -> null):', inspecoes.length);
  if (inspecoes.length) {
    await p.inspecao.updateMany({ where: { navioId: { in: deleteIds } }, data: { navioId: null } });
  }

  const coletes = await p.colete.findMany({ where: { shipId: { in: deleteIds } }, select: { id: true } });
  console.log('Coletes a desligar (shipId -> null):', coletes.length);
  if (coletes.length) {
    await p.colete.updateMany({ where: { shipId: { in: deleteIds } }, data: { shipId: null } });
  }

  const CHUNK = 500;
  let totalDeleted = 0;
  for (let i = 0; i < deleteIds.length; i += CHUNK) {
    const chunk = deleteIds.slice(i, i + CHUNK);
    const res = await p.navio.deleteMany({ where: { id: { in: chunk } } });
    totalDeleted += res.count;
    console.log(`Eliminados ${totalDeleted}/${deleteIds.length}`);
  }

  const restante = await p.navio.count();
  console.log('Total eliminado:', totalDeleted);
  console.log('Navios restantes na BD:', restante);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
