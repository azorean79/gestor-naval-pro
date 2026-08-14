const path = require('path');
const { PrismaClient } = require('@prisma/client');
const dbPath = path.join(__dirname, '..', 'prisma', 'local.db');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + dbPath } } });
prisma.colete.findMany({
  where: { NOT: { mecanismoInflacao: null } },
  select: { id: true, serial: true, mecanismoInflacao: true },
  take: 10
}).then(r => {
  console.log('Colete with mecanismoInflacao:', JSON.stringify(r, null, 2));
  return prisma.$disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
