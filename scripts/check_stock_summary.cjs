const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const allStock = await prisma.stock.findMany({
    orderBy: { referencia: 'asc' }
  });

  console.log(`Total de registos de stock na BD: ${allStock.length}`);

  // Deduplicar por referência (se houver duplicadas, manter a mais completa ou somar quantidades)
  const mapRef = new Map();
  const duplicates = [];

  for (const item of allStock) {
    const ref = String(item.referencia || "").trim().toUpperCase();
    if (!ref) continue;
    if (mapRef.has(ref)) {
      duplicates.push({ ref, id1: mapRef.get(ref).id, id2: item.id });
      // fundir quantidade se necessário
      const existing = mapRef.get(ref);
      existing.quantidade += item.quantidade;
      // remover o duplicado da BD
      await prisma.stock.delete({ where: { id: item.id } }).catch(() => {});
    } else {
      mapRef.set(ref, item);
    }
  }

  if (duplicates.length > 0) {
    console.log(`Foram encontradas e limpas ${duplicates.length} referências duplicadas.`);
  } else {
    console.log("Sem referências duplicadas detetadas.");
  }

  const finalStock = await prisma.stock.findMany({
    orderBy: [{ categoria: 'asc' }, { referencia: 'asc' }]
  });

  console.log(`\nTotal final de artigos únicos em stock: ${finalStock.length}\n`);

  const byCategory = {};
  for (const item of finalStock) {
    const cat = item.categoria || "DIVERSOS";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }

  for (const [cat, items] of Object.entries(byCategory).sort()) {
    console.log(`=== CATEGORIA: ${cat} (${items.length} artigos) ===`);
    for (const it of items) {
      console.log(`  [Ref: ${it.referencia}] ${it.descricao} | Qtd: ${it.quantidade} | Prateleira: ${it.localizacao || '-'} | P. Venda: €${it.precoVenda}`);
    }
    console.log("");
  }
}

run()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
