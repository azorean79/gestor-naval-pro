const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.stock.findMany({
  where: { codigoFabricante: { startsWith: "OSL" } },
  select: { referencia: true, descricao: true, codigoFabricante: true, precoCompra: true, precoVenda: true, quantidadeMinima: true, foto: true, categoria: true },
  take: 8,
  orderBy: { referencia: "asc" }
})
.then(r => {
  console.log("Sample:", JSON.stringify(r, null, 2));
})
.catch(console.error)
.finally(() => prisma.$disconnect());
