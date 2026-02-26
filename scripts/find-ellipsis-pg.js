const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set in environment. Set it and re-run.');
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });

async function main() {
  await client.connect();
  console.log('Connected to DB via pg. Scanning for U+2026...');

  const tablesRes = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`);
  const results = [];

  for (const row of tablesRes.rows) {
    const table = row.table_name;
    try {
      const colsRes = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND (data_type ILIKE 'text' OR data_type ILIKE 'character varying' OR data_type ILIKE 'varchar')`,
        [table]
      );

      for (const c of colsRes.rows) {
        const col = c.column_name;
        try {
          const pattern = `%\u2026%`;
          const q = `SELECT id FROM "${table}" WHERE "${col}" LIKE $1 LIMIT 100`;
          const r = await client.query(q, [pattern]);
          if (r.rows.length) {
            results.push({ table, column: col, ids: r.rows.map(rw => rw.id) });
            console.log(`Found ${r.rows.length} in ${table}.${col}`);
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
    console.log('No occurrences of U+2026 found.');
  } else {
    console.log('\nSummary:');
    for (const r of results) {
      console.log(`${r.table}.${r.column} -> ${r.ids.slice(0,50).join(', ')}${r.ids.length>50?', ...':''}`);
    }
  }

  await client.end();
}

main().catch(err => {
  console.error('Scan failed:', err.message);
  client.end().finally(() => process.exit(1));
});
