const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const exist = await p.navio.findMany({ where: { matricula: 'PTHOR-117702-C' }, select: { id: true, nome: true } });
  if (exist.length) {
    console.log('ATENCAO: matricula ja usada por:', JSON.stringify(exist));
  } else {
    const n = await p.navio.update({ where: { id: 747 }, data: { nome: 'Conde de Porto Pim', matricula: 'PTHOR-117702-C', cfr: 'PRT000022994' } });
    console.log('Atualizado #747:', n.nome, '| mat:', n.matricula, '| cfr:', n.cfr);
  }
  const rest = await p.navio.findMany({ where: { matricula: 'N/D' }, select: { id: true, nome: true } });
  console.log('Navios N/D restantes:', rest.length);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
