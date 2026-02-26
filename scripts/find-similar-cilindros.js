#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const pattern = process.argv[2] || 'CIL-20260225';

(async ()=>{
  const prisma = new PrismaClient();
  try {
    const like = `%${pattern}%`;
    const rows = await prisma.$queryRaw`SELECT * FROM cilindros WHERE "numeroSerie" LIKE ${like} LIMIT 100`;
    if (!rows || rows.length === 0) {
      console.log('NOT_FOUND');
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
