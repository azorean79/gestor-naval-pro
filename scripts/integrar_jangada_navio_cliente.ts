import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔗 INTEGRAÇÃO JANGADA → NAVIO → CLIENTE\n");

  const jangadas = await prisma.jangada.findMany({
    include: {
      artigos: true,
    },
  });

  let atualizadas = 0;

  for (const j of jangadas) {
    if (!j.shipId) continue;

    const navio = await prisma.navio.findUnique({
      where: { id: j.shipId },
      include: { cliente: true },
    });

    if (!navio) continue;

    const ownerPreferido = navio.cliente?.nome || navio.proprietario || j.owner;
    const shipNamePreferido = navio.nome || j.shipNameManual;

    const needOwner = ownerPreferido && ownerPreferido !== j.owner;
    const needShipName = shipNamePreferido && shipNamePreferido !== j.shipNameManual;

    if (needOwner || needShipName) {
      await prisma.jangada.update({
        where: { id: j.id },
        data: {
          owner: ownerPreferido,
          shipNameManual: shipNamePreferido,
        },
      });
      atualizadas++;
    }
  }

  const semShip = await prisma.jangada.count({ where: { shipId: null } });

  console.log(`✅ Jangadas processadas: ${jangadas.length}`);
  console.log(`✅ Jangadas integradas: ${atualizadas}`);
  console.log(`ℹ️ Jangadas sem navio: ${semShip}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
