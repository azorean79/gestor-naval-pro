import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📋 Adicionando especificações técnicas detalhadas de RFD MKIV e DSB LR07...')

  try {
    // Buscar marcas
    const rfdMarca = await prisma.marcaJangada.findUnique({ where: { nome: 'RFD' } })
    const dsbMarca = await prisma.marcaJangada.findUnique({ where: { nome: 'DSB' } })

    const rfdModelo = await prisma.modeloJangada.findFirst({ where: { nome: 'MKIV', marcaId: rfdMarca!.id } })
    const dsbModelo = await prisma.modeloJangada.findFirst({ where: { nome: 'LR07', marcaId: dsbMarca!.id } })

    // Especificações técnicas detalhadas por tamanho
    const especificacoesDetalhadas = [
      {
        tamanho: 4,
        container: 'MK 10',
        dimensoes_container: '1200 x 800 x 900 mm',
        peso_container: 45,
        peso_total: 65,
        cilindro_tipo: 'CO2',
        cilindro_quantidade: 1,
        cilindro_peso: 1.0,
        cilindro_pressao_trabalho: '58 bar',
        cilindro_volume: 1.5,
        cilindro_torque_abertura: '25 Nm',
        cilindro_torque_fecho: '20 Nm',
        valvula_tipo: 'OTS65',
        valvula_pressao_abertura: '0.4 bar',
        valvula_margem_seguranca: 0.05,
        sistema_insuflacao: 'LEAFIELD',
        tubagem_diametro_principal: '12 mm',
        tubagem_niples_quantidade: 4,
        tubagem_material: 'Nylon reforçado',
        cintas_fecho_quantidade: 8,
        cintas_fecho_material: 'Aço inox',
        cintas_fecho_torque: '15 Nm',
        cabeca_disparo_tipo: 'Cartridge R5',
        cabeca_disparo_quantidade: 1,
        espumas_protetoras: ['Protection foam 1 (750x500x25)', 'Protection foam 2 (500x250x25)', 'Protection foam 3 (175x175x25)'],
        testes_pressao: 'SOLAS (0.5 bar durante 5 min, acima de pressão de trabalho)',
        testes_vazamento: '< 50 ml/min em condições SOLAS',
        intervalo_inspecao: '2.5 anos',
        intervalo_revalidacao: '5 anos',
        pressao_teste_cilindro: '87 bar'
      },
      {
        tamanho: 6,
        container: 'MK 10',
        dimensoes_container: '1400 x 900 x 950 mm',
        peso_container: 50,
        peso_total: 70,
        cilindro_tipo: 'CO2',
        cilindro_quantidade: 1,
        cilindro_peso: 1.5,
        cilindro_pressao_trabalho: '58 bar',
        cilindro_volume: 2.0,
        cilindro_torque_abertura: '30 Nm',
        cilindro_torque_fecho: '22 Nm',
        valvula_tipo: 'OTS65',
        valvula_pressao_abertura: '0.4 bar',
        valvula_margem_seguranca: 0.05,
        sistema_insuflacao: 'LEAFIELD',
        tubagem_diametro_principal: '12 mm',
        tubagem_niples_quantidade: 6,
        tubagem_material: 'Nylon reforçado',
        cintas_fecho_quantidade: 10,
        cintas_fecho_material: 'Aço inox',
        cintas_fecho_torque: '15 Nm',
        cabeca_disparo_tipo: 'Cartridge R6',
        cabeca_disparo_quantidade: 1,
        espumas_protetoras: ['Protection foam 1 (750x500x25)', 'Protection foam 2 (500x250x25)', 'Protection foam 3 (175x175x25)'],
        testes_pressao: 'SOLAS (0.5 bar durante 5 min)',
        testes_vazamento: '< 50 ml/min',
        intervalo_inspecao: '2.5 anos',
        intervalo_revalidacao: '5 anos',
        pressao_teste_cilindro: '87 bar'
      },
      {
        tamanho: 8,
        container: 'MK 10',
        dimensoes_container: '1600 x 1000 x 1100 mm',
        peso_container: 60,
        peso_total: 85,
        cilindro_tipo: 'CO2',
        cilindro_quantidade: 1,
        cilindro_peso: 2.0,
        cilindro_pressao_trabalho: '58 bar',
        cilindro_volume: 2.5,
        cilindro_torque_abertura: '35 Nm',
        cilindro_torque_fecho: '25 Nm',
        valvula_tipo: 'OTS65',
        valvula_pressao_abertura: '0.4 bar',
        valvula_margem_seguranca: 0.05,
        sistema_insuflacao: 'LEAFIELD',
        tubagem_diametro_principal: '12 mm',
        tubagem_niples_quantidade: 8,
        tubagem_material: 'Nylon reforçado',
        cintas_fecho_quantidade: 12,
        cintas_fecho_material: 'Aço inox',
        cintas_fecho_torque: '18 Nm',
        cabeca_disparo_tipo: 'Cartridge R8',
        cabeca_disparo_quantidade: 1,
        espumas_protetoras: ['Protection foam 1 (750x500x25)', 'Protection foam 2 (500x250x25)', 'Protection foam 3 (175x175x25)'],
        testes_pressao: 'SOLAS (0.5 bar durante 5 min)',
        testes_vazamento: '< 50 ml/min',
        intervalo_inspecao: '2.5 anos',
        intervalo_revalidacao: '5 anos',
        pressao_teste_cilindro: '87 bar'
      },
      {
        tamanho: 10,
        container: 'MK 10',
        dimensoes_container: '1800 x 1100 x 1200 mm',
        peso_container: 70,
        peso_total: 105,
        cilindro_tipo: 'CO2',
        cilindro_quantidade: 1,
        cilindro_peso: 2.5,
        cilindro_pressao_trabalho: '58 bar',
        cilindro_volume: 3.0,
        cilindro_torque_abertura: '40 Nm',
        cilindro_torque_fecho: '28 Nm',
        valvula_tipo: 'OTS65',
        valvula_pressao_abertura: '0.4 bar',
        valvula_margem_seguranca: 0.05,
        sistema_insuflacao: 'LEAFIELD',
        tubagem_diametro_principal: '14 mm',
        tubagem_niples_quantidade: 10,
        tubagem_material: 'Nylon reforçado',
        cintas_fecho_quantidade: 14,
        cintas_fecho_material: 'Aço inox',
        cintas_fecho_torque: '18 Nm',
        cabeca_disparo_tipo: 'Cartridge R10',
        cabeca_disparo_quantidade: 1,
        espumas_protetoras: ['Protection foam 1 (750x500x25)', 'Protection foam 4 (150x150x25)'],
        testes_pressao: 'SOLAS (0.5 bar durante 5 min)',
        testes_vazamento: '< 50 ml/min',
        intervalo_inspecao: '2.5 anos',
        intervalo_revalidacao: '5 anos',
        pressao_teste_cilindro: '87 bar'
      },
      {
        tamanho: 12,
        container: 'MK 14',
        dimensoes_container: '2000 x 1200 x 1400 mm',
        peso_container: 85,
        peso_total: 130,
        cilindro_tipo: 'CO2',
        cilindro_quantidade: 1,
        cilindro_peso: 3.0,
        cilindro_pressao_trabalho: '58 bar',
        cilindro_volume: 3.5,
        cilindro_torque_abertura: '45 Nm',
        cilindro_torque_fecho: '30 Nm',
        valvula_tipo: 'OTS65',
        valvula_pressao_abertura: '0.4 bar',
        valvula_margem_seguranca: 0.05,
        sistema_insuflacao: 'LEAFIELD',
        tubagem_diametro_principal: '14 mm',
        tubagem_niples_quantidade: 12,
        tubagem_material: 'Nylon reforçado',
        cintas_fecho_quantidade: 16,
        cintas_fecho_material: 'Aço inox',
        cintas_fecho_torque: '20 Nm',
        cabeca_disparo_tipo: 'Cartridge R12',
        cabeca_disparo_quantidade: 1,
        espumas_protetoras: ['Protection foam 1 (750x500x25)', 'Protection foam 6 (350x150x25)'],
        testes_pressao: 'SOLAS (0.5 bar durante 5 min)',
        testes_vazamento: '< 50 ml/min',
        intervalo_inspecao: '2.5 anos',
        intervalo_revalidacao: '5 anos',
        pressao_teste_cilindro: '87 bar'
      },
      {
        tamanho: 16,
        container: 'MK 14',
        dimensoes_container: '2200 x 1400 x 1500 mm',
        peso_container: 100,
        peso_total: 160,
        cilindro_tipo: 'CO2',
        cilindro_quantidade: 1,
        cilindro_peso: 3.5,
        cilindro_pressao_trabalho: '58 bar',
        cilindro_volume: 4.0,
        cilindro_torque_abertura: '50 Nm',
        cilindro_torque_fecho: '32 Nm',
        valvula_tipo: 'OTS65',
        valvula_pressao_abertura: '0.4 bar',
        valvula_margem_seguranca: 0.05,
        sistema_insuflacao: 'LEAFIELD',
        tubagem_diametro_principal: '14 mm',
        tubagem_niples_quantidade: 14,
        tubagem_material: 'Nylon reforçado',
        cintas_fecho_quantidade: 18,
        cintas_fecho_material: 'Aço inox',
        cintas_fecho_torque: '22 Nm',
        cabeca_disparo_tipo: 'Cartridge R16',
        cabeca_disparo_quantidade: 1,
        espumas_protetoras: ['Protection foam 1 (750x500x25)', 'Protection foam 6 (350x150x25)'],
        testes_pressao: 'SOLAS (0.5 bar durante 5 min)',
        testes_vazamento: '< 50 ml/min',
        intervalo_inspecao: '2.5 anos',
        intervalo_revalidacao: '5 anos',
        pressao_teste_cilindro: '87 bar'
      },
      {
        tamanho: 20,
        container: 'MK 14',
        dimensoes_container: '2400 x 1600 x 1600 mm',
        peso_container: 125,
        peso_total: 210,
        cilindro_tipo: 'CO2',
        cilindro_quantidade: 2,
        cilindro_peso: 4.5,
        cilindro_pressao_trabalho: '58 bar',
        cilindro_volume: 5.0,
        cilindro_torque_abertura: '55 Nm',
        cilindro_torque_fecho: '35 Nm',
        valvula_tipo: 'OTS65 x 2',
        valvula_pressao_abertura: '0.4 bar',
        valvula_margem_seguranca: 0.05,
        sistema_insuflacao: 'LEAFIELD Duplo',
        tubagem_diametro_principal: '16 mm',
        tubagem_niples_quantidade: 16,
        tubagem_material: 'Nylon reforçado',
        cintas_fecho_quantidade: 20,
        cintas_fecho_material: 'Aço inox',
        cintas_fecho_torque: '25 Nm',
        cabeca_disparo_tipo: 'Cartridge R20 (dupla)',
        cabeca_disparo_quantidade: 2,
        espumas_protetoras: ['Protection foam 1 (750x500x25)', 'Protection foam 6 (350x150x25) x 2'],
        testes_pressao: 'SOLAS (0.5 bar durante 5 min)',
        testes_vazamento: '< 50 ml/min por cilindro',
        intervalo_inspecao: '2.5 anos',
        intervalo_revalidacao: '5 anos',
        pressao_teste_cilindro: '87 bar'
      },
      {
        tamanho: 25,
        container: 'MK 14',
        dimensoes_container: '2600 x 1800 x 1700 mm',
        peso_container: 150,
        peso_total: 260,
        cilindro_tipo: 'CO2',
        cilindro_quantidade: 2,
        cilindro_peso: 5.0,
        cilindro_pressao_trabalho: '58 bar',
        cilindro_volume: 6.0,
        cilindro_torque_abertura: '60 Nm',
        cilindro_torque_fecho: '38 Nm',
        valvula_tipo: 'OTS65 x 2',
        valvula_pressao_abertura: '0.4 bar',
        valvula_margem_seguranca: 0.05,
        sistema_insuflacao: 'LEAFIELD Duplo',
        tubagem_diametro_principal: '16 mm',
        tubagem_niples_quantidade: 18,
        tubagem_material: 'Nylon reforçado',
        cintas_fecho_quantidade: 22,
        cintas_fecho_material: 'Aço inox',
        cintas_fecho_torque: '28 Nm',
        cabeca_disparo_tipo: 'Cartridge R25 (dupla)',
        cabeca_disparo_quantidade: 2,
        espumas_protetoras: ['Protection foam 1 (750x500x25)', 'Protection foam 6 (350x150x25) x 2'],
        testes_pressao: 'SOLAS (0.5 bar durante 5 min)',
        testes_vazamento: '< 50 ml/min por cilindro',
        intervalo_inspecao: '2.5 anos',
        intervalo_revalidacao: '5 anos',
        pressao_teste_cilindro: '87 bar'
      }
    ]

    // Inserir especificações para RFD MKIV e DSB LR07
    for (const spec of especificacoesDetalhadas) {
      const lotacao = await prisma.lotacaoJangada.findUnique({
        where: { capacidade: spec.tamanho }
      })

      if (!lotacao) {
        console.warn(`⚠️  Lotação para ${spec.tamanho} pessoas não encontrada`)
        continue
      }

      // Criar entrada para RFD MKIV
      await prisma.especificacaoTecnica.upsert({
        where: {
          marcaId_modeloId_lotacaoId: {
            marcaId: rfdMarca!.id,
            modeloId: rfdModelo!.id,
            lotacaoId: lotacao.id
          }
        },
        update: {
          sistemaInsuflacao: spec.sistema_insuflacao,
          tiposValvulas: spec.valvula_tipo,
          quantidadeCilindros: spec.cilindro_quantidade,
          pesoCO2: spec.cilindro_peso,
          volumeCilindro: spec.cilindro_volume,
          referenciaCilindro: JSON.stringify({
            container: spec.container,
            dimensoes: spec.dimensoes_container,
            peso_vazio: spec.peso_container,
            cilindro: {
              tipo: spec.cilindro_tipo,
              pressure_trabalho: spec.cilindro_pressao_trabalho,
              torque_abertura: spec.cilindro_torque_abertura,
              torque_fecho: spec.cilindro_torque_fecho,
              pressao_teste: spec.pressao_teste_cilindro
            },
            valvula: {
              tipo: spec.valvula_tipo,
              pressao_abertura: spec.valvula_pressao_abertura,
              margem_seguranca: spec.valvula_margem_seguranca
            },
            tubagem: {
              diametro_principal: spec.tubagem_diametro_principal,
              niples: spec.tubagem_niples_quantidade,
              material: spec.tubagem_material
            },
            cintas_fecho: {
              quantidade: spec.cintas_fecho_quantidade,
              material: spec.cintas_fecho_material,
              torque: spec.cintas_fecho_torque
            },
            cabeca_disparo: {
              tipo: spec.cabeca_disparo_tipo,
              quantidade: spec.cabeca_disparo_quantidade
            },
            espumas_protetoras: spec.espumas_protetoras,
            testes: {
              pressao: spec.testes_pressao,
              vazamento: spec.testes_vazamento
            },
            manutencao: {
              intervalo_inspecao: spec.intervalo_inspecao,
              intervalo_revalidacao: spec.intervalo_revalidacao
            }
          })
        },
        create: {
          marcaId: rfdMarca!.id,
          modeloId: rfdModelo!.id,
          lotacaoId: lotacao.id,
          sistemaInsuflacao: spec.sistema_insuflacao,
          tiposValvulas: spec.valvula_tipo,
          quantidadeCilindros: spec.cilindro_quantidade,
          pesoCO2: spec.cilindro_peso,
          volumeCilindro: spec.cilindro_volume,
          referenciaCilindro: JSON.stringify({
            container: spec.container,
            dimensoes: spec.dimensoes_container,
            peso_vazio: spec.peso_container,
            cilindro: {
              tipo: spec.cilindro_tipo,
              pressure_trabalho: spec.cilindro_pressao_trabalho,
              torque_abertura: spec.cilindro_torque_abertura,
              torque_fecho: spec.cilindro_torque_fecho,
              pressao_teste: spec.pressao_teste_cilindro
            },
            valvula: {
              tipo: spec.valvula_tipo,
              pressao_abertura: spec.valvula_pressao_abertura,
              margem_seguranca: spec.valvula_margem_seguranca
            },
            tubagem: {
              diametro_principal: spec.tubagem_diametro_principal,
              niples: spec.tubagem_niples_quantidade,
              material: spec.tubagem_material
            },
            cintas_fecho: {
              quantidade: spec.cintas_fecho_quantidade,
              material: spec.cintas_fecho_material,
              torque: spec.cintas_fecho_torque
            },
            cabeca_disparo: {
              tipo: spec.cabeca_disparo_tipo,
              quantidade: spec.cabeca_disparo_quantidade
            },
            espumas_protetoras: spec.espumas_protetoras,
            testes: {
              pressao: spec.testes_pressao,
              vazamento: spec.testes_vazamento
            },
            manutencao: {
              intervalo_inspecao: spec.intervalo_inspecao,
              intervalo_revalidacao: spec.intervalo_revalidacao
            }
          })
        }
      })

      // Criar entrada para DSB LR07 (com mesmas especificações)
      await prisma.especificacaoTecnica.upsert({
        where: {
          marcaId_modeloId_lotacaoId: {
            marcaId: dsbMarca!.id,
            modeloId: dsbModelo!.id,
            lotacaoId: lotacao.id
          }
        },
        update: {
          sistemaInsuflacao: spec.sistema_insuflacao,
          tiposValvulas: spec.valvula_tipo,
          quantidadeCilindros: spec.cilindro_quantidade,
          pesoCO2: spec.cilindro_peso,
          volumeCilindro: spec.cilindro_volume,
          referenciaCilindro: JSON.stringify({
            container: spec.container,
            dimensoes: spec.dimensoes_container,
            peso_vazio: spec.peso_container,
            cilindro: {
              tipo: spec.cilindro_tipo,
              pressure_trabalho: spec.cilindro_pressao_trabalho,
              torque_abertura: spec.cilindro_torque_abertura,
              torque_fecho: spec.cilindro_torque_fecho,
              pressao_teste: spec.pressao_teste_cilindro
            },
            valvula: {
              tipo: spec.valvula_tipo,
              pressao_abertura: spec.valvula_pressao_abertura,
              margem_seguranca: spec.valvula_margem_seguranca
            },
            tubagem: {
              diametro_principal: spec.tubagem_diametro_principal,
              niples: spec.tubagem_niples_quantidade,
              material: spec.tubagem_material
            },
            cintas_fecho: {
              quantidade: spec.cintas_fecho_quantidade,
              material: spec.cintas_fecho_material,
              torque: spec.cintas_fecho_torque
            },
            cabeca_disparo: {
              tipo: spec.cabeca_disparo_tipo,
              quantidade: spec.cabeca_disparo_quantidade
            },
            espumas_protetoras: spec.espumas_protetoras,
            testes: {
              pressao: spec.testes_pressao,
              vazamento: spec.testes_vazamento
            },
            manutencao: {
              intervalo_inspecao: spec.intervalo_inspecao,
              intervalo_revalidacao: spec.intervalo_revalidacao
            }
          })
        },
        create: {
          marcaId: dsbMarca!.id,
          modeloId: dsbModelo!.id,
          lotacaoId: lotacao.id,
          sistemaInsuflacao: spec.sistema_insuflacao,
          tiposValvulas: spec.valvula_tipo,
          quantidadeCilindros: spec.cilindro_quantidade,
          pesoCO2: spec.cilindro_peso,
          volumeCilindro: spec.cilindro_volume,
          referenciaCilindro: JSON.stringify({
            container: spec.container,
            dimensoes: spec.dimensoes_container,
            peso_vazio: spec.peso_container,
            cilindro: {
              tipo: spec.cilindro_tipo,
              pressure_trabalho: spec.cilindro_pressao_trabalho,
              torque_abertura: spec.cilindro_torque_abertura,
              torque_fecho: spec.cilindro_torque_fecho,
              pressao_teste: spec.pressao_teste_cilindro
            },
            valvula: {
              tipo: spec.valvula_tipo,
              pressao_abertura: spec.valvula_pressao_abertura,
              margem_seguranca: spec.valvula_margem_seguranca
            },
            tubagem: {
              diametro_principal: spec.tubagem_diametro_principal,
              niples: spec.tubagem_niples_quantidade,
              material: spec.tubagem_material
            },
            cintas_fecho: {
              quantidade: spec.cintas_fecho_quantidade,
              material: spec.cintas_fecho_material,
              torque: spec.cintas_fecho_torque
            },
            cabeca_disparo: {
              tipo: spec.cabeca_disparo_tipo,
              quantidade: spec.cabeca_disparo_quantidade
            },
            espumas_protetoras: spec.espumas_protetoras,
            testes: {
              pressao: spec.testes_pressao,
              vazamento: spec.testes_vazamento
            },
            manutencao: {
              intervalo_inspecao: spec.intervalo_inspecao,
              intervalo_revalidacao: spec.intervalo_revalidacao
            }
          })
        }
      })

      console.log(`✅ Especificações detalhadas para ${spec.tamanho} pessoas (RFD MKIV + DSB LR07) criadas`)
    }

    console.log('\n✨ Todas as especificações técnicas detalhadas foram criadas com sucesso!')
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
