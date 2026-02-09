import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  console.log('\n📊 Importando especificações dos manuais...\n')

  // Verificar se arquivo existe
  const specFile = path.join(__dirname, '..', 'manual_specifications.json')
  if (!fs.existsSync(specFile)) {
    console.error('❌ manual_specifications.json não encontrado!')
    process.exit(1)
  }

  // Configurar Prisma
  const databaseUrl = process.env.DATABASE_URL
  const prismaAccelerateUrl = process.env.PRISMA_DATABASE_URL

  if (!databaseUrl && !prismaAccelerateUrl) {
    console.error('❌ DATABASE_URL ou PRISMA_DATABASE_URL não definida')
    process.exit(1)
  }

  const prismaConfig: any = { log: [] }

  if (prismaAccelerateUrl?.startsWith('prisma+postgres://')) {
    console.log('✅ Usando Prisma Accelerate')
    prismaConfig.accelerateUrl = prismaAccelerateUrl
  } else if (databaseUrl?.startsWith('postgres')) {
    console.log('✅ Usando PostgreSQL direto')
    const pool = new Pool({ connectionString: databaseUrl, max: 10 })
    prismaConfig.adapter = new PrismaPg(pool)
  }

  const prisma = new PrismaClient(prismaConfig).$extends(withAccelerate())

  try {
    const specs = JSON.parse(fs.readFileSync(specFile, 'utf-8'))

    let marcasCount = 0
    let modelosCount = 0

    for (const [key, data] of Object.entries(specs)) {
      const { marca: marcaNome, modelo: modeloNome } = data as any

      console.log(`📝 ${marcaNome} ${modeloNome}`)

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
        console.log(`   ✅ Marca criada`)
        marcasCount++
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
        modelosCount++
      } else {
        console.log(`   ⚙️  Modelo encontrado`)
      }
    }

    console.log(`\n✅ Sincronização completa!`)
    console.log(`   ${marcasCount} marcas adicionadas`)
    console.log(`   ${modelosCount} modelos adicionados\n`)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
