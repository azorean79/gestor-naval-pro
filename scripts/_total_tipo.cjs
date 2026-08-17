const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const all = await p.navio.findMany({ select: { id: true, tipoPesca: true, matricula: true, ilha: true } });
  const porTipo = {};
  for (const n of all) {
    const t = n.tipoPesca || '(vazio)';
    porTipo[t] = (porTipo[t] || 0) + 1;
  }
  console.log('Total navios na BD:', all.length);
  console.log('\nPor tipoPesca (todos):');
  for (const [t, c] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) console.log(`  ${t}: ${c}`);

  const porIlha = {};
  for (const n of all) {
    const i = n.ilha || '(vazio)';
    porIlha[i] = (porIlha[i] || 0) + 1;
  }
  console.log('\nPor ilha (todos):');
  for (const [i, c] of Object.entries(porIlha).sort((a, b) => b[1] - a[1])) console.log(`  ${i}: ${c}`);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
