const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    const jangada = await prisma.jangada.create({
      data: {
        serial: "TESTE-12345",
        brand: "SURVITEC",
        model: "ZODIAC",
        launchType: "THROW OVERBOARD",
        capacity: 10,
        owner: "TESTE",
        dataFabrico: "01/2024",
        packType: "A",
      },
    });
    console.log("Jangada criada com sucesso, ID:", jangada.id);
    await prisma.jangada.delete({ where: { id: jangada.id } });
    console.log("Jangada de teste removida.");
  } catch (error) {
    console.error("Erro Prisma ao criar jangada:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
