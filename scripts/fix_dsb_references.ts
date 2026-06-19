import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDSBReferences() {
  console.log("🔍 Buscando artigos DSB com código de fabricante...");

  // Buscar todos os artigos de stock
  const allStock = await prisma.stock.findMany();

  // Filtrar artigos que têm DSB nas marcas e já têm código de fabricante
  const dsbItems = allStock.filter((item) => {
    const marca = item.aplicavelMarcaJangada?.toUpperCase() || "";
    return marca.includes("DSB") && item.codigoFabricante;
  });

  console.log(`🎯 Artigos DSB com código de fabricante: ${dsbItems.length}`);

  if (dsbItems.length === 0) {
    console.log("✅ Nenhum artigo DSB encontrado para corrigir.");
    return;
  }

  let updated = 0;

  for (const item of dsbItems) {
    const codFab = item.codigoFabricante!;
    
    // Gerar nova referência baseada no código de fabricante
    // Se já começar com prefixo conhecido, manter; senão adicionar DSB-
    let newRef = codFab;
    if (!codFab.match(/^(MK4-|GEN-|PYR-|DSB-)/i)) {
      newRef = `DSB-${codFab}`;
    }
    
    // Se a referência atual já é diferente do código de fabricante, não fazer nada
    if (item.referencia === codFab) {
      console.log(`  ⏭️  ${item.id} - Referência já correta: ${item.referencia}`);
      continue;
    }

    // Verificar se a nova referência já existe (para evitar duplicados)
    const exists = await prisma.stock.findUnique({
      where: { referencia: newRef },
    });

    if (exists && exists.id !== item.id) {
      // Se já existe, adicionar sufixo
      newRef = `${newRef}-${item.id}`;
      console.log(`  ⚠️  ${item.id} - Conflito detectado, usando: ${newRef}`);
    }

    // Atualizar a referência
    await prisma.stock.update({
      where: { id: item.id },
      data: {
        referencia: newRef,
      },
    });

    console.log(`  ✅ ${item.id} - ${item.descricao}`);
    console.log(`      Referência: "${item.referencia}" → "${newRef}"`);
    console.log(`      Código Fabricante: "${codFab}"`);
    updated++;
  }

  console.log("\n📊 Resumo:");
  console.log(`  ✅ Atualizados: ${updated}`);
  console.log(`  📦 Total processados: ${dsbItems.length}`);
}

fixDSBReferences()
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
