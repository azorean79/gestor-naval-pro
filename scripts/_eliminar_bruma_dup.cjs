const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const res = await p.navio.delete({ where: { id: 899 } });
  console.log('Eliminado #899', res.nome, res.matricula);

  const col = await p.navio.groupBy({ by: ['matricula'], _count: true, where: { matricula: { not: '' } } });
  const dups = col.filter((d) => d._count > 1 && d.matricula !== 'N/D');
  console.log('Matriculas duplicadas restantes (exceto N/D):', dups.length);
  for (const d of dups) console.log(`  "${d.matricula}" x${d._count}`);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
