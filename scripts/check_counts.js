const { Client } = require('pg');

const connectionString = 'postgres://6cf689fdb839385bbb4d2533ea87c0cd1db58e3dbb4f7d419345cecd0c9327e4:sk_B7jqGOKaurel1ubwg13X8@db.prisma.io:5432/postgres?sslmode=require';

const client = new Client({ connectionString, ssl: true });

(async function() {
  try {
    await client.connect();
    console.log('Connected to DB');
    const tables = ['Cliente', 'Navio', 'Jangada'];
    for (const t of tables) {
      try {
        const res = await client.query(`SELECT count(*)::int AS c FROM "${t}";`);
        console.log(`${t}: ${res.rows[0].c}`);
      } catch (err) {
        console.log(`${t}: ERROR - ${err.message}`);
      }
    }
    await client.end();
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
})();
