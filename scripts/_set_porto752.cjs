const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });
(async () => {
  const r = await p.navio.update({ where: { id: 752 }, data: { portoRegisto: 'Ponta Delgada' } });
  console.log('atualizado:', r.nome, '->', r.portoRegisto);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
