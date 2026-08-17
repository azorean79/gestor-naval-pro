const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const exists = await prisma.inspecao.findMany({
    where: { certificadoNumero: { in: ['AZ23-179', 'AZ23-180', 'AZ23-181'] } },
    select: { certificadoNumero: true },
  });
  console.log('Existentes:', exists.map(i => i.certificadoNumero).join(', ') || 'nenhum');

  const raft = await prisma.jangada.findUnique({ where: { id: 516 } });
  console.log('Raft packType:', raft.packType, 'capacity:', raft.capacity, 'model:', raft.model, 'brand:', raft.brand);
}

main().catch(console.error).finally(() => prisma.$disconnect());
