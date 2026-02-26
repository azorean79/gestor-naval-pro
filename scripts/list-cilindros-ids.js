const { Client } = require('pg');

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('ERRO: DATABASE_URL não definida em env.');
    process.exit(2);
  }
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    const r = await client.query('SELECT id, "numeroSerie" FROM "cilindros" ORDER BY "createdAt" DESC NULLS LAST LIMIT 20');
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (err) {
    console.error('ERROR', String(err));
    process.exit(3);
  } finally {
    try { await client.end(); } catch(e){}
  }
}

main();
