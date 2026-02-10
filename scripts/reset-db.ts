import { PrismaClient } from '../prisma/app/generated-prisma-client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function resetDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set')
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 10 })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient();

  try {
    console.log('🗑️  Deletando todos os dados...')

    // Delete in order of foreign key dependencies
    await prisma.envio.deleteMany()
    await prisma.tarefa.deleteMany()
    await prisma.obra.deleteMany()
    await prisma.fatura.deleteMany()
    await prisma.agendamento.deleteMany()
    await prisma.certificado.deleteMany()
    await prisma.inspecao.deleteMany()
    await prisma.cilindro.deleteMany()
    await prisma.jangada.deleteMany()
    await prisma.navio.deleteMany()
    await prisma.notificacao.deleteMany()
    await prisma.cliente.deleteMany()
    await prisma.proprietario.deleteMany()
    
    console.log('✅ Base de dados limpa com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao limpar base de dados:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

resetDatabase()
  .catch((e) => {
    console.error('❌ Erro geral:', e)
    process.exit(1)
  })
