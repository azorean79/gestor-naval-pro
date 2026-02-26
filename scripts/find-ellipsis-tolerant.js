const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Tolerant scan for ellipsis character (U+2026) in public schema...');

  // Get user tables in public schema
  const tables = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`
  );

  const results = [];

  for (const row of tables) {
    const table = row.table_name;
    try {
      const cols = await prisma.$queryRawUnsafe(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='${table}' AND (data_type ILIKE 'text' OR data_type ILIKE 'character varying' OR data_type ILIKE 'varchar')`
      );

      for (const c of cols) {
        const col = c.column_name;
        try {
          const sql = `SELECT id FROM "${table}" WHERE "${col}" LIKE '%' || chr(8230) || '%' LIMIT 100`;
          const rows = await prisma.$queryRawUnsafe(sql);
          if (rows && rows.length) {
            results.push({ table, column: col, ids: rows.map(r => r.id) });
            console.log(`Found ${rows.length} in ${table}.${col}`);
          }
        } catch (colErr) {
          console.warn(`Query failed for ${table}.${col}: ${colErr.message}`);
        }
      }
    } catch (tErr) {
      console.warn(`Skipping table ${table} due to error: ${tErr.message}`);
    }
  }

  if (results.length === 0) {
    console.log('No occurrences of U+2026 found (or none returned by queries).');
  } else {
    console.log('\nSummary of affected rows (table.column -> ids):');
    for (const r of results) {
      console.log(`${r.table}.${r.column} -> ${r.ids.slice(0,50).join(', ')}${r.ids.length>50?', ...':''}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Scan failed:', e.message);
  try { await prisma.$disconnect(); } catch (e) {}
  process.exit(1);
});
