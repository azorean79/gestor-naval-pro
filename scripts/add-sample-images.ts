import { config } from 'dotenv'
config()

import { PrismaClient } from '../prisma/app/generated-prisma-client'
import { withAccelerate } from '@prisma/extension-accelerate'

// Check if we're using Prisma Accelerate URL or direct connection
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || '';
const isDatabaseUrlAccelerate = databaseUrl.startsWith('prisma+postgres://');

const prismaConfig: any = {
  log: ['error', 'warn'],
  omit: {
    navio: {
      createdAt: true,
      updatedAt: true,
    },
    jangada: {
      createdAt: true,
      updatedAt: true,
    },
    cliente: {
      createdAt: true,
      updatedAt: true,
    },
    inspecao: {
      createdAt: true,
      updatedAt: true,
    },
    cilindro: {
      createdAt: true,
      updatedAt: true,
    },
    stock: {
      createdAt: true,
      updatedAt: true,
    },
    fatura: {
      createdAt: true,
      updatedAt: true,
    },
    agendamento: {
      createdAt: true,
      updatedAt: true,
    },
    obra: {
      createdAt: true,
      updatedAt: true,
    },
    proprietario: {
      createdAt: true,
      updatedAt: true,
    },
    marcaJangada: {
      createdAt: true,
      updatedAt: true,
    },
    modeloJangada: {
      createdAt: true,
      updatedAt: true,
    },
    lotacaoJangada: {
      createdAt: true,
      updatedAt: true,
    },
    sistemaCilindro: {
      createdAt: true,
      updatedAt: true,
    },
    tipoValvula: {
      createdAt: true,
      updatedAt: true,
    },
    custoInspecao: {
      createdAt: true,
      updatedAt: true,
    },
    notificacao: {
      createdAt: true,
      updatedAt: true,
    },
  },
};

// Add accelerateUrl only if using Prisma Accelerate
if (isDatabaseUrlAccelerate) {
  prismaConfig.accelerateUrl = databaseUrl;
}

const prisma = new PrismaClient(prismaConfig).$extends(withAccelerate())

// Imagens de exemplo (URLs de placeholder)
const sampleImages = [
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=150&fit=crop', // Coletes salva-vidas
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop', // EPIRB
  'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=200&h=150&fit=crop', // Cilindro CO2
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&h=150&fit=crop', // Sinalizador
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=150&fit=crop', // Foguetes
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=150&fit=crop', // Espelho
  'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=200&h=150&fit=crop', // Corneta
  'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=200&h=150&fit=crop', // Kit primeiros socorros
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop', // Bussola
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=150&fit=crop', // Lanterna
]

async function addSampleImages() {
  console.log('🖼️  Adicionando imagens de exemplo aos itens de stock...\n')

  try {
    // Buscar itens de stock sem imagem
    const itemsWithoutImages = await prisma.stock.findMany({
      where: {
        imagem: null
      },
      take: 20, // Limitar para não sobrecarregar
    })

    if (itemsWithoutImages.length === 0) {
      console.log('✅ Todos os itens já têm imagens ou não há itens no stock.')
      return
    }

    console.log(`📦 Encontrados ${itemsWithoutImages.length} itens sem imagem\n`)

    let updatedCount = 0

    for (let i = 0; i < itemsWithoutImages.length; i++) {
      const item = itemsWithoutImages[i]
      const imageUrl = sampleImages[i % sampleImages.length]

      try {
        await prisma.stock.update({
          where: { id: item.id },
          data: { imagem: imageUrl }
        })

        console.log(`✅ ${item.nome}: imagem adicionada`)
        updatedCount++

      } catch (error: any) {
        console.log(`❌ Erro ao atualizar ${item.nome}: ${error.message}`)
      }
    }

    console.log(`\n✨ Processo concluído!`)
    console.log(`📊 Total de imagens adicionadas: ${updatedCount}`)

  } catch (error: any) {
    console.error('❌ Erro geral:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar o script
addSampleImages()