const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });
(async () => {
  const n = await p.navio.findUnique({ where: { id: 752 }, select: { nome: true, ilha: true, portoRegisto: true } });
  console.log(JSON.stringify(n));
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
