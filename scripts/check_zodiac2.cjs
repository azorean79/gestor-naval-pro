const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rafts = await prisma.jangada.findMany({
    where: { id: { in: [516, 517] } },
    include: { artigos: true },
  });
  for (const r of rafts) {
    const insp = await prisma.inspecao.findMany({ where: { jangadaId: r.id } });
    console.log('=== JANGADA', r.id, r.serial, '===');
    console.log(JSON.stringify({
      brand: r.brand, model: r.model, capacity: r.capacity, packType: r.packType,
      dataFabrico: r.dataFabrico, dataInspecao: r.dataInspecao, dataProxInspecao: r.dataProxInspecao,
      cylinderSerial: r.cylinderSerial, cylinderCo2: r.cylinderCo2, cylinderN2: r.cylinderN2,
      shipId: r.shipId, shipNameManual: r.shipNameManual, owner: r.owner,
      ultimoCertificadoNumero: r.ultimoCertificadoNumero, painterLength: r.painterLength,
      maxStowageHeight: r.maxStowageHeight, containerModel: r.containerModel, launchType: r.launchType,
    }, null, 2));
    console.log('ARTIGOS:', JSON.stringify(r.artigos.map(a => ({ name: a.name, quantidade: a.quantidade, referencia: a.referencia })), null, 2));
    console.log('INSPECOES:', JSON.stringify((insp || []).map(i => ({ id: i.id, certificadoNumero: i.certificadoNumero, dataInspecao: i.dataInspecao, dataProxInspecao: i.dataProxInspecao, status: i.status })), null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
