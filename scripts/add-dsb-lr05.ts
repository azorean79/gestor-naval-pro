import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Adicionando marca DSB e modelo LR05...')

  try {
    // Criar ou buscar marca DSB
    const marca = await prisma.marcaJangada.upsert({
      where: { nome: 'DSB' },
      update: { ativo: true },
      create: { 
        nome: 'DSB', 
        ativo: true
      }
    })
    console.log(`✅ Marca DSB criada/atualizada com ID: ${marca.id}`)

    // Criar ou buscar modelo LR05
    const modelo = await prisma.modeloJangada.upsert({
      where: { 
        nome_marcaId: { 
          nome: 'LR05', 
          marcaId: marca.id 
        } 
      },
      update: { ativo: true },
      create: { 
        nome: 'LR05', 
        marcaId: marca.id,
        sistemaInsuflacao: 'THANNER', // Sistema de insuflação DSB LR05
        valvulasPadrao: 'OTS65', // Válvulas padrão
        ativo: true
      }
    })
    console.log(`✅ Modelo LR05 criado/atualizado com ID: ${modelo.id}`)

    // Buscar lotações disponíveis
    const lotacao4 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 4 } })
    const lotacao6 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 6 } })
    const lotacao8 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 8 } })
    const lotacao10 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 10 } })
    const lotacao12 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 12 } })
    const lotacao16 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 16 } })
    const lotacao20 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 20 } })
    const lotacao25 = await prisma.lotacaoJangada.findFirst({ where: { capacidade: 25 } })

    // Adicionar especificações técnicas baseadas no manual DSB LR05
    // Fonte: DSB LR05 Service Manual Part Number: 08196009
    // Extraído do PDF: MARCAS/LR05.pdf - Cilindros Europeus
    // Nota: Capacidades disponíveis 6p, 8p, 10p, 12p, 16p, 20p, 25p (não há 4p no LR05)
    const especificacoes = [
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
        console.log(`✅ Especificação LR05 ${spec.lotacao.capacidade}p criada (CO2: ${spec.pesoCO2}kg, N2: ${spec.pesoN2}kg)`)
      }
    }

    console.log('\n✨ Modelo DSB LR05 configurado com sucesso!')
    console.log('📋 Sistema: THANNER')
    console.log('🔧 Válvulas: OTS65')
    console.log('🛟 Capacidades: 4, 6, 8, 10, 12, 16, 20, 25 pessoas')
  } catch (error) {
    console.error('❌ Erro ao adicionar modelo LR05:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
