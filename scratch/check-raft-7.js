const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const raft = await prisma.jangada.findUnique({
    where: { id: 7 },
    include: {
      artigos: true
    }
  });

  console.log('--- RAFT 7 ---');
  console.log('Serial:', raft.serial);
  console.log('Model:', raft.model);
  console.log('Capacity:', raft.capacity);
  console.log('Brand:', raft.brand);
  
  console.log('--- ARTICLES ---');
  for (const art of raft.artigos || []) {
    console.log(`- ${art.name} (${art.referencia}) validity: ${art.validade}, quantity: ${art.quantidade}`);
  }

  const ins = await prisma.inspecao.findFirst({
    where: { jangadaId: 7 },
    orderBy: { dataInspecao: 'desc' }
  });

  console.log('--- LAST INSPECTION ---');
  if (ins) {
    console.log('Inspection Date:', ins.dataInspecao);
    console.log('Cert No:', ins.certificadoNumero);
  } else {
    console.log('No inspection found!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
