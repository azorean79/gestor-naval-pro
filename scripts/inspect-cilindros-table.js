const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.$queryRawUnsafe("PRAGMA table_info('cilindros');");
    // convert BigInt fields to strings for safe JSON
    const safe = (Array.isArray(res) ? res : []).map(row => {
      const out = {};
      for (const k of Object.keys(row || {})) {
        const v = row[k];
        out[k] = (typeof v === 'bigint') ? v.toString() : v;
      }
      return out;
    });
    console.log(JSON.stringify(safe, null, 2));
  } catch (e) {
    console.error('Error running PRAGMA:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
