const pg = require('pg');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set in environment.');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  console.log('Connected to DB via pg.');

  // Get text-like columns
  const colsRes = await client.query(`
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE data_type IN ('text','character varying','character')
      AND table_schema NOT IN ('pg_catalog','information_schema')
    ORDER BY table_schema, table_name
  `);

  const cols = colsRes.rows;
  console.log(`Found ${cols.length} text/varchar columns.`);

  for (const c of cols) {
    const schema = c.table_schema;
    const table = c.table_name;
    const column = c.column_name;

    // find primary key columns for the table
    const pkRes = await client.query(
      `SELECT a.attname
       FROM pg_index i
       JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
       WHERE i.indrelid = (${"'" + schema + '.' + table + "'"})::regclass AND i.indisprimary`
    );

    if (!pkRes.rows.length) {
      console.log(`Skipping ${schema}.${table}.${column} — no primary key found.`);
      continue;
    }

    const pkCols = pkRes.rows.map(r => r.attname);
    const pkSelect = pkCols.map(n => `"${n}"`).join(', ');
    console.log(`Processing ${schema}.${table}.${column} (pk: ${pkCols.join(',')})`);

    // process in batches
    const batchSize = 500;
    let offset = 0;
    let updates = 0;

    while (true) {
      const q = `SELECT ${pkSelect}, "${column}" FROM "${schema}"."${table}" WHERE "${column}" IS NOT NULL LIMIT ${batchSize} OFFSET ${offset}`;
      const res = await client.query(q);
      if (!res.rows.length) break;

      for (const row of res.rows) {
        const original = row[column];
        if (original == null) continue;
        try {
          const normalized = original.normalize && typeof original.normalize === 'function'
            ? original.normalize('NFKC').replace(/\u2026/g, '...')
            : original.replace(/\u2026/g, '...');

          if (normalized !== original) {
            // build WHERE clause for pk
            const whereParts = [];
            const values = [];
            let idx = 1;
            for (const pk of pkCols) {
              whereParts.push(`"${pk}" = $${idx}`);
              values.push(row[pk]);
              idx++;
            }
            // value param
            values.push(normalized);
            const updateSql = `UPDATE "${schema}"."${table}" SET "${column}" = $${idx} WHERE ${whereParts.join(' AND ')}`;
            await client.query(updateSql, values);
            updates++;
          }
        } catch (e) {
          console.error(`Error processing ${schema}.${table} id=${pkCols.map(k=>row[k]).join(',')}:`, e.message);
        }
      }

      offset += batchSize;
    }

    console.log(`Finished ${schema}.${table}.${column} — updates: ${updates}`);
  }

  await client.end();
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
