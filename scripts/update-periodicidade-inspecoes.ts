import { PrismaClient } from '../prisma/app/generated-prisma-client'

const prisma = new PrismaClient();
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
})

async function main() {
  console.log('📅 Atualizando periodicidade de inspeções...\n')

  // Marcas com inspeções ANUAIS (1 ano)
  const marcasAnuais = ['RFD', 'DSB', 'Zodiac']
  
  // Outras marcas: TRIANUAIS (3 anos)
  const marcasTrianuais = ['Eurovinil', 'Plastimo', 'ARIMAR', 'HERO', 'OCEAN SAFETY', 'LALILZAS']

  console.log(`📊 Configuração:`)
  console.log(`   ⏰ Marcas ANUAIS (1 ano): ${marcasAnuais.join(', ')}`)
  console.log(`   ⏰ Marcas TRIANUAIS (3 anos): ${marcasTrianuais.join(', ')}\n`)

  let atualizadasAnuais = 0
  let atualizadasTrianuais = 0

  // Atualizar jangadas e inspeções de marcas ANUAIS
  for (const marcaNome of marcasAnuais) {
    const marca = await prisma.marcaJangada.findUnique({
      where: { nome: marcaNome },
    })

    if (!marca) {
      console.log(`⚠️  Marca ${marcaNome} não encontrada`)
      continue
    }

    const jangadas = await prisma.jangada.findMany({
      where: { marcaId: marca.id },
      include: {
        inspecoes: {
          orderBy: { dataInspecao: 'desc' },
          take: 1,
        },
      },
    })

    for (const jangada of jangadas) {
      if (jangada.inspecoes.length > 0) {
        const ultimaInspecao = jangada.inspecoes[0]
        const novaDataProxima = new Date(ultimaInspecao.dataInspecao)
        novaDataProxima.setFullYear(novaDataProxima.getFullYear() + 1) // +1 ano

        // Atualizar inspeção
        await prisma.inspecao.update({
          where: { id: ultimaInspecao.id },
          data: {
            dataProxima: novaDataProxima,
            tipoInspecao: 'anual',
          },
        })

        // Atualizar jangada
        await prisma.jangada.update({
          where: { id: jangada.id },
          data: {
            dataProximaInspecao: novaDataProxima,
          },
        })

        atualizadasAnuais++
      }
    }

    console.log(`✅ ${marcaNome}: ${jangadas.length} jangadas → ANUAL (1 ano)`)
  }

  // Atualizar jangadas e inspeções de marcas TRIANUAIS
  for (const marcaNome of marcasTrianuais) {
    const marca = await prisma.marcaJangada.findUnique({
      where: { nome: marcaNome },
    })

    if (!marca) {
      console.log(`⚠️  Marca ${marcaNome} não encontrada`)
      continue
    }

    const jangadas = await prisma.jangada.findMany({
      where: { marcaId: marca.id },
      include: {
        inspecoes: {
          orderBy: { dataInspecao: 'desc' },
          take: 1,
        },
      },
    })

    for (const jangada of jangadas) {
      if (jangada.inspecoes.length > 0) {
        const ultimaInspecao = jangada.inspecoes[0]
        const novaDataProxima = new Date(ultimaInspecao.dataInspecao)
        novaDataProxima.setFullYear(novaDataProxima.getFullYear() + 3) // +3 anos

        // Atualizar inspeção
        await prisma.inspecao.update({
          where: { id: ultimaInspecao.id },
          data: {
            dataProxima: novaDataProxima,
            tipoInspecao: 'trianual',
          },
        })

        // Atualizar jangada
        await prisma.jangada.update({
          where: { id: jangada.id },
          data: {
            dataProximaInspecao: novaDataProxima,
          },
        })

        atualizadasTrianuais++
      }
    }

    console.log(`✅ ${marcaNome}: ${jangadas.length} jangadas → TRIANUAL (3 anos)`)
  }

  console.log(`\n✨ Processo concluído!`)
  console.log(`📊 Estatísticas:`)
  console.log(`   Jangadas com inspeção ANUAL: ${atualizadasAnuais}`)
  console.log(`   Jangadas com inspeção TRIANUAL: ${atualizadasTrianuais}`)
  console.log(`   Total atualizado: ${atualizadasAnuais + atualizadasTrianuais}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
