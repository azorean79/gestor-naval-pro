import { PrismaClient } from '@prisma/client'

async function main() {
  // Set direct database URL for this script
  process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL

  // Create PrismaClient without accelerate for CLI operations
  const prisma = new PrismaClient()

  try {
    console.log('Executando INSERT na tabela tipos_pack...')

    // Insert SOLAS A
    await prisma.$executeRaw`
      INSERT INTO tipos_pack (nome, id) VALUES ('SOLAS A', '1')
      ON CONFLICT (id) DO NOTHING
    `

    // Insert SOLAS B
    await prisma.$executeRaw`
      INSERT INTO tipos_pack (nome, id) VALUES ('SOLAS B', '2')
      ON CONFLICT (id) DO NOTHING
    `

    console.log('✅ Dados inseridos com sucesso na tabela tipos_pack!')
    console.log('📊 Verificando dados inseridos...')

    const result = await prisma.$queryRaw`
      SELECT * FROM tipos_pack ORDER BY id
    `

    console.log('Dados na tabela tipos_pack:', result)

  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()