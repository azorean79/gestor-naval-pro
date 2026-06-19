const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const normalizeText = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const parseDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const addMonths = (base, months) => {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
};

async function main() {
  const fetchArtigos = async () => {
    try {
      return await prisma.$queryRawUnsafe('SELECT "id", "name", "referencia", "quantidade", "validade", "jangadaId" FROM "ArtigoJangada"');
    } catch {
      return await prisma.$queryRawUnsafe('SELECT "id", "name", "referencia", "quantidade", "validade", "jangadaId" FROM "artigojangada"');
    }
  };

  const fetchStock = async () => {
    try {
      return await prisma.$queryRawUnsafe('SELECT "id", "descricao", "referencia", "quantidade" FROM "Stock"');
    } catch {
      return await prisma.$queryRawUnsafe('SELECT "id", "descricao", "referencia", "quantidade" FROM "stock"');
    }
  };

  const [artigos, stock] = await Promise.all([fetchArtigos(), fetchStock()]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in12Months = addMonths(today, 12);

  const within12 = artigos.filter((a) => {
    const d = parseDate(a.validade);
    return d && d <= in12Months;
  });

  const monthlyByNeedKey = new Map();
  for (const a of within12) {
    const d = parseDate(a.validade);
    if (!d) continue;
    const m = monthKey(d);
    const qty = Number(a.quantidade || 0);
    const refNorm = normalizeText(a.referencia);
    const nameNorm = normalizeText(a.name);
    const key = refNorm ? `ref:${refNorm}` : `name:${nameNorm}`;
    if (!monthlyByNeedKey.has(key)) monthlyByNeedKey.set(key, new Map());
    const mm = monthlyByNeedKey.get(key);
    mm.set(m, (mm.get(m) || 0) + qty);
  }

  const stockRows = stock.map((s) => {
    const refKey = `ref:${normalizeText(s.referencia)}`;
    const nameKey = `name:${normalizeText(s.descricao)}`;
    const key = monthlyByNeedKey.has(refKey) ? refKey : (monthlyByNeedKey.has(nameKey) ? nameKey : null);
    const monthMap = key ? monthlyByNeedKey.get(key) : new Map();
    const mensal = Array.from(monthMap.entries()).map(([month, quantidade]) => ({ month, quantidade })).sort((a, b) => a.month.localeCompare(b.month));
    const necessidade12m = mensal.reduce((acc, r) => acc + r.quantidade, 0);
    return {
      id: s.id,
      referencia: s.referencia,
      nome: s.descricao,
      stockAtual: s.quantidade,
      necessidade12m,
      saldoProjetado12m: (s.quantidade || 0) - necessidade12m,
      mensal,
    };
  }).sort((a, b) => b.necessidade12m - a.necessidade12m);

  const monthlyTotals = new Map();
  for (const r of stockRows) {
    for (const m of r.mensal) monthlyTotals.set(m.month, (monthlyTotals.get(m.month) || 0) + m.quantidade);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    summary: {
      artigosComValidadeAte12Meses: within12.length,
      artigosVencidos: within12.filter((a) => {
        const d = parseDate(a.validade);
        return d && d < today;
      }).length,
      quantidadeTotalNecessaria12m: within12.reduce((acc, a) => acc + Number(a.quantidade || 0), 0),
      jangadasAfetadas: new Set(within12.map((a) => a.jangadaId)).size,
      necessidadesMensaisTotais: Array.from(monthlyTotals.entries()).map(([month, quantidade]) => ({ month, quantidade })).sort((a, b) => a.month.localeCompare(b.month)),
    },
    topStockNeeds: stockRows.filter((r) => r.necessidade12m > 0).slice(0, 20),
  };

  console.log(JSON.stringify(output, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
