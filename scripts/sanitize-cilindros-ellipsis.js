const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Detecting text-like columns in cilindros...');
    // Try SQLite PRAGMA first
    let cols = [];
    try {
      const info = await prisma.$queryRawUnsafe(`PRAGMA table_info('cilindros')`);
      if (Array.isArray(info) && info.length) {
        cols = info.filter(c => c && c.type && /char|text|clob|varchar/i.test(c.type)).map(c => c.name);
      }
    } catch (e) {
      // fallback to information_schema (Postgres)
      try {
        const info = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cilindros'`;
        if (Array.isArray(info) && info.length) {
          cols = info.filter(c => c && c.data_type && /char|text|varchar/i.test(c.data_type)).map(c => c.column_name);
        }
      } catch (e2) {
        console.error('Failed to detect columns via information_schema:', e2.message || e2);
      }
    }

    if (!cols.length) {
      console.warn('No text-like columns detected for cilindros. Exiting.');
      return;
    }

    console.log('Text columns:', cols.join(', '));

    for (const col of cols) {
      try {
        // Use REPLACE to substitute real ellipsis (U+2026) with three dots
        const sql = `UPDATE cilindros SET "${col}" = REPLACE("${col}", '…', '...') WHERE "${col}" LIKE '%' || '…' || '%'`;
        // For SQLite the concatenation operator is || and REPLACE exists; for Postgres also works
        const res = await prisma.$executeRawUnsafe(sql);
        console.log(`Sanitized column ${col}`);
      } catch (e) {
        console.error(`Failed to sanitize column ${col}:`, e.message || e);
      }
    }

    console.log('Sanitization complete.');
  } catch (err) {
    console.error('Error while sanitizing DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
