require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Buscando marca DSB...');
    
    // Encontrar marca DSB
    const marcaResult = await client.query('SELECT id FROM "marcas_jangada" WHERE nome = $1', ['DSB']);
    
    if (marcaResult.rows.length === 0) {
      console.error('❌ Marca DSB não encontrada');
      process.exit(1);
    }
    
    const marcaId = marcaResult.rows[0].id;
    console.log('✅ Marca DSB encontrada, ID:', marcaId);
    
    // Verificar se modelo já existe
    const modeloResult = await client.query(
      'SELECT id FROM "modelos_jangada" WHERE nome = $1 AND "marcaId" = $2',
      ['DSB LR97', marcaId]
    );
    
    if (modeloResult.rows.length > 0) {
      console.log('⚠️  Modelo DSB LR97 já existe');
      process.exit(0);
    }
    
    // Inserir novo modelo
    console.log('📝 Criando modelo DSB LR97...');
    
    const insertResult = await client.query(
      `INSERT INTO "modelos_jangada" (id, nome, descricao, capacidade, tipo, "marcaId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, nome, capacidade`,
      ['DSB LR97', 'Liferaft modelo LR97 da marca DSB', 25, 'SOLAS', marcaId]
    );
    
    const novoModelo = insertResult.rows[0];
    
    console.log('\n✅ Modelo DSB LR97 criado com sucesso!');
    console.log('   ID:', novoModelo.id);
    console.log('   Nome:', novoModelo.nome);
    console.log('   Capacidade:', novoModelo.capacidade);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
