import { config } from 'dotenv'
config()

import { PrismaClient } from '../prisma/app/generated-prisma-client'
// ...existing code...

const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || ''
const isDatabaseUrlAccelerate = databaseUrl.startsWith('prisma+postgres://')

// ...existing code...
  log: ['error', 'warn'],
}

if (isDatabaseUrlAccelerate) {
// ...existing code...
}

const prisma = new PrismaClient();

async function main() {
  try {
    // Encontrar marca DSB
    const marcaDSB = await prisma.marcaJangada.findUnique({
      where: { nome: 'DSB' }
    })

    if (!marcaDSB) {
      console.error('❌ Marca DSB não encontrada')
      process.exit(1)
    }

    console.log('✅ Marca DSB encontrada:', marcaDSB.id)

    // Verificar se modelo LR97 já existe
    const modeloExistente = await prisma.modeloJangada.findFirst({
      where: {
        nome: 'DSB LR97',
        marcaId: marcaDSB.id
      }
    })

    if (modeloExistente) {
      console.log('⚠️  Modelo DSB LR97 já existe')
      process.exit(0)
    }

    // Criar modelo LR97
    const modeloNovo = await prisma.modeloJangada.create({
      data: {
        nome: 'DSB LR97',
        marcaId: marcaDSB.id,
        sistemaInsuflacao: 'THANNER',
        valvulasPadrao: 'OTS65',
        ativo: true
      }
    })

    console.log('✅ Modelo DSB LR97 criado com sucesso!')
    console.log('   ID:', modeloNovo.id)
    console.log('   Nome:', modeloNovo.nome)
    console.log('   Marca:', modeloNovo.marcaId)
    console.log('   Sistema Insuflação:', modeloNovo.sistemaInsuflacao)
    console.log('   Válvulas Padrão:', modeloNovo.valvulasPadrao)

  } catch (error) {
    console.error('❌ Erro ao criar modelo:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
