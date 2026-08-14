const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
(async () => {
  try {
    const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
    console.log('PrismaClient instantiated');
    await p.$disconnect();
    console.log('PrismaClient disconnected');
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
