#!/usr/bin/env node
const { PrismaClient, Prisma } = require('@prisma/client');
(async ()=>{
  const prisma = new PrismaClient();
  try {
    const tipo = null;
    const status = null;
    const search = 'CIL-UPSERT-TEST';
    const page = 1;
    const limit = 10;
    const skip = (page-1)*limit;
    const whereParts = [];
    if (tipo) whereParts.push(Prisma.sql`"tipo" = ${tipo}`);
    if (status) whereParts.push(Prisma.sql`"status" = ${status}`);
    if (search) {
      const s = `%${search}%`;
      whereParts.push(Prisma.sql`("numeroSerie" LIKE ${s} OR "fabricante" LIKE ${s} OR "modelo" LIKE ${s})`);
    }
    const whereSql = whereParts.length ? Prisma.sql`WHERE ${Prisma.join(whereParts, Prisma.sql` AND `)}` : Prisma.sql``;
    const q = Prisma.sql`SELECT * FROM cilindros ${whereSql} ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${skip}`;
    console.log('Running raw query...');
    const rows = await prisma.$queryRaw(q);
    console.log('ROWS:', rows.length);
  } catch (err) { console.error('ERR', err); process.exit(2);} finally { await prisma.$disconnect(); }
})();
