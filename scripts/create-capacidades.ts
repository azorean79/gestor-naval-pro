import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📦 Criando capacidades de jangada...')

  try {
    const capacidades = [4, 6, 8, 10, 12, 16, 20, 25]

    for (const capacidade of capacidades) {
      const lotacao = await prisma.lotacaoJangada.upsert({
        where: { capacidade },
        update: { ativo: true },
        create: {
          capacidade,
          ativo: true
        }
      })
      console.log(`✅ Capacidade ${capacidade} pessoas criada`)
    }

    console.log('\n✨ Todas as capacidades foram criadas!')
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
