import { PrismaClient } from '../prisma/app/generated-prisma-client'

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
})

async function main() {
  console.log('📦 Criando marcas e modelos de jangadas...\n')

  const marcasData = [
    {
      nome: 'Zodiac',
      modelos: [
        { nome: 'Mark II', sistemaInsuflacao: 'THANNER', valvulasPadrao: 'OTS65' },
        { nome: 'Mark III', sistemaInsuflacao: 'THANNER', valvulasPadrao: 'OTS65' },
        { nome: 'Medley', sistemaInsuflacao: 'THANNER', valvulasPadrao: 'OTS65' },
      ],
    },
    {
      nome: 'Revere',
      modelos: [
        { nome: 'Ocean Elite', sistemaInsuflacao: 'Leafield', valvulasPadrao: 'A10/B10' },
        { nome: 'Atlantic', sistemaInsuflacao: 'Leafield', valvulasPadrao: 'A10/B10' },
        { nome: 'ComfortMax', sistemaInsuflacao: 'Leafield', valvulasPadrao: 'A10/B10' },
      ],
    },
    {
      nome: 'Avon',
      modelos: [
        { nome: 'Beaufort', sistemaInsuflacao: 'IBS', valvulasPadrao: 'C16/C26' },
        { nome: 'Sea Rider', sistemaInsuflacao: 'IBS', valvulasPadrao: 'C16/C26' },
        { nome: 'Professional', sistemaInsuflacao: 'IBS', valvulasPadrao: 'C16/C26' },
      ],
    },
    {
      nome: 'Winslow',
      modelos: [
        { nome: 'Liferaft', sistemaInsuflacao: 'Crewsaver', valvulasPadrao: 'Standard' },
        { nome: 'MK5', sistemaInsuflacao: 'Crewsaver', valvulasPadrao: 'Standard' },
        { nome: 'USCG-Approved', sistemaInsuflacao: 'Crewsaver', valvulasPadrao: 'Standard' },
      ],
    },
    {
      nome: 'RFD',
      modelos: [
        { nome: 'Rigid Hull', sistemaInsuflacao: 'RFD', valvulasPadrao: 'RFD-Type' },
        { nome: 'Inflatable', sistemaInsuflacao: 'RFD', valvulasPadrao: 'RFD-Type' },
        { nome: 'Coastal', sistemaInsuflacao: 'RFD', valvulasPadrao: 'RFD-Type' },
      ],
    },
    {
      nome: 'Atair',
      modelos: [
        { nome: 'Atair A1', sistemaInsuflacao: 'Atair', valvulasPadrao: 'Atair-Valve' },
        { nome: 'Atair A2', sistemaInsuflacao: 'Atair', valvulasPadrao: 'Atair-Valve' },
        { nome: 'Atair Professional', sistemaInsuflacao: 'Atair', valvulasPadrao: 'Atair-Valve' },
      ],
    },
  ]

  for (const marcaData of marcasData) {
    try {
      const marca = await prisma.marcaJangada.upsert({
        where: { nome: marcaData.nome },
        update: { ativo: true },
        create: {
          nome: marcaData.nome,
          ativo: true,
        },
      })

      console.log(`✅ Marca: ${marca.nome}`)

      for (const modeloData of marcaData.modelos) {
        try {
          const modelo = await prisma.modeloJangada.upsert({
            where: {
              nome_marcaId: {
                nome: modeloData.nome,
                marcaId: marca.id,
              },
            },
            update: { ativo: true },
            create: {
              nome: modeloData.nome,
              marcaId: marca.id,
              sistemaInsuflacao: modeloData.sistemaInsuflacao,
              valvulasPadrao: modeloData.valvulasPadrao,
              ativo: true,
            },
          })

          console.log(`   └─ ${modelo.nome}`)
        } catch (error) {
          console.log(`   ❌ ${modeloData.nome}: ${error}`)
        }
      }
    } catch (error) {
      console.log(`❌ ${marcaData.nome}: ${error}`)
    }
  }

  // Criar também as lotações padrão
  console.log('\n📏 Criando capacidades de lotação...')
  const capacidades = [4, 6, 8, 10, 12, 15, 20, 25]

  for (const capacidade of capacidades) {
    try {
      await prisma.lotacaoJangada.upsert({
        where: { capacidade },
        update: { ativo: true },
        create: {
          capacidade,
          ativo: true,
        },
      })
      console.log(`   ✅ Lotação ${capacidade} pessoas`)
    } catch (error) {
      console.log(`   ⚠️  Lotação ${capacidade}: já existe`)
    }
  }

  console.log('\n✨ Marcas, modelos e lotações criados com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
