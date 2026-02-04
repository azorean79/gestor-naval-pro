import { PrismaClient } from '../prisma/app/generated-prisma-client'

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
})

async function main() {
  console.log('🔧 Adicionando HRU HAMMAR H20 às jangadas...\n')

  // Buscar todas as jangadas
  const jangadas = await prisma.jangada.findMany({
    include: {
      marca: true,
      modelo: true,
    },
  })

  if (jangadas.length === 0) {
    console.log('❌ Nenhuma jangada encontrada!')
    return
  }

  console.log(`📊 Encontradas ${jangadas.length} jangadas\n`)

  let jangadasAtualizadas = 0

  for (const jangada of jangadas) {
    // Gerar número de série do HAMMAR H20 (formato: HMR-YYYY-NNNN)
    const ano = jangada.dataFabricacao 
      ? jangada.dataFabricacao.getFullYear()
      : new Date().getFullYear()
    
    const numeroAleatorio = Math.floor(1000 + Math.random() * 9000)
    const hruNumeroSerie = `HMR-${ano}-${numeroAleatorio}`

    // Data de instalação (assumir que foi instalada junto com a última inspeção ou fabricação)
    const hruDataInstalacao = jangada.dataInspecao || jangada.dataFabricacao || new Date()

    // Validade: 2 anos após instalação
    const hruDataValidade = new Date(hruDataInstalacao)
    hruDataValidade.setFullYear(hruDataValidade.getFullYear() + 2)

    try {
      await prisma.jangada.update({
        where: { id: jangada.id },
        data: {
          hruAplicavel: true,
          hruNumeroSerie,
          hruModelo: 'HAMMAR H20',
          hruDataInstalacao,
          hruDataValidade,
        },
      })

      console.log(`✅ ${jangada.marca?.nome || 'Marca'} ${jangada.modelo?.nome || 'Modelo'}`)
      console.log(`   └─ HRU: ${hruNumeroSerie}`)
      console.log(`   └─ Instalação: ${hruDataInstalacao.toLocaleDateString('pt-PT')}`)
      console.log(`   └─ Validade: ${hruDataValidade.toLocaleDateString('pt-PT')}\n`)
      
      jangadasAtualizadas++
    } catch (error: any) {
      console.log(`❌ Erro ao atualizar ${jangada.numeroSerie}: ${error.message}\n`)
    }
  }

  console.log(`✨ Processo concluído!`)
  console.log(`📊 Total de jangadas com HRU: ${jangadasAtualizadas}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
