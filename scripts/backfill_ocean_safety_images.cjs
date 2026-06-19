const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

function normalizeRef(value) {
  return String(value || "").trim().toUpperCase();
}

async function main() {
  const mapPath = path.resolve(__dirname, "../documentacao/ocean_safety_image_map.json");
  if (!fs.existsSync(mapPath)) {
    throw new Error(`Ficheiro não encontrado: ${mapPath}`);
  }

  const rawMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
  const entries = Object.entries(rawMap)
    .map(([ref, foto]) => ({
      referencia: normalizeRef(ref),
      foto: String(foto || "").trim(),
    }))
    .filter((row) => row.referencia && row.foto);

  if (entries.length === 0) {
    console.log("⚠️  Nenhuma entrada válida no mapeamento de fotos.");
    return;
  }

  const refs = entries.map((row) => row.referencia);
  const stockRows = await prisma.stock.findMany({
    where: {
      referencia: { in: refs },
    },
    select: {
      id: true,
      referencia: true,
      foto: true,
    },
  });

  const byRef = new Map(stockRows.map((row) => [normalizeRef(row.referencia), row]));

  let updated = 0;
  let alreadyOk = 0;
  let missingInDb = 0;
  const missingRefs = [];

  for (const row of entries) {
    const dbItem = byRef.get(row.referencia);
    if (!dbItem) {
      missingInDb += 1;
      if (missingRefs.length < 50) missingRefs.push(row.referencia);
      continue;
    }

    if (String(dbItem.foto || "").trim() === row.foto) {
      alreadyOk += 1;
      continue;
    }

    await prisma.stock.update({
      where: { id: dbItem.id },
      data: { foto: row.foto },
    });
    updated += 1;
  }

  const checkRef = "OSL9507";
  const check = await prisma.stock.findFirst({
    where: { referencia: checkRef },
    select: { id: true, referencia: true, foto: true },
  });

  console.log("\n✅ Backfill Ocean Safety fotos concluído");
  console.log(`- Total no mapa: ${entries.length}`);
  console.log(`- Atualizados: ${updated}`);
  console.log(`- Já corretos: ${alreadyOk}`);
  console.log(`- Não encontrados na BD: ${missingInDb}`);

  if (missingRefs.length > 0) {
    console.log("- Exemplos não encontrados:", missingRefs.join(", "));
  }

  if (check) {
    console.log(`- Verificação ${checkRef}: foto=${check.foto || "NULL"}`);
  } else {
    console.log(`- Verificação ${checkRef}: artigo não encontrado na BD`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Erro no backfill de fotos Ocean Safety:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
