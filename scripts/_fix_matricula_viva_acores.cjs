const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const n = await p.navio.update({ where: { id: 19 }, data: { matricula: 'PTPDL-118616-C' } });
  console.log('Atualizado #19', n.nome, '->', n.matricula);

  const col = await p.navio.groupBy({ by: ['matricula'], _count: true, where: { matricula: { in: ['PTPDL-118609-C', 'PTPDL-118616-C'] } } });
  console.log('Matriculas agora:', JSON.stringify(col));

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
