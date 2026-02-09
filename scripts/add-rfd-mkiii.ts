import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Adicionando marca RFD e modelo SURVIVA MKIII...')

  try {
    // Criar ou buscar marca RFD
    const marca = await prisma.marcaJangada.upsert({
      where: { nome: 'RFD' },
      update: { ativo: true },
      create: { 
        nome: 'RFD', 
        ativo: true
      }
    })
    console.log(`✅ Marca RFD criada/atualizada com ID: ${marca.id}`)

    // Criar ou buscar modelo SURVIVA MKIII
    const modelo = await prisma.modeloJangada.upsert({
      where: { 
        nome_marcaId: { 
          nome: 'SURVIVA MKIII', 
          marcaId: marca.id 
        } 
      },
      update: { ativo: true },
      create: { 
        nome: 'SURVIVA MKIII', 
        marcaId: marca.id,
        sistemaInsuflacao: 'THANNER', // Sistema de insuflação para RFD SURVIVA MKIII
        valvulasPadrao: 'OTS65', // Válvulas padrão
        ativo: true
      }
    })
    console.log(`✅ Modelo SURVIVA MKIII criado/atualizado com ID: ${modelo.id}`)

    // Buscar lotações disponíveis
    const lotacao4 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 4 } })
    const lotacao6 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 6 } })
    const lotacao8 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 8 } })
    const lotacao10 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 10 } })
    const lotacao12 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 12 } })
    const lotacao16 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 16 } })
    const lotacao20 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 20 } })
    const lotacao25 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 25 } })

    // Adicionar especificações técnicas baseadas no manual MKIII
    // Fonte: RFD SURVIVA MKIII Service Manual - Cilindros Europeus (Throw Over)
    // Extraído do PDF: MARCAS/SURVIVA MKIII/MkIII.pdf
    const especificacoes = [
      { lotacao: lotacao4, pesoCO2: 1.98, pesoN2: 0.06 },
      { lotacao: lotacao6, pesoCO2: 2.50, pesoN2: 0.16 },
      { lotacao: lotacao8, pesoCO2: 3.51, pesoN2: 0.23 },
      { lotacao: lotacao10, pesoCO2: 5.94, pesoN2: 0.18 },
      { lotacao: lotacao12, pesoCO2: 5.94, pesoN2: 0.18 },
      { lotacao: lotacao16, pesoCO2: 8.44, pesoN2: 0.37 },
      { lotacao: lotacao20, pesoCO2: 8.44, pesoN2: 0.37 },
      { lotacao: lotacao25, pesoCO2: 11.26, pesoN2: 0.36 }
    ]

    for (const spec of especificacoes) {
      if (spec.lotacao) {
        await prisma.especificacaoTecnica.upsert({
          where: { 
            marcaId_modeloId_lotacaoId: { 
              marcaId: marca.id, 
              modeloId: modelo.id, 
              lotacaoId: spec.lotacao.id 
            } 
          },
          update: {
            quantidadeCilindros: 1,
            pesoCO2: spec.pesoCO2,
            pesoN2: spec.pesoN2
          },
          create: { 
            marcaId: marca.id, 
            modeloId: modelo.id, 
            lotacaoId: spec.lotacao.id, 
            quantidadeCilindros: 1, 
            pesoCO2: spec.pesoCO2,
            pesoN2: spec.pesoN2
          }
        })
        console.log(`✅ Especificação MKIII ${spec.lotacao.capacidade}p criada (CO2: ${spec.pesoCO2}kg, N2: ${spec.pesoN2}kg)`)
      }
    }

    console.log('\n✨ Modelo RFD SURVIVA MKIII configurado com sucesso!')
    console.log('📋 Sistema: THANNER')
    console.log('🔧 Válvulas: OTS65')
    console.log('🛟 Capacidades: 4, 6, 8, 10, 12, 16, 20, 25 pessoas')
  } catch (error) {
    console.error('❌ Erro ao adicionar modelo MKIII:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
