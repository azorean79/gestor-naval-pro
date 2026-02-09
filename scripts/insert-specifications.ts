import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '.env') })
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'


async function insertSpecifications() {
  // Initialize Prisma with proper configuration
  const databaseUrl = process.env.DATABASE_URL || ''
  const prismaAccelerateUrl = process.env.PRISMA_DATABASE_URL || ''

  const prismaConfig: any = {
    log: [],
  }

  if (prismaAccelerateUrl && prismaAccelerateUrl.startsWith('prisma+postgres://')) {
    prismaConfig.accelerateUrl = prismaAccelerateUrl
  } else if (databaseUrl && databaseUrl.startsWith('postgres')) {
    const pool = new Pool({ connectionString: databaseUrl, max: 10 })
    prismaConfig.adapter = new PrismaPg(pool)
  } else {
    throw new Error('DATABASE_URL or PRISMA_DATABASE_URL must be set')
  }

  const prisma = new PrismaClient(prismaConfig).$extends(withAccelerate())

  try {
    console.log('\n📊 Inserindo marcas e modelos no banco de dados...\n')

    // Ler arquivo de especificações
    const specFile = path.join(__dirname, '..', 'especificacoes-unificadas.json')
    const specs = JSON.parse(fs.readFileSync(specFile, 'utf-8'))

    for (const [key, data] of Object.entries(specs)) {
      const { marca: marcaNome, modelo: modeloNome } = data as any

      console.log(`📝 Processando: ${marcaNome} ${modeloNome}`)

      try {
        // 1. Encontrar ou criar marca
        let marca = await prisma.marcaJangada.findFirst({
          where: { nome: marcaNome },
        })

        if (!marca) {
          marca = await prisma.marcaJangada.create({
            data: {
              nome: marcaNome,
              ativo: true,
            },
          })
          console.log(`   ✅ Marca criada: ${marca.nome}`)
        } else {
          console.log(`   ⚙️  Marca encontrada`)
        }

        // 2. Encontrar ou criar modelo
        let modelo = await prisma.modeloJangada.findFirst({
          where: {
            nome: modeloNome,
            marcaId: marca.id,
          },
        })

        if (!modelo) {
          modelo = await prisma.modeloJangada.create({
            data: {
              nome: modeloNome,
              marcaId: marca.id,
              ativo: true,
            },
          })
          console.log(`   ✅ Modelo criado`)
        } else {
          console.log(`   ⚙️  Modelo encontrado`)
        }

        console.log()
      } catch (error) {
        console.error(`   ❌ Erro:`, (error as any).message)
      }
    }

    console.log('✅ Inserção completa!')
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

insertSpecifications().catch(console.error)
