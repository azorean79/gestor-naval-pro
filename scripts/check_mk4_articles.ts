import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkMK4Articles() {
  console.log("🔍 Verificando artigos MK4 na base de dados...\n");

  // Contar todos os artigos
  const totalCount = await prisma.stock.count();
  console.log(`📦 Total de artigos no stock: ${totalCount}`);

  // Contar artigos MK4
  const mk4Count = await prisma.stock.count({
    where: {
      OR: [
        { referencia: { startsWith: "MK4-" } },
        { codigoFabricante: { startsWith: "MK4-" } },
        { aplicavelMarcaJangada: { contains: "DSB", mode: "insensitive" } },
      ],
    },
  });
  console.log(`🎯 Artigos MK4/DSB encontrados: ${mk4Count}\n`);

  // Buscar primeiros 10 artigos MK4 por ordem decrescente de ID
  const mk4ArticlesDesc = await prisma.stock.findMany({
    where: {
      OR: [
        { referencia: { startsWith: "MK4-" } },
        { codigoFabricante: { startsWith: "MK4-" } },
      ],
    },
    orderBy: { id: "desc" },
    take: 10,
  });

  console.log("📋 Últimos 10 artigos MK4 (ordem decrescente por ID):");
  for (const item of mk4ArticlesDesc) {
    console.log(`  ID: ${item.id} | Ref: ${item.referencia} | Cód.Fab: ${item.codigoFabricante} | ${item.descricao}`);
  }

  // Buscar artigos MK4 por ordem crescente de ID
  const mk4ArticlesAsc = await prisma.stock.findMany({
    where: {
      OR: [
        { referencia: { startsWith: "MK4-" } },
        { codigoFabricante: { startsWith: "MK4-" } },
      ],
    },
    orderBy: { id: "asc" },
    take: 10,
  });

  console.log("\n📋 Primeiros 10 artigos MK4 (ordem crescente por ID):");
  for (const item of mk4ArticlesAsc) {
    console.log(`  ID: ${item.id} | Ref: ${item.referencia} | Cód.Fab: ${item.codigoFabricante} | ${item.descricao}`);
  }

  // Verificar artigo com ID mais alto
  const maxIdArticle = await prisma.stock.findFirst({
    orderBy: { id: "desc" },
  });

  console.log(`\n🔝 Artigo com ID mais alto:`);
  console.log(`  ID: ${maxIdArticle?.id} | Ref: ${maxIdArticle?.referencia} | ${maxIdArticle?.descricao}`);

  // Verificar se há artigos MK4 com IDs altos que podem estar fora do limite de 5000
  const mk4WithHighIds = await prisma.stock.findMany({
    where: {
      AND: [
        {
          OR: [
            { referencia: { startsWith: "MK4-" } },
            { codigoFabricante: { startsWith: "MK4-" } },
          ],
        },
        { id: { gt: (maxIdArticle?.id || 0) - 100 } }, // Últimos 100 IDs
      ],
    },
    orderBy: { id: "desc" },
  });

  console.log(`\n📊 Artigos MK4 nos últimos 100 IDs: ${mk4WithHighIds.length}`);
  if (mk4WithHighIds.length > 0) {
    console.log("Detalhes:");
    for (const item of mk4WithHighIds.slice(0, 5)) {
      console.log(`  ID: ${item.id} | Ref: ${item.referencia} | ${item.descricao}`);
    }
  }
}

checkMK4Articles()
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
