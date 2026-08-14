const path = require('path');
const { PrismaClient } = require('@prisma/client');
const dbPath = path.join(__dirname, '..', 'prisma', 'local.db');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + dbPath } } });
(async () => {
  try { await prisma.$executeRawUnsafe("ALTER TABLE Colete ADD COLUMN mecanismoValidade TEXT"); console.log('mecanismoValidade added'); } catch(e) { console.log('mecanismoValidade:', e.message); }
  await prisma.$disconnect();
})();
