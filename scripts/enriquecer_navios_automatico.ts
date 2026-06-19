import { PrismaClient } from "@prisma/client";
import { extrairPortoDeMatricula } from "../src/utils/portosRegisto";

const prisma = new PrismaClient();

function tipoPorMatricula(matricula?: string | null, tipoPesca?: string | null) {
  const m = (matricula || "").trim().toUpperCase();
  if (m.endsWith("L")) return "Pesca Local";
  if (m.endsWith("C")) return "Pesca Costeira";
  if ((tipoPesca || "").trim()) return tipoPesca;
  return "Pesca Local";
}

async function main() {
  console.log("\n🚢 ENRIQUECER NAVIOS (MMSI/IMO/Porto/Tipo)\n");

  const navios = await prisma.navio.findMany();
  let atualizados = 0;

  for (const navio of navios) {
    const portoInferido = navio.portoRegisto || extrairPortoDeMatricula(navio.matricula || "") || undefined;
    const tipoInferido = tipoPorMatricula(navio.matricula, navio.tipoPesca);

    const update: Record<string, string> = {};
    if (portoInferido && portoInferido !== navio.portoRegisto) update.portoRegisto = portoInferido;
    if (tipoInferido && tipoInferido !== navio.tipoPesca) update.tipoPesca = tipoInferido;

    if (Object.keys(update).length > 0) {
      await prisma.navio.update({ where: { id: navio.id }, data: update });
      atualizados++;
    }
  }

  const total = navios.length;
  const completos = await prisma.navio.count({
    where: { mmsi: { not: null }, imo: { not: null }, portoRegisto: { not: null } },
  });

  console.log(`✅ Navios processados: ${total}`);
  console.log(`✅ Navios atualizados: ${atualizados}`);
  console.log(`📊 Navios com dados mínimos (MMSI+IMO+Porto): ${completos}/${total}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
