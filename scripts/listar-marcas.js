require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Listando marcas existentes...\n');
    
    const result = await client.query('SELECT id, nome FROM "marcas_jangada" ORDER BY nome');
    
    if (result.rows.length === 0) {
      console.log('Nenhuma marca encontrada');
    } else {
      result.rows.forEach(row => {
        console.log(`  - ${row.nome} (${row.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
