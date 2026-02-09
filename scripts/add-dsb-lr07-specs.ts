import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Adicionando especificações técnicas do DSB LR07...')

  try {
    // Buscar marca DSB e modelo LR07
    const marca = await prisma.marcaJangada.findUnique({
      where: { nome: 'DSB' }
    })

    const modelo = await prisma.modeloJangada.findFirst({
      where: { nome: 'LR07', marcaId: marca!.id }
    })

    if (!marca || !modelo) {
      throw new Error('Marca DSB ou Modelo LR07 não encontrados')
    }

    // Especificações técnicas para cada tamanho de jangada LR07
    // Com as mesmas especificações do RFD MKIV
    const especificacoes = [
      {
        capacidade: 4,
        sistemaInsuflacao: 'LEAFIELD',
        tiposValvulas: 'OTS65',
        containerType: 'MK 10',
        quantidadeCilindros: 1,
        pesoCO2: 1.0,
        volumeCilindro: 1.5
      },
      {
        capacidade: 6,
        sistemaInsuflacao: 'LEAFIELD',
        tiposValvulas: 'OTS65',
        containerType: 'MK 10',
        quantidadeCilindros: 1,
        pesoCO2: 1.5,
        volumeCilindro: 2.0
      },
      {
        capacidade: 8,
        sistemaInsuflacao: 'LEAFIELD',
        tiposValvulas: 'OTS65',
        containerType: 'MK 10',
        quantidadeCilindros: 1,
        pesoCO2: 2.0,
        volumeCilindro: 2.5
      },
      {
        capacidade: 10,
        sistemaInsuflacao: 'LEAFIELD',
        tiposValvulas: 'OTS65',
        containerType: 'MK 10',
        quantidadeCilindros: 1,
        pesoCO2: 2.5,
        volumeCilindro: 3.0
      },
      {
        capacidade: 12,
        sistemaInsuflacao: 'LEAFIELD',
        tiposValvulas: 'OTS65',
        containerType: 'MK 14',
        quantidadeCilindros: 1,
        pesoCO2: 3.0,
        volumeCilindro: 3.5
      },
      {
        capacidade: 16,
        sistemaInsuflacao: 'LEAFIELD',
        tiposValvulas: 'OTS65',
        containerType: 'MK 14',
        quantidadeCilindros: 1,
        pesoCO2: 3.5,
        volumeCilindro: 4.0
      },
      {
        capacidade: 20,
        sistemaInsuflacao: 'LEAFIELD',
        tiposValvulas: 'OTS65',
        containerType: 'MK 14',
        quantidadeCilindros: 2,
        pesoCO2: 4.5,
        volumeCilindro: 5.0
      },
      {
        capacidade: 25,
        sistemaInsuflacao: 'LEAFIELD',
        tiposValvulas: 'OTS65',
        containerType: 'MK 14',
        quantidadeCilindros: 2,
        pesoCO2: 5.0,
        volumeCilindro: 6.0
      }
    ]

    // Inserir especificações técnicas
    for (const spec of especificacoes) {
      const lotacao = await prisma.lotacaoJangada.findUnique({
        where: { capacidade: spec.capacidade }
      })

      if (!lotacao) {
        console.warn(`⚠️  Lotação para ${spec.capacidade} pessoas não encontrada`)
        continue
      }

      await prisma.especificacaoTecnica.upsert({
        where: {
          marcaId_modeloId_lotacaoId: {
            marcaId: marca.id,
            modeloId: modelo.id,
            lotacaoId: lotacao.id
          }
        },
        update: {
          sistemaInsuflacao: spec.sistemaInsuflacao,
          tiposValvulas: spec.tiposValvulas,
          quantidadeCilindros: spec.quantidadeCilindros,
          pesoCO2: spec.pesoCO2,
          volumeCilindro: spec.volumeCilindro
        },
        create: {
          marcaId: marca.id,
          modeloId: modelo.id,
          lotacaoId: lotacao.id,
          sistemaInsuflacao: spec.sistemaInsuflacao,
          tiposValvulas: spec.tiposValvulas,
          quantidadeCilindros: spec.quantidadeCilindros,
          pesoCO2: spec.pesoCO2,
          volumeCilindro: spec.volumeCilindro
        }
      })
      console.log(`✅ Especificação DSB LR07 ${spec.capacidade} pessoas criada`)
    }

    console.log('\n✨ Todas as especificações técnicas do DSB LR07 foram criadas com sucesso!')
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
