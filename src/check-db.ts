import prisma from './lib/prisma';

async function main() {
  const stockItems = await prisma.stock.findMany();
  console.log("Stock count:", stockItems.length);
  console.log("Stock Items:", JSON.stringify(stockItems, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
