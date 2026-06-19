const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const raft = await prisma.jangada.findUnique({
    where: { id: 8 },
    include: { artigos: true }
  });
  console.log("Jangada 8:", JSON.stringify(raft, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
