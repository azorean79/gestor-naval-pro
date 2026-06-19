const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    const existing = await prisma.jangada.findUnique({
      where: { id: 4 },
      select: { id: true, brand: true, model: true, packType: true, capacity: true },
    });
    console.log("Existing:", existing);

    // Simulate update
    const jangadaData = {};
    const nextShipId = 2;
    const assignedShip = await prisma.navio.findUnique({
      where: { id: nextShipId },
    });
    console.log("Ship:", assignedShip);
    if (assignedShip) {
      jangadaData.shipId = assignedShip.id;
      jangadaData.shipNameManual = assignedShip.nome;
    }

    console.log("Data to update:", jangadaData);
    const updated = await prisma.jangada.update({
      where: { id: 4 },
      data: jangadaData,
    });
    console.log("Updated successfully", updated.id);
  } catch (error) {
    console.error("Erro Prisma:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
