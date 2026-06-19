import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function restoreManualRefsToCodigoFabricante() {
  console.log("🔍 Buscando artigos com referências de manual...\n");

  // Padrões de referências de manuais
  const manualPrefixes = ["MK4-", "GEN-", "PYR-", "LR97-"];

  // Buscar todos os artigos
  const allStock = await prisma.stock.findMany();
  console.log(`📦 Total de artigos no stock: ${allStock.length}`);

  // Filtrar artigos que têm referências de manual
  const manualItems = allStock.filter((item) => {
    const ref = item.referencia || "";
    return manualPrefixes.some((prefix) => ref.startsWith(prefix));
  });

  console.log(`🎯 Artigos com referências de manual: ${manualItems.length}\n`);

  if (manualItems.length === 0) {
    console.log("✅ Nenhum artigo de manual encontrado.");
    return;
  }

  let updated = 0;
  let alreadyCorrect = 0;

  for (const item of manualItems) {
    const ref = item.referencia!;
    
    // Verificar se o código de fabricante já está correto
    if (item.codigoFabricante === ref) {
      console.log(`  ✓ ${item.id} - Já correto: ${ref}`);
      alreadyCorrect++;
      continue;
    }

    // Atualizar código de fabricante com a referência
    await prisma.stock.update({
      where: { id: item.id },
      data: {
        codigoFabricante: ref,
      },
    });

    console.log(`  ✅ ${item.id} - ${item.descricao}`);
    console.log(`      Código Fabricante atualizado: "${ref}"`);
    updated++;
  }

  console.log("\n📊 Resumo:");
  console.log(`  ✅ Atualizados: ${updated}`);
  console.log(`  ✓ Já corretos: ${alreadyCorrect}`);
  console.log(`  📦 Total processados: ${manualItems.length}`);
}

restoreManualRefsToCodigoFabricante()
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
