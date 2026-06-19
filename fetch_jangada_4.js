const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    const jangada = await prisma.jangada.findUnique({
      where: { id: 4 },
    });
    console.log(jangada);
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
