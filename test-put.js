const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = 7;
  const rawData = {
    brand: "RFD",
    model: "SEASAVA PLUS",
    serial: "50175203S7193",
    launchType: "TO",
    painterLength: "10",
    maxStowageHeight: "5",
    dataFabrico: "2010-05",
    packType: "E",
    capacity: 12,
    owner: "MONIZ E FILHOS LDA",
    shipId: 5,
    shipNameManual: "O Aresta",
    cylinderSerial: "10861759",
    cylinderTara: "8.790",
    cylinderPesoBruto: "13.769",
    cylinderCo2: "4.770",
    cylinderN2: "0.140",
    cylinderDataTeste: "2019-03",
    cylinderDataProxTeste: "2024-02-29",
    cylinderSistema: "THANNER",
    fabricType: "PU",
    hruReferencia: "",
    hruDataInstalacao: "",
    hruValidade: ""
  };

  // Run the update compatibility logic
  console.log("Attempting database update...");
  try {
    const updated = await prisma.jangada.update({
      where: { id },
      data: {
        brand: rawData.brand,
        model: rawData.model,
        serial: rawData.serial,
        launchType: rawData.launchType,
        painterLength: rawData.painterLength,
        maxStowageHeight: rawData.maxStowageHeight,
        dataFabrico: "05/2010",
        packType: rawData.packType,
        capacity: rawData.capacity,
        owner: rawData.owner,
        shipId: rawData.shipId,
        shipNameManual: rawData.shipNameManual,
        cylinderSerial: rawData.cylinderSerial,
        cylinderTara: rawData.cylinderTara,
        cylinderPesoBruto: rawData.cylinderPesoBruto,
        cylinderCo2: rawData.cylinderCo2,
        cylinderN2: rawData.cylinderN2,
        cylinderDataTeste: rawData.cylinderDataTeste,
        cylinderDataProxTeste: rawData.cylinderDataProxTeste,
        cylinderSistema: rawData.cylinderSistema,
        fabricType: rawData.fabricType,
        hruReferencia: rawData.hruReferencia,
        hruDataInstalacao: rawData.hruDataInstalacao,
        hruValidade: rawData.hruValidade
      }
    });
    console.log("Success! Updated data:", JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error("Prisma update failed:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
