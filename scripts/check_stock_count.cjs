const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const stockItems = await prisma.stock.findMany();
  console.log(`Total de artigos no stock: ${stockItems.length}`);

  let updatedPrices = 0;
  for (const item of stockItems) {
    let precoCompra = item.precoCompra;
    let precoVenda = item.precoVenda;
    let needsUpdate = false;

    if (precoCompra == null || precoCompra <= 0) {
      precoCompra = 10.0; // valor padrão
      needsUpdate = true;
    }
    if (precoVenda == null || precoVenda <= 0) {
      precoVenda = Math.round(precoCompra * 2 * 100) / 100; // margem 100% padrão
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.stock.update({
        where: { id: item.id },
        data: { precoCompra, precoVenda }
      });
      updatedPrices++;
    }
  }

  console.log(`Artigos com preços atualizados/preenchidos: ${updatedPrices}`);
  const sample = await prisma.stock.findMany({ take: 5, select: { referencia: true, descricao: true, precoCompra: true, precoVenda: true } });
  console.log("Amostra de artigos no stock com preços:", sample);
}

run()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
