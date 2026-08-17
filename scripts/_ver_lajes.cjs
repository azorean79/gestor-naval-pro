const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });
(async () => {
  const r = await p.navio.findMany({ where: { portoRegisto: 'Lajes' }, select: { id: true, nome: true, matricula: true, ilha: true } });
  console.log(JSON.stringify(r, null, 2));
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
