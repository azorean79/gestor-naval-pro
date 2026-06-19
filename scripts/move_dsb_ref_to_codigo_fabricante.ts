import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function moveDSBReferencesToCodigoFabricante() {
  console.log("🔍 Buscando artigos DSB no stock...");

  // Buscar todos os artigos de stock
  const allStock = await prisma.stock.findMany();

  console.log(`📦 Total de artigos no stock: ${allStock.length}`);

  // Filtrar artigos que têm DSB nas marcas
  const dsbItems = allStock.filter((item) => {
    const marca = item.aplicavelMarcaJangada?.toUpperCase() || "";
    return marca.includes("DSB");
  });

  console.log(`🎯 Artigos com marca DSB encontrados: ${dsbItems.length}`);

  if (dsbItems.length === 0) {
    console.log("✅ Nenhum artigo DSB encontrado. Nada a fazer.");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const item of dsbItems) {
    const ref = item.referencia?.trim();
    
    // Se não tem referência, pular
    if (!ref) {
      console.log(`  ⏭️  ${item.id} - ${item.descricao} - sem referência`);
      skipped++;
      continue;
    }

    // Mover referência para código de fabricante
    await prisma.stock.update({
      where: { id: item.id },
      data: {
        codigoFabricante: ref,
      },
    });

    console.log(`  ✅ ${item.id} - ${item.descricao}`);
    console.log(`      Referência "${ref}" → Código de Fabricante`);
    updated++;
  }

  console.log("\n📊 Resumo:");
  console.log(`  ✅ Atualizados: ${updated}`);
  console.log(`  ⏭️  Ignorados (sem referência): ${skipped}`);
  console.log(`  📦 Total processados: ${dsbItems.length}`);
}

moveDSBReferencesToCodigoFabricante()
  .then(() => {
    console.log("\n✅ Script concluído com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro ao executar script:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
