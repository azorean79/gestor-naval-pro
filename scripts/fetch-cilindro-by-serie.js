#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const numero = process.argv[2] || 'CIL-20260225-LEAF';

(async ()=> {
  const prisma = new PrismaClient();
  try {
    const cilindro = await prisma.cilindro.findFirst({ where: { numeroSerie: numero } });
    if (!cilindro) {
      console.log('NOT_FOUND');
      process.exit(0);
    }
    console.log(JSON.stringify(cilindro, null, 2));
  } catch (err) {
    console.error('ERROR', err && err.message ? err.message : err);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
})();
