const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const rows = await p.navio.findMany({ where: { portoRegisto: { not: null } }, select: { portoRegisto: true } });
  const norm = (s) => String(s).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-');
  const porNome = {};
  for (const r of rows) {
    const k = norm(r.portoRegisto);
    porNome[k] = (porNome[k] || 0) + 1;
  }
  const arr = Object.entries(porNome).sort((a, b) => b[1] - a[1]);
  console.log('Total navios com portoRegisto:', rows.length);
  console.log('Valores normalizados distintos:', arr.length);
  console.log('\nTop 60 por frequencia:');
  for (const [p, c] of arr.slice(0, 60)) console.log(`  ${c}\t${p}`);
  console.log('\nValores com 1 ocorrencia:', arr.filter(([, c]) => c === 1).length);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
