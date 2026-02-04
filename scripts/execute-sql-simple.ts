import { Client } from 'pg'
import 'dotenv/config'

async function executeSQL() {
  const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Conectado ao banco de dados...')

    console.log('Executando INSERT na tabela tipos_pack...')

    // Insert SOLAS A com campos obrigatórios
    await client.query(`
      INSERT INTO tipos_pack (id, nome, ativo, "createdAt", "updatedAt") VALUES
      ('1', 'SOLAS A', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `)

    // Insert SOLAS B com campos obrigatórios
    await client.query(`
      INSERT INTO tipos_pack (id, nome, ativo, "createdAt", "updatedAt") VALUES
      ('2', 'SOLAS B', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `)

    console.log('✅ Dados inseridos com sucesso na tabela tipos_pack!')

    // Verificar dados inseridos
    console.log('📊 Verificando dados inseridos...')
    const result = await client.query('SELECT id, nome, ativo FROM tipos_pack ORDER BY id')
    console.log('Dados na tabela tipos_pack:', result.rows)

  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

executeSQL()