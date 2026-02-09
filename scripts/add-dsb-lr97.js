require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando marca DSB...');
    
    // Verificar se marca DSB existe
    const marcaResult = await client.query(
      'SELECT id FROM "marcas_jangada" WHERE nome = $1',
      ['DSB']
    );
    
    let marcaId;
    
    if (marcaResult.rows.length === 0) {
      console.log('📝 Marca DSB não encontrada. Criando...');
      
      // Criar marca DSB
      const createMarcaResult = await client.query(
        `INSERT INTO "marcas_jangada" (id, nome, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, NOW(), NOW())
         RETURNING id, nome`,
        ['DSB']
      );
      
      marcaId = createMarcaResult.rows[0].id;
      console.log('✅ Marca DSB criada!', marcaId);
    } else {
      marcaId = marcaResult.rows[0].id;
      console.log('✅ Marca DSB já existe!', marcaId);
    }
    
    // Verificar se modelo LR97 existe
    const modeloResult = await client.query(
      'SELECT id FROM "modelos_jangada" WHERE nome = $1 AND "marcaId" = $2',
      ['DSB LR97', marcaId]
    );
    
    if (modeloResult.rows.length > 0) {
      console.log('⚠️  Modelo DSB LR97 já existe');
      process.exit(0);
    }
    
    // Criar modelo LR97
    console.log('📝 Criando modelo DSB LR97...');
    
    const modeloInsertResult = await client.query(
      `INSERT INTO "modelos_jangada" (id, nome, "marcaId", ativo, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
       RETURNING id, nome`,
      ['DSB LR97', marcaId]
    );
    
    const novoModelo = modeloInsertResult.rows[0];
    
    console.log('\n✅ Modelo DSB LR97 criado com sucesso!');
    console.log('   ID:', novoModelo.id);
    console.log('   Nome:', novoModelo.nome);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
