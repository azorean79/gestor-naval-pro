const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const jaExiste = await p.navio.findMany({ where: { matricula: 'PTPDL-112872-L' }, select: { id: true, nome: true } });
  if (jaExiste.length) {
    console.log('Já existe navio com PTPDL-112872-L:', JSON.stringify(jaExiste));
  } else {
    const n = await p.navio.update({ where: { id: 997 }, data: { matricula: 'PTPDL-112872-L' } });
    console.log('Atualizado #997', n.nome, '->', n.matricula);
  }

  const col = await p.navio.groupBy({ by: ['matricula'], _count: true, where: { matricula: { not: '' } } });
  const dups = col.filter((d) => d._count > 1 && d.matricula !== 'N/D');
  console.log('Matriculas duplicadas restantes (exceto N/D):', dups.length);
  for (const d of dups) console.log(`  "${d.matricula}" x${d._count}`);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
