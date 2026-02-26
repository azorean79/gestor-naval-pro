#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

(async ()=>{
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRaw`SELECT * FROM cilindros ORDER BY "createdAt" DESC LIMIT 50`;
    if (!rows || rows.length === 0) {
      console.log('NO_ROWS');
      process.exit(0);
    }
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('ERROR', err && err.message ? err.message : err);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
})();
