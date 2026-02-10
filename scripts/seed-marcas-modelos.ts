import { PrismaClient } from '@prisma/client'

const ACCELERATE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19TTVZ5LXJiWktoUUtZMHpmSm5Yd3YiLCJhcGlfa2V5IjoiMDFLR0FCQjI2RjRQMTFTR0dQOEY5RjlCRkoiLCJ0ZW5hbnRfaWQiOiIyMDkxNzE0YjM5OTA5NzkzMzVjM2M1MWUxZjQxNTY0NGE0ZDk0ZmM5MzhkODU4NWY4MGExM2VlYjdkODQwOGZkIiwiaW50ZXJuYWxfc2VjcmV0IjoiN2U1MDI0MGUtYjdmYS00NjhjLTljZTQtZTM5NTA2OGQ1NmJlIn0.A-eGaWSZG_w0sMQ4BmVZ13ckdGeYuRb6lMG4T4yvblk";

const prisma = new PrismaClient({
  accelerateUrl: ACCELERATE_URL
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
