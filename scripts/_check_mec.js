const path = require('path');
const { PrismaClient } = require('@prisma/client');
const dbPath = path.join(__dirname, '..', 'prisma', 'local.db');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + dbPath } } });
prisma.colete.findMany({
  where: { mecanismoInflacao: { not: null } },
  select: { mecanismoInflacao: true },
  distinct: ['mecanismoInflacao']
}).then(r => {
  console.log('Valores existentes de mecanismoInflacao:', r.map(s => s.mecanismoInflacao));
  return prisma.$disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
