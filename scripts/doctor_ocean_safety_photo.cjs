const { spawnSync } = require("child_process");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function runNodeScript(scriptRelativePath, args = []) {
  const scriptPath = path.resolve(__dirname, scriptRelativePath);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  return result.status ?? 1;
}

async function readStockPhotoByRef(ref) {
  const referencia = String(ref || "").trim().toUpperCase();
  if (!referencia) return null;
  return prisma.stock.findFirst({
    where: { referencia },
    select: {
      id: true,
      referencia: true,
      descricao: true,
      foto: true,
      updatedAt: true,
    },
  });
}

function isPhotoHealthy(value) {
  const foto = String(value || "").trim();
  return foto.startsWith("/ocean-safety-spares/") && foto.length > "/ocean-safety-spares/".length;
}

async function main() {
  const ref = String(process.argv[2] || "OSL9507").trim().toUpperCase();

  console.log(`🔎 [Doctor] Verificação inicial para ${ref}...`);
  const before = await readStockPhotoByRef(ref);

  if (!before) {
    console.log(`❌ [Doctor] Artigo ${ref} não encontrado na BD.`);
    process.exit(2);
    return;
  }

  console.log(`- Antes: foto=${before.foto || "NULL"}`);

  if (isPhotoHealthy(before.foto)) {
    console.log("✅ [Doctor] Foto já está correta. Nenhuma ação necessária.");
    process.exit(0);
    return;
  }

  console.log("🛠️ [Doctor] Foto ausente/incorreta. Executando backfill Ocean Safety...");
  const backfillStatus = runNodeScript("./backfill_ocean_safety_images.cjs");

  if (backfillStatus !== 0) {
    console.log(`❌ [Doctor] Backfill falhou com código ${backfillStatus}.`);
    process.exit(backfillStatus);
    return;
  }

  console.log(`🔁 [Doctor] Verificação final para ${ref}...`);
  const after = await readStockPhotoByRef(ref);

  if (!after) {
    console.log(`❌ [Doctor] Artigo ${ref} deixou de ser encontrado após o backfill (inesperado).`);
    process.exit(3);
    return;
  }

  console.log(`- Depois: foto=${after.foto || "NULL"}`);

  if (!isPhotoHealthy(after.foto)) {
    console.log("⚠️ [Doctor] Backfill executado mas a foto ainda não está no formato esperado.");
    process.exit(4);
    return;
  }

  console.log("✅ [Doctor] Correção concluída com sucesso.");
}

main()
  .catch((error) => {
    console.error("❌ [Doctor] Erro inesperado:", error?.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
