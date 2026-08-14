const path = require('path');
const { PrismaClient } = require('@prisma/client');
const dbPath = path.join(__dirname, '..', 'prisma', 'local.db');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + dbPath } } });
prisma.$executeRawUnsafe("ALTER TABLE Colete ADD COLUMN mecanismoInflacao TEXT")
  .then(() => { console.log('Column added successfully'); return prisma.$disconnect(); })
  .catch(e => { console.log('Error or already exists:', e.message); return prisma.$disconnect(); });
