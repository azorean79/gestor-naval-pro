const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const comCfr = await p.navio.findMany({ where: { cfr: 'PRT000023140' }, include: { cliente: { select: { id: true, nome: true } } } });
  console.log('Navios com cfr PRT000023140:', JSON.stringify(comCfr, null, 1));

  const do2177 = await p.navio.findMany({ where: { clienteId: 2177 }, select: { id: true, nome: true, matricula: true, cfr: true } });
  console.log('Navios do cliente 2177:', JSON.stringify(do2177, null, 1));
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
