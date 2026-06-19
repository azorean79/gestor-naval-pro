const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.stock.findMany({
    where: { quantidadeMinima: { not: null, gt: 0 } },
    select: {
      referencia: true,
      codigoFabricante: true,
      descricao: true,
      categoria: true,
      quantidade: true,
      quantidadeMinima: true,
      observacoes: true,
    },
    orderBy: [{ categoria: 'asc' }, { codigoFabricante: 'asc' }],
  });

  const lacking = rows
    .filter(r => (r.quantidade ?? 0) < (r.quantidadeMinima ?? 0))
    .map(r => ({
      ...r,
      quantidade: r.quantidade ?? 0,
      falta: (r.quantidadeMinima ?? 0) - (r.quantidade ?? 0),
    }))
    .sort((a, b) => {
      const catCmp = (a.categoria ?? '').localeCompare(b.categoria ?? '');
      if (catCmp !== 0) return catCmp;
      return b.falta - a.falta;
    });

  console.log(`Total abaixo do mínimo: ${lacking.length}`);

  // --- Group summary by categoria ---
  const byCategory = {};
  for (const r of lacking) {
    const cat = r.categoria || '(sem categoria)';
    if (!byCategory[cat]) byCategory[cat] = { count: 0, totalFalta: 0 };
    byCategory[cat].count++;
    byCategory[cat].totalFalta += r.falta;
  }

  console.log('\n=== RESUMO POR CATEGORIA ===');
  for (const [cat, stats] of Object.entries(byCategory).sort((a, b) => b[1].totalFalta - a[1].totalFalta)) {
    console.log(`  ${cat}: ${stats.count} artigos, falta total = ${stats.totalFalta}`);
  }

  // --- CSV export ---
  const headers = ['Referencia', 'CodigoFabricante', 'Descricao', 'Categoria', 'QuantidadeAtual', 'QuantidadeMinima', 'Falta', 'Observacoes'];
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };

  const lines = [headers.join(',')];
  for (const r of lacking) {
    lines.push([
      escape(r.referencia),
      escape(r.codigoFabricante),
      escape(r.descricao),
      escape(r.categoria),
      escape(r.quantidade),
      escape(r.quantidadeMinima),
      escape(r.falta),
      escape(r.observacoes),
    ].join(','));
  }

  const outPath = path.join(__dirname, '..', 'stock_abaixo_minimo.csv');
  fs.writeFileSync(outPath, '\uFEFF' + lines.join('\r\n'), 'utf8'); // BOM for Excel
  console.log(`\n✅ CSV exportado: ${outPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
