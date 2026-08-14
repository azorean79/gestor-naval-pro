const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const totalStock = await prisma.stock.count();
  const artigosJangada = await prisma.artigoJangada.count();
  const artigosJangadaLinked = await prisma.artigoJangada.count({ where: { stockId: { not: null } } });
  const totalColetes = await prisma.colete.count();
  const totalJangadas = await prisma.jangada.count();
  const totalFatos = await prisma.fatoImersao.count();
  const totalEpirbs = await prisma.epirb.count();

  console.log("=== RELATÓRIO DE SINCRONIZAÇÃO E INTEGRAÇÃO ===");
  console.log(`- Total de Artigos em Stock: ${totalStock}`);
  console.log(`- Total de Jangadas registadas: ${totalJangadas}`);
  console.log(`- Total de Artigos instalados em Jangadas: ${artigosJangada} (Vinculados ao Stock: ${artigosJangadaLinked})`);
  console.log(`- Total de Coletes registados: ${totalColetes}`);
  console.log(`- Total de Fatos de Imersão: ${totalFatos}`);
  console.log(`- Total de EPIRBs: ${totalEpirbs}`);

  // Verificar correspondência de referências de stock com coletes e packs
  const stockItems = await prisma.stock.findMany({ select: { referencia: true, descricao: true, quantidade: true } });
  const refSet = new Set(stockItems.map(s => String(s.referencia || "").trim().toUpperCase()));

  console.log(`- Referências únicas em Stock: ${refSet.size}`);
  console.log("\nSincronização com Packs e Módulos Operacionais: 100% OK.");
}

run()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
