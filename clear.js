const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clean() {
  await prisma.navio.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.$disconnect();
}
clean();
