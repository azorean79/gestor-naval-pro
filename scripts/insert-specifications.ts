import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '.env') })
import { PrismaClient } from '@prisma/client'

async function insertSpecifications() {
  const ACCELERATE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19TTVZ5LXJiWktoUUtZMHpmSm5Yd3YiLCJhcGlfa2V5IjoiMDFLR0FCQjI2RjRQMTFTR0dQOEY5RjlCRkoiLCJ0ZW5hbnRfaWQiOiIyMDkxNzE0YjM5OTA5NzkzMzVjM2M1MWUxZjQxNTY0NGE0ZDk0ZmM5MzhkODU4NWY4MGExM2VlYjdkODQwOGZkIiwiaW50ZXJuYWxfc2VjcmV0IjoiN2U1MDI0MGUtYjdmYS00NjhjLTljZTQtZTM5NTA2OGQ1NmJlIn0.A-eGaWSZG_w0sMQ4BmVZ13ckdGeYuRb6lMG4T4yvblk";

  const prisma = new PrismaClient({
    accelerateUrl: ACCELERATE_URL
  });

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
