import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function buscarFoodRations() {
  console.log(`\n🔍 PROCURANDO FOOD RATIONS NO STOCK\n`);
  console.log(`${"=".repeat(100)}`);

  try {
    // Procurar por "Food Rations" ou "Rações" ou "Ration"
    const foodRations = await prisma.stock.findMany({
      where: {
        OR: [
          { descricao: { contains: "Food", mode: "insensitive" } },
          { descricao: { contains: "Ration", mode: "insensitive" } },
          { descricao: { contains: "Rações", mode: "insensitive" } },
          { descricao: { contains: "Racao", mode: "insensitive" } },
          { categoria: { contains: "Rações", mode: "insensitive" } },
        ],
      },
      orderBy: { referencia: "asc" },
    });

    console.log(`\n📦 FOOD RATIONS ENCONTRADAS NO STOCK:\n`);
    
    if (foodRations.length === 0) {
      console.log(`❌ Nenhuma Food Ration encontrada no stock!`);
      console.log(`\n   Procurando por categorias similares...`);
      
      const todasCategorias = await prisma.stock.findMany({
        select: { categoria: true },
        distinct: ["categoria"],
      });
      
      console.log(`\n   Categorias disponíveis:`);
      todasCategorias.forEach((cat) => {
        if (cat.categoria) console.log(`   • ${cat.categoria}`);
      });
      return;
    }

    foodRations.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.descricao}`);
      console.log(`   Referência: ${item.referencia}`);
      console.log(`   Categoria: ${item.categoria || "N/A"}`);
      console.log(`   Quantidade: ${item.quantidade}`);
      console.log(`   Preço: €${item.precoVenda}\n`);
    });

    console.log(`${"=".repeat(100)}\n`);
    console.log(`Para vincular, use uma das referências acima no comando:\n`);
    console.log(`   npx tsx scripts/vincular_food_rations.ts <REFERENCIA>\n`);
    console.log(`Exemplo:\n`);
    console.log(`   npx tsx scripts/vincular_food_rations.ts ${foodRations[0]?.referencia}\n`);

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarFoodRations();
