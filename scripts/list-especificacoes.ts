import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📋 Listando especificações técnicas...\n')

  const specs = await prisma.especificacaoTecnica.findMany({
    include: {
      marca: true,
      modelo: true,
      lotacao: true
    },
    orderBy: [
      { marca: { nome: 'asc' } },
      { modelo: { nome: 'asc' } },
      { lotacao: { capacidade: 'asc' } }
    ]
  })

  console.log(`✅ Total: ${specs.length} especificações\n`)
  
  specs.forEach((spec, index) => {
    console.log(`${index + 1}. ${spec.marcaId} ${spec.modeloId} - ${spec.lotacaoId}p`)
    console.log(`   ID: ${spec.id}`)
    console.log(`   URL: /especificacoes/${spec.id}`)
    
    // Check if referenciaCilindro has data
    if (spec.referenciaCilindro) {
      try {
        const ref = JSON.parse(spec.referenciaCilindro)
        const hasCilindros = ref.cilindros && ref.cilindros.length > 0
        const hasValvulas = ref.valvulas && ref.valvulas.length > 0
        const hasManual = ref.manual_mkiv || ref.manual_mkiv_validated
        const hasTests = ref.testes_verificacao && ref.testes_verificacao.length > 0
        
        console.log(`   ✓ Cilindros: ${hasCilindros ? 'Sim' : 'Não'}`)
        console.log(`   ✓ Válvulas: ${hasValvulas ? 'Sim' : 'Não'}`)
        console.log(`   ✓ Manual: ${hasManual ? 'Sim' : 'Não'}`)
        console.log(`   ✓ Testes: ${hasTests ? ref.testes_verificacao.length : 0}`)
      } catch (e) {
        console.log(`   ⚠️ Erro ao processar JSON`)
      }
    } else {
      console.log(`   ⚠️ Sem dados de referência`)
    }
    console.log('')
  })

  // Group by marca
  const byMarca = specs.reduce((acc, spec) => {
    const marca = spec.marcaId
    if (!acc[marca]) acc[marca] = []
    acc[marca].push(spec)
    return acc
  }, {} as Record<string, typeof specs>)

  console.log('📊 Por Marca:')
  Object.entries(byMarca).forEach(([marca, specsList]) => {
    console.log(`  ${marca}: ${specsList.length} configurações`)
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
