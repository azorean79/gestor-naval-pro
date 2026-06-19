import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n📄 SINCRONIZAR JANGADAS COM CERTIFICADOS\n");

  const certificados = await prisma.certificadoExtraido.findMany({
    where: {
      raftSerial: { not: null },
      OR: [{ dataInspecao: { not: null } }, { validitiesCount: { gt: 0 } }],
    },
    orderBy: [{ raftSerial: "asc" }, { createdAt: "desc" }],
  });

  const latestBySerial = new Map<string, (typeof certificados)[number]>();
  for (const c of certificados) {
    if (!c.raftSerial) continue;
    if (!latestBySerial.has(c.raftSerial)) latestBySerial.set(c.raftSerial, c);
  }

  let atualizadas = 0;
  for (const [serial, cert] of latestBySerial.entries()) {
    const existing = await prisma.jangada.findUnique({ where: { serial } });
    if (!existing) continue;

    const updateData: Record<string, string | number> = {};
    if (cert.dataInspecao && cert.dataInspecao !== existing.dataInspecao) {
      updateData.dataInspecao = cert.dataInspecao;
    }
    if (cert.dataProxInspecao && cert.dataProxInspecao !== existing.dataProxInspecao) {
      updateData.dataProxInspecao = cert.dataProxInspecao;
    }

    if (Object.keys(updateData).length) {
      await prisma.jangada.update({ where: { serial }, data: updateData });
      atualizadas++;
    }
  }

  console.log(`✅ Certificados analisados: ${certificados.length}`);
  console.log(`✅ Jangadas atualizadas: ${atualizadas}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
