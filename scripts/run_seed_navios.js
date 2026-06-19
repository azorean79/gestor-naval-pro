// scripts/run_seed_navios.js
// Executa o seed_navios.sql no banco Postgres usando node-postgres

const fs = require('fs');
const { Client } = require('pg');

// Connection string fornecida
const connectionString = 'postgres://6cf689fdb839385bbb4d2533ea87c0cd1db58e3dbb4f7d419345cecd0c9327e4:sk_eLtmuuIkpTqaU8cukrfno@db.prisma.io:5432/postgres?sslmode=require';

// Caminho do arquivo SQL
const sqlFilePath = __dirname + '/../prisma/seed_navios.sql';

async function runSeed() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    // Divide por ";" para executar múltiplos comandos
    const statements = sql.split(/;\s*\n/).filter(Boolean);
    for (const stmt of statements) {
      if (stmt.trim()) {
        await client.query(stmt);
      }
    }
    console.log('Seed concluído com sucesso!');
  } catch (err) {
    console.error('Erro ao rodar seed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
