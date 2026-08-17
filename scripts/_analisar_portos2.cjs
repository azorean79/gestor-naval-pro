const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const rows = await p.navio.findMany({ where: { portoRegisto: { not: null } }, select: { portoRegisto: true } });
  const porValor = {};
  for (const r of rows) {
    const v = r.portoRegisto;
    porValor[v] = (porValor[v] || 0) + 1;
  }
  const arr = Object.entries(porValor).sort((a, b) => b[1] - a[1]);
  console.log('Valores EXATOS distintos:', arr.length);
  for (const [v, c] of arr) console.log(`  ${JSON.stringify(v)}: ${c}`);

  const norm = (s) => String(s).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-');
  const porNorm = {};
  for (const r of rows) {
    const k = norm(r.portoRegisto);
    if (!porNorm[k]) porNorm[k] = new Set();
    porNorm[k].add(r.portoRegisto);
  }
  console.log('\nVariantes exatas por valor normalizado (com >1 variante):');
  for (const [k, set] of Object.entries(porNorm).sort()) {
    if (set.size > 1) console.log(`  ${JSON.stringify(k)} -> [${[...set].map((s) => JSON.stringify(s)).join(', ')}]`);
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
