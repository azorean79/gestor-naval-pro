const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const needle = '…';
  console.log('Searching for ellipsis character (U+2026) in key tables...');

  const clientes = await prisma.cliente.findMany({ where: { OR: [ { nome: { contains: needle } }, { observacoes: { contains: needle } } ] }, take: 50 });
  console.log(`clientes: ${clientes.length}`);
  clientes.forEach(c => console.log('cliente', c.id, c.nome));

  const jangadas = await prisma.jangada.findMany({ where: { OR: [ { nome: { contains: needle } }, { observacoes: { contains: needle } } ] }, take: 50 });
  console.log(`jangadas: ${jangadas.length}`);
  jangadas.forEach(j => console.log('jangada', j.id, j.nome));

  const items = await prisma.itemStock.findMany({ where: { OR: [ { nome: { contains: needle } }, { descricao: { contains: needle } }, { observacoes: { contains: needle } } ] }, take: 50 });
  console.log(`item_stock: ${items.length}`);
  items.forEach(it => console.log('itemStock', it.id, it.nome));

  const inspecoes = await prisma.inspecao.findMany({ where: { checklist: { contains: needle } }, take: 50 });
  console.log(`inspecoes with ellipsis in checklist: ${inspecoes.length}`);
  inspecoes.forEach(i => console.log('inspecao', i.id));

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
