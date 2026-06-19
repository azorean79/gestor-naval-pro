import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyManualPartNumbers() {
  console.log("🔍 Verificando part numbers do manual...\n");

  // Buscar todos os artigos DSB/MK4
  const allStock = await prisma.stock.findMany({
    where: {
      OR: [
        { aplicavelMarcaJangada: { contains: "DSB", mode: "insensitive" } },
        { referencia: { startsWith: "MK4-" } },
        { referencia: { startsWith: "GEN-" } },
        { referencia: { startsWith: "PYR-" } },
      ],
    },
    orderBy: { id: "asc" },
  });

  console.log(`📦 Total de artigos DSB/Manual: ${allStock.length}\n`);

  let withCodigoFab = 0;
  let withoutCodigoFab = 0;
  let emptyCodigoFab = 0;

  console.log("📋 Artigos SEM código de fabricante ou com código vazio:\n");

  for (const item of allStock) {
    const codFab = item.codigoFabricante?.trim();
    
    if (!codFab || codFab === "") {
      console.log(`  ❌ ID ${item.id} - Ref: ${item.referencia} - ${item.descricao}`);
      console.log(`      Código Fabricante: ${codFab ? `"${codFab}"` : "VAZIO"}`);
      emptyCodigoFab++;
    } else {
      withCodigoFab++;
    }
  }

  if (emptyCodigoFab === 0) {
    console.log("  ✅ Todos os artigos têm código de fabricante!\n");
  }

  console.log("\n📊 Resumo:");
  console.log(`  ✅ Com código de fabricante: ${withCodigoFab}`);
  console.log(`  ❌ Sem código de fabricante: ${emptyCodigoFab}`);
  console.log(`  📦 Total: ${allStock.length}`);

  // Mostrar alguns exemplos de artigos COM código
  console.log("\n📋 Primeiros 10 artigos COM código de fabricante:");
  const withCode = allStock.filter(i => i.codigoFabricante?.trim()).slice(0, 10);
  for (const item of withCode) {
    console.log(`  ✓ ID ${item.id} - Ref: ${item.referencia} | Cód.Fab: ${item.codigoFabricante}`);
  }
}

verifyManualPartNumbers()
  .then(() => {
    console.log("\n✅ Verificação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
