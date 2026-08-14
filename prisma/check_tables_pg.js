const { Client } = require('pg');

const conn = process.env.GESTOR_DB || process.env.gestornavalpro_DATABASE_URL || process.env.DATABASE_URL;
if (!conn) {
  console.error('No connection string found in GESTOR_DB or gestornavalpro_DATABASE_URL or DATABASE_URL');
  process.exit(2);
}

(async function main(){
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log('public tables:');
    for (const r of res.rows) console.log('-', r.table_name);
    await client.end();
  } catch (e) {
    console.error('Query error:', e.message || e);
    try { await client.end(); } catch {};
    process.exit(1);
  }
})();
