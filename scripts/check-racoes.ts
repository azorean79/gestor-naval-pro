import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Ver todos os stock items com referencia 30202084
  const items = await prisma.stock.findMany({ where: { referencia: "30202084" } });
  console.log("Items com ref 30202084:", JSON.stringify(items.map(i => ({ id: i.id, descricao: i.descricao, categoria: i.categoria })), null, 2));

  // Ver se existe item com nome de racoes mas referencia diferente
  const racoes = await prisma.stock.findMany({
    where: { descricao: { contains: "racao", mode: "insensitive" } }
  });
  console.log("Items com racao no nome:", JSON.stringify(racoes.map(i => ({ id: i.id, descricao: i.descricao, referencia: i.referencia })), null, 2));

  await prisma.();
}
main().catch(e => { console.error(e); process.exit(1); });
