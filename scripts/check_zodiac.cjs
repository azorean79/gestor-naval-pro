const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const serial = 'XDC5FH57J212';
  const raft = await prisma.jangada.findUnique({ where: { serial }, include: { artigos: true } });
  console.log('JANGADA:', raft ? JSON.stringify({
    id: raft.id, brand: raft.brand, model: raft.model, serial: raft.serial, capacity: raft.capacity,
    packType: raft.packType, dataFabrico: raft.dataFabrico, dataInspecao: raft.dataInspecao,
    dataProxInspecao: raft.dataProxInspecao, shipId: raft.shipId, owner: raft.owner,
    cylinderSerial: raft.cylinderSerial, shipNameManual: raft.shipNameManual,
  }, null, 2) : 'NAO EXISTE');

  const navios = await prisma.navio.findMany({ where: { OR: [{ nome: { contains: 'AZIMUTE' } }, { nome: { contains: 'AZIM' } }] } });
  console.log('NAVIOS AZIMUTE:', JSON.stringify(navios.map(n => ({ id: n.id, nome: n.nome, matricula: n.matricula, mmsi: n.mmsi, cfr: n.cfr })), null, 2));

  const shipRafts = navios.length ? await prisma.jangada.findMany({ where: { shipId: { in: navios.map(n => n.id) } } }) : [];
  console.log('JANGADAS DO NAVIO:', JSON.stringify(shipRafts.map(r => ({ id: r.id, serial: r.serial, brand: r.brand, model: r.model, capacity: r.capacity, packType: r.packType })), null, 2));

  const anyRafts = await prisma.jangada.findMany({ where: { brand: { contains: 'ZODIAC' } }, select: { id: true, serial: true, brand: true, model: true, capacity: true, packType: true, shipId: true } });
  console.log('TOTAL JANGADAS ZODIAC:', anyRafts.length);
  console.log(JSON.stringify(anyRafts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
