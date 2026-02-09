import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🔧 Atualizando válvulas - adicionando A10, B10 e outras variantes...')

  try {
    // Buscar marcas
    const rfdMarca = await prisma.marcaJangada.findUnique({ where: { nome: 'RFD' } })
    const dsbMarca = await prisma.marcaJangada.findUnique({ where: { nome: 'DSB' } })

    // Especificações atualizadas com válvulas A10/B10
    const especificacoesValvulas = [
      {
        tamanho: 4,
        valvulas_padrao: 'OTS65',
        valvulas_alternativas: ['A10', 'B10'],
        valvula_pressao_abertura: '0.4 bar (OTS65) / 0.5 bar (A10/B10)',
        valvula_margem_seguranca: 0.05,
        observacoes: 'OTS65 é padrão LEAFIELD. A10/B10 para aplicações específicas com tubo de pressão'
      },
      {
        tamanho: 6,
        valvulas_padrao: 'OTS65',
        valvulas_alternativas: ['A10', 'B10'],
        valvula_pressao_abertura: '0.4 bar (OTS65) / 0.5 bar (A10/B10)',
        valvula_margem_seguranca: 0.05,
        observacoes: 'OTS65 é padrão LEAFIELD. A10/B10 para aplicações específicas'
      },
      {
        tamanho: 8,
        valvulas_padrao: 'OTS65',
        valvulas_alternativas: ['A10', 'B10'],
        valvula_pressao_abertura: '0.4 bar (OTS65) / 0.5 bar (A10/B10)',
        valvula_margem_seguranca: 0.05,
        observacoes: 'OTS65 é padrão LEAFIELD. A10/B10 compatível com sistema de insuflação alternativo'
      },
      {
        tamanho: 10,
        valvulas_padrao: 'OTS65',
        valvulas_alternativas: ['A10', 'B10'],
        valvula_pressao_abertura: '0.4 bar (OTS65) / 0.5 bar (A10/B10)',
        valvula_margem_seguranca: 0.05,
        observacoes: 'OTS65 é padrão LEAFIELD. A10/B10 para tubo de pressão'
      },
      {
        tamanho: 12,
        valvulas_padrao: 'OTS65',
        valvulas_alternativas: ['A10', 'B10'],
        valvula_pressao_abertura: '0.4 bar (OTS65) / 0.5 bar (A10/B10)',
        valvula_margem_seguranca: 0.05,
        observacoes: 'OTS65 é padrão LEAFIELD. A10/B10 alternativa'
      },
      {
        tamanho: 16,
        valvulas_padrao: 'OTS65',
        valvulas_alternativas: ['A10', 'B10'],
        valvula_pressao_abertura: '0.4 bar (OTS65) / 0.5 bar (A10/B10)',
        valvula_margem_seguranca: 0.05,
        observacoes: 'OTS65 é padrão LEAFIELD. A10/B10 para versões com tubo de pressão'
      },
      {
        tamanho: 20,
        valvulas_padrao: 'OTS65 x 2',
        valvulas_alternativas: ['A10/B10 x 2'],
        valvula_pressao_abertura: '0.4 bar (OTS65) / 0.5 bar (A10/B10)',
        valvula_margem_seguranca: 0.05,
        observacoes: 'Dupla válvula. OTS65 padrão LEAFIELD. A10/B10 para aplicações específicas'
      },
      {
        tamanho: 25,
        valvulas_padrao: 'OTS65 x 2',
        valvulas_alternativas: ['A10/B10 x 2'],
        valvula_pressao_abertura: '0.4 bar (OTS65) / 0.5 bar (A10/B10)',
        valvula_margem_seguranca: 0.05,
        observacoes: 'Dupla válvula. OTS65 padrão LEAFIELD. A10/B10 para tubo de pressão duplo'
      }
    ]

    // Atualizar RFD MKIV
    console.log('\n🔄 Atualizando RFD MKIV com válvulas A10/B10...')
    const rfdModelo = await prisma.modeloJangada.findFirst({
      where: { nome: 'MKIV', marcaId: rfdMarca!.id }
    })

    for (const spec of especificacoesValvulas) {
      const lotacao = await prisma.lotacaoJangada.findUnique({
        where: { capacidade: spec.tamanho }
      })

      if (lotacao && rfdModelo) {
        const updated = await prisma.especificacaoTecnica.findFirst({
          where: {
            marcaId: rfdMarca!.id,
            modeloId: rfdModelo.id,
            lotacaoId: lotacao.id
          }
        })

        if (updated && updated.referenciaCilindro) {
          const specs = JSON.parse(updated.referenciaCilindro)
          specs.valvula = {
            ...specs.valvula,
            tipo_padrao: spec.valvulas_padrao,
            tipos_alternativos: spec.valvulas_alternativas,
            pressao_abertura_descritivo: spec.valvula_pressao_abertura,
            observacoes: spec.observacoes
          }

          await prisma.especificacaoTecnica.update({
            where: { id: updated.id },
            data: {
              tiposValvulas: `${spec.valvulas_padrao} / ${spec.valvulas_alternativas.join(' / ')}`,
              referenciaCilindro: JSON.stringify(specs)
            }
          })
          console.log(`✅ RFD MKIV ${spec.tamanho}p: OTS65 / A10 / B10`)
        }
      }
    }

    // Atualizar DSB LR07
    console.log('\n🔄 Atualizando DSB LR07 com válvulas A10/B10...')
    const dsbModelo = await prisma.modeloJangada.findFirst({
      where: { nome: 'LR07', marcaId: dsbMarca!.id }
    })

    for (const spec of especificacoesValvulas) {
      const lotacao = await prisma.lotacaoJangada.findUnique({
        where: { capacidade: spec.tamanho }
      })

      if (lotacao && dsbModelo) {
        const updated = await prisma.especificacaoTecnica.findFirst({
          where: {
            marcaId: dsbMarca!.id,
            modeloId: dsbModelo.id,
            lotacaoId: lotacao.id
          }
        })

        if (updated && updated.referenciaCilindro) {
          const specs = JSON.parse(updated.referenciaCilindro)
          specs.valvula = {
            ...specs.valvula,
            tipo_padrao: spec.valvulas_padrao,
            tipos_alternativos: spec.valvulas_alternativas,
            pressao_abertura_descritivo: spec.valvula_pressao_abertura,
            observacoes: spec.observacoes
          }

          await prisma.especificacaoTecnica.update({
            where: { id: updated.id },
            data: {
              tiposValvulas: `${spec.valvulas_padrao} / ${spec.valvulas_alternativas.join(' / ')}`,
              referenciaCilindro: JSON.stringify(specs)
            }
          })
          console.log(`✅ DSB LR07 ${spec.tamanho}p: OTS65 / A10 / B10`)
        }
      }
    }

    console.log('\n✨ Válvulas A10 e B10 adicionadas com sucesso!')
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
