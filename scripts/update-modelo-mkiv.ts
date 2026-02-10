import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🔄 Atualizando nome do modelo MKIV para SURVIVA MKIV...')

  // Update modelo where nome = 'MKIV' to 'SURVIVA MKIV'
  const result = await prisma.modeloJangada.updateMany({
    where: {
      nome: 'MKIV'
    },
    data: {
      nome: 'SURVIVA MKIV'
    }
  })

  console.log(`✅ ${result.count} modelo(s) atualizado(s)`)

  // Verify update
  const modelos = await prisma.modeloJangada.findMany({
    where: {
      nome: {
        contains: 'SURVIVA'
      }
    },
    select: {
      id: true,
      nome: true,
      marca: {
        select: {
          nome: true
        }
      }
    }
  })

  console.log('\n📋 Modelos SURVIVA encontrados:')
  modelos.forEach((m: any) => {
    console.log(`  - ${m.marca.nome} ${m.nome} (ID: ${m.id})`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
