import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🔗 Adicionando especificações de interligação entre componentes...')

  try {
    // Buscar marcas e modelos
    const marcaRFD = await prisma.marcaJangada.findFirst({ where: { nome: 'RFD' } })
    const marcaDSB = await prisma.marcaJangada.findFirst({ where: { nome: 'DSB' } })
    const modeloMKIV = await prisma.modeloJangada.findFirst({ where: { nome: 'MKIV' } })
    const modeloLR07 = await prisma.modeloJangada.findFirst({ where: { nome: 'LR07' } })

    if (!marcaRFD || !marcaDSB || !modeloMKIV || !modeloLR07) {
      throw new Error('Marcas ou modelos não encontrados')
    }

    const lotacoes = [4, 6, 8, 10, 12, 16, 20, 25]

    // Definir esquema de interligação por tamanho
    const getInterligacaoConfig = (pessoas: number) => {
      const config = {
        tuboPrincipal: pessoas <= 10 ? '12mm' : pessoas <= 16 ? '14mm' : '16mm',
        niplesInferior: pessoas <= 6 ? 4 : pessoas <= 10 ? 6 : pessoas <= 16 ? 10 : pessoas <= 20 ? 14 : 18,
        niplesSuperior: pessoas <= 6 ? 4 : pessoas <= 10 ? 6 : pessoas <= 16 ? 8 : pessoas <= 20 ? 12 : 16,
        adaptadoresInferior: pessoas <= 6 ? 2 : pessoas <= 10 ? 3 : pessoas <= 16 ? 4 : pessoas <= 20 ? 5 : 6,
        adaptadoresSuperior: pessoas <= 6 ? 2 : pessoas <= 10 ? 3 : pessoas <= 16 ? 4 : pessoas <= 20 ? 5 : 6,
        comprimentoTubo: pessoas <= 6 ? 3.5 : pessoas <= 10 ? 5.0 : pessoas <= 16 ? 7.5 : pessoas <= 20 ? 10.0 : 12.5
      }
      return config
    }

    for (const pessoas of lotacoes) {
      const lotacao = await prisma.lotacaoJangada.findFirst({ where: { capacidade: pessoas } })
      if (!lotacao) continue

      const config = getInterligacaoConfig(pessoas)

      const interligacaoData = {
        sistema_interligacao: {
          descricao: 'Sistema de interligação entre cilindro CO2, válvula, tubagem e câmaras de flutuação',
          
          // CADEIA DE INSUFLAÇÃO
          cadeia_insuflacao: {
            etapa_1: {
              origem: 'Cilindro CO2',
              destino: 'Válvula Principal',
              componente: pessoas <= 10 ? 'OTS65 ou A10/B10' : 'OTS65',
              pressao_entrada: '58 bar',
              pressao_saida_regulada: '0.4-0.5 bar',
              torque_conexao: '25-60 Nm (abertura cilindro)',
              part_number_valvula: pessoas <= 10 ? 'LEAF-OTS65-001 / HAMM-A10-V-002 / HAMM-B10-V-003' : 'LEAF-OTS65-001'
            },
            etapa_2: {
              origem: 'Válvula Principal',
              destino: 'Tubo Principal Alta Pressão',
              adaptador: `Adaptador Válvula-Tubo ${config.tuboPrincipal}`,
              part_number_adaptador: pessoas <= 10 ? 'LEAF-ADT-OTS65-VT-504 ou HAMM-ADT-AB10-VT-505' : 'LEAF-ADT-OTS65-VT-504',
              torque_aperto: pessoas <= 10 ? '12-15 Nm' : '15 Nm',
              tipo_vedacao: 'O-ring FKM com pasta vedante'
            },
            etapa_3: {
              origem: 'Tubo Principal',
              tipo_tubo: `Tubo Alta Pressão ${config.tuboPrincipal}`,
              part_number_tubo: config.tuboPrincipal === '12mm' ? 'LEAF-HP12-NYL-100' : config.tuboPrincipal === '14mm' ? 'LEAF-HP14-NYL-101' : 'LEAF-HP16-NYL-102',
              comprimento_total: `${config.comprimentoTubo} metros`,
              material: 'Nylon PA12 reforçado',
              pressao_maxima: '10 bar',
              destinos: ['Câmara Inferior (flutuação principal)', 'Câmara Superior (arco de sustentação)']
            }
          },

          // CÂMARA INFERIOR (FLUTUAÇÃO PRINCIPAL)
          camara_inferior: {
            descricao: 'Câmara de flutuação principal - anel periférico da jangada',
            volume_total: pessoas <= 6 ? `${pessoas * 80} litros` : pessoas <= 10 ? `${pessoas * 85} litros` : pessoas <= 16 ? `${pessoas * 90} litros` : `${pessoas * 95} litros`,
            numero_niples: config.niplesInferior,
            numero_adaptadores: config.adaptadoresInferior,
            
            interligacoes: Array.from({ length: config.adaptadoresInferior }, (_, i) => ({
              ponto: i + 1,
              adaptador: `Adaptador Tubo-Câmara Inferior ${config.tuboPrincipal}`,
              part_number: config.tuboPrincipal === '12mm' ? 'LEAF-ADT-12-INF-500' : 'LEAF-ADT-14-INF-502',
              rosca: config.tuboPrincipal === '12mm' ? 'M16x1.5' : 'M18x1.5',
              torque_aperto: config.tuboPrincipal === '12mm' ? '25 Nm' : '28 Nm',
              tipo_vedacao: 'O-ring NBR + junta plana',
              posicao: `Posição ${(i + 1) * Math.floor(360 / config.adaptadoresInferior)}° no perímetro`
            })),

            niples_distribuicao: Array.from({ length: config.niplesInferior }, (_, i) => ({
              niple: i + 1,
              tipo: `Niple ${config.tuboPrincipal}`,
              funcao: 'Distribuição uniforme de ar',
              torque_conexao: config.tuboPrincipal === '12mm' ? '18 Nm' : config.tuboPrincipal === '14mm' ? '20 Nm' : '22 Nm'
            }))
          },

          // CÂMARA SUPERIOR (ARCO)
          camara_superior: {
            descricao: 'Câmara superior - arco de sustentação da cobertura',
            volume_total: pessoas <= 6 ? `${pessoas * 40} litros` : pessoas <= 10 ? `${pessoas * 42} litros` : pessoas <= 16 ? `${pessoas * 45} litros` : `${pessoas * 48} litros`,
            numero_niples: config.niplesSuperior,
            numero_adaptadores: config.adaptadoresSuperior,
            
            interligacoes: Array.from({ length: config.adaptadoresSuperior }, (_, i) => ({
              ponto: i + 1,
              adaptador: `Adaptador Tubo-Câmara Superior ${config.tuboPrincipal}`,
              part_number: config.tuboPrincipal === '12mm' ? 'LEAF-ADT-12-SUP-501' : 'LEAF-ADT-14-SUP-503',
              rosca: config.tuboPrincipal === '12mm' ? 'M16x1.5' : 'M18x1.5',
              torque_aperto: config.tuboPrincipal === '12mm' ? '25 Nm' : '28 Nm',
              tipo_vedacao: 'O-ring NBR + junta plana',
              posicao: `Arco ponto ${i + 1}/${config.adaptadoresSuperior}`
            })),

            niples_distribuicao: Array.from({ length: config.niplesSuperior }, (_, i) => ({
              niple: i + 1,
              tipo: `Niple ${config.tuboPrincipal}`,
              funcao: 'Distribuição uniforme de ar no arco',
              torque_conexao: config.tuboPrincipal === '12mm' ? '18 Nm' : config.tuboPrincipal === '14mm' ? '20 Nm' : '22 Nm'
            }))
          }
        },

        // TESTES DE VERIFICAÇÃO (integrado ao checklist)
        testes_verificacao: {
          teste_1_estanquicidade_valvula: {
            nome: 'Teste de Estanquicidade da Válvula',
            categoria: 'Teste de Pressão',
            quando: 'Antes da instalação e após cada manutenção',
            procedimento: [
              '1. Conectar válvula ao manómetro digital (PN: WIKA-DG10-BAR-001)',
              '2. Pressurizarmm 0.5 bar com ar comprimido',
              '3. Aplicar spray detector de vazamento em todas as conexões',
              '4. Observar por 5 minutos - não deve haver queda de pressão',
              '5. Tolerância máxima: queda de 0.02 bar em 5 minutos'
            ],
            ferramentas: ['Manómetro Digital 0-10 bar (WIKA-DG10-BAR-001)', 'Spray detector de vazamento', 'Cronómetro'],
            criterio_aprovacao: 'Zero bolhas visíveis, queda < 0.02 bar/5min',
            criterio_rejeicao: 'Qualquer bolha ou queda > 0.02 bar/5min',
            registrar_em: 'Checklist Inspeção - Secção "Testes de Pressão"'
          },

          teste_2_torque_adaptadores: {
            nome: 'Verificação de Torques dos Adaptadores',
            categoria: 'Teste Mecânico',
            quando: 'Após montagem e a cada 12 meses',
            procedimento: [
              '1. Usar chave torque digital (PN: GEDO-TRQ-080-DIG)',
              `2. Verificar adaptadores câmara inferior: ${config.tuboPrincipal === '12mm' ? '25 Nm' : '28 Nm'}`,
              `3. Verificar adaptadores câmara superior: ${config.tuboPrincipal === '12mm' ? '25 Nm' : '28 Nm'}`,
              '4. Verificar adaptadores válvula-tubo: 12-15 Nm',
              '5. Re-apertar se torque fora da tolerância ±5%'
            ],
            ferramentas: ['Chave Torque Digital 5-80 Nm (GEDO-TRQ-080-DIG)', 'Chaves específicas OTS65/A10/B10'],
            criterio_aprovacao: 'Todos os torques dentro ±5% do especificado',
            criterio_rejeicao: 'Qualquer torque fora ±5% após re-aperto',
            registrar_em: 'Checklist Inspeção - Secção "Verificações Mecânicas"'
          },

          teste_3_pressao_camara_inferior: {
            nome: 'Teste de Pressão Câmara Inferior',
            categoria: 'Teste de Pressão SOLAS',
            quando: 'Revalidação 5 anos ou após reparação',
            procedimento: [
              '1. Insuflar câmara inferior até 0.5 bar',
              '2. Fechar todas as válvulas',
              '3. Aguardar estabilização (10 minutos)',
              '4. Medir pressão inicial com manómetro digital',
              '5. Aguardar 5 minutos',
              '6. Medir pressão final',
              '7. Calcular perda: máximo 50 ml/min (equivalente a 0.025 bar em 5 min)',
              '8. Usar detector ultrassónico (PN: UES-ULTRA-LEAK-9000) se necessário'
            ],
            ferramentas: ['Manómetro Digital (WIKA-DG10-BAR-001)', 'Detector Ultrassónico (UES-ULTRA-LEAK-9000)', 'Cronómetro'],
            criterio_aprovacao: 'Perda de pressão < 0.025 bar em 5 minutos',
            criterio_rejeicao: 'Perda de pressão > 0.025 bar em 5 minutos',
            registrar_em: 'Checklist Inspeção - Secção "Testes SOLAS"'
          },

          teste_4_pressao_camara_superior: {
            nome: 'Teste de Pressão Câmara Superior (Arco)',
            categoria: 'Teste de Pressão SOLAS',
            quando: 'Revalidação 5 anos ou após reparação',
            procedimento: [
              '1. Insuflar câmara superior (arco) até 0.5 bar',
              '2. Fechar válvula de enchimento',
              '3. Aguardar estabilização (10 minutos)',
              '4. Medir pressão inicial',
              '5. Aguardar 5 minutos',
              '6. Medir pressão final',
              '7. Verificar integridade estrutural do arco',
              '8. Máximo perda: 50 ml/min ou 0.025 bar/5min'
            ],
            ferramentas: ['Manómetro Digital', 'Detector Ultrassónico', 'Fita métrica'],
            criterio_aprovacao: 'Perda < 0.025 bar/5min e sem deformações',
            criterio_rejeicao: 'Perda > 0.025 bar/5min ou deformação visível',
            registrar_em: 'Checklist Inspeção - Secção "Testes SOLAS"'
          },

          teste_5_interligacao_completa: {
            nome: 'Teste de Interligação Completa',
            categoria: 'Teste Funcional',
            quando: 'Após montagem completa e anualmente',
            procedimento: [
              '1. Conectar cilindro CO2 à válvula (verificar torque de abertura)',
              '2. Verificar todas as interligações Válvula→Tubo→Adaptadores→Câmaras',
              `3. Confirmar ${config.adaptadoresInferior} adaptadores câmara inferior`,
              `4. Confirmar ${config.adaptadoresSuperior} adaptadores câmara superior`,
              '5. Ativar insuflação automática',
              '6. Cronometrar tempo de insuflação total',
              '7. Tempo esperado: 25-45 segundos até 0.5 bar',
              '8. Verificar distribuição uniforme (sem sobrepressões localizadas)',
              '9. Confirmar funcionamento de todos os niples'
            ],
            ferramentas: ['Cronómetro', 'Manómetro Digital', 'Inspeção visual', 'Detector ultrassónico'],
            criterio_aprovacao: `Insuflação 25-45s, distribuição uniforme, ${config.niplesInferior + config.niplesSuperior} niples funcionais`,
            criterio_rejeicao: 'Tempo > 60s ou distribuição irregular ou niple bloqueado',
            registrar_em: 'Checklist Inspeção - Secção "Teste Funcional de Insuflação"'
          },

          teste_6_vedacoes_adaptadores: {
            nome: 'Inspeção Visual de Vedações',
            categoria: 'Inspeção Visual',
            quando: 'Trimestral e antes de cada uso',
            procedimento: [
              '1. Verificar visualmente todos os O-rings dos adaptadores',
              '2. Procurar sinais de: cortes, rachaduras, ressecamento, deformação',
              '3. Verificar presença de pasta vedante nas roscas',
              '4. Confirmar aperto manual (sem folga)',
              '5. Substituir O-rings com mais de 2 anos ou com defeitos'
            ],
            ferramentas: ['Lente de aumento', 'Lanterna LED', 'Checklist impresso'],
            criterio_aprovacao: 'Todos os O-rings íntegros, sem deformações',
            criterio_rejeicao: 'Qualquer O-ring com corte, rachadura ou > 2 anos',
            registrar_em: 'Checklist Inspeção - Secção "Inspeção Visual"',
            substituir_com: {
              o_rings_nbr: 'PN: PARK-NBR-12X2-OR100 (pack 10 unidades)',
              o_rings_fkm: 'PN: PARK-FKM-14X2-OR101 (pack 10 unidades)',
              pasta_vedante: 'PN: LOCT-HP-SEAL-577 (tubo 50ml)'
            }
          }
        },

        // DIAGRAMA DE FLUXO
        diagrama_fluxo: {
          descricao: 'Sequência de distribuição de ar desde o cilindro até as câmaras',
          fluxo: [
            'CILINDRO CO2 (58 bar)',
            '↓ [Conexão roscada - Torque 25-60 Nm]',
            `VÁLVULA ${pessoas <= 10 ? 'OTS65/A10/B10' : 'OTS65'} (regula para 0.4-0.5 bar)`,
            `↓ [Adaptador Válvula-Tubo - Torque ${pessoas <= 10 ? '12-15' : '15'} Nm]`,
            `TUBO PRINCIPAL ${config.tuboPrincipal} (${config.comprimentoTubo}m)`,
            '↓ [Bifurcação T]',
            '├─→ CÂMARA INFERIOR (periférica)',
            `│   ├─ ${config.adaptadoresInferior} Adaptadores [Torque ${config.tuboPrincipal === '12mm' ? '25' : '28'} Nm]`,
            `│   └─ ${config.niplesInferior} Niples de distribuição`,
            '└─→ CÂMARA SUPERIOR (arco)',
            `    ├─ ${config.adaptadoresSuperior} Adaptadores [Torque ${config.tuboPrincipal === '12mm' ? '25' : '28'} Nm]`,
            `    └─ ${config.niplesSuperior} Niples de distribuição`
          ]
        }
      }

      // Atualizar especificações RFD MKIV
      const especRFD = await prisma.especificacaoTecnica.findFirst({
        where: {
          marcaId: marcaRFD.id,
          modeloId: modeloMKIV.id,
          lotacaoId: lotacao.id
        }
      })

      if (especRFD) {
        const currentRef = JSON.parse(JSON.stringify(especRFD.referenciaCilindro || {}))
        const mergedData = JSON.parse(JSON.stringify({ ...currentRef, ...interligacaoData }))
        await prisma.especificacaoTecnica.update({
          where: { id: especRFD.id },
          data: {
            referenciaCilindro: mergedData
          }
        })
        console.log(`✅ RFD MKIV ${pessoas}p: Interligação adicionada (${config.adaptadoresInferior + config.adaptadoresSuperior} adaptadores, ${config.niplesInferior + config.niplesSuperior} niples)`)
      }

      // Atualizar especificações DSB LR07
      const especDSB = await prisma.especificacaoTecnica.findFirst({
        where: {
          marcaId: marcaDSB.id,
          modeloId: modeloLR07.id,
          lotacaoId: lotacao.id
        }
      })

      if (especDSB) {
        const currentRef = JSON.parse(JSON.stringify(especDSB.referenciaCilindro || {}))
        const mergedData = JSON.parse(JSON.stringify({ ...currentRef, ...interligacaoData }))
        await prisma.especificacaoTecnica.update({
          where: { id: especDSB.id },
          data: {
            referenciaCilindro: mergedData
          }
        })
        console.log(`✅ DSB LR07 ${pessoas}p: Interligação adicionada (${config.adaptadoresInferior + config.adaptadoresSuperior} adaptadores, ${config.niplesInferior + config.niplesSuperior} niples)`)
      }
    }

    console.log('\n' + '═'.repeat(80))
    console.log('✨ INTERLIGAÇÕES ADICIONADAS COM SUCESSO!')
    console.log('═'.repeat(80))
    console.log('\n📋 RESUMO DAS INTERLIGAÇÕES:')
    console.log('\n🔗 Sistema de Distribuição:')
    console.log('  Cilindro CO2 → Válvula (OTS65/A10/B10) → Tubo Principal → Bifurcação')
    console.log('  ├─ Câmara Inferior (via adaptadores + niples)')
    console.log('  └─ Câmara Superior/Arco (via adaptadores + niples)')
    console.log('\n🔧 Componentes por Tamanho:')
    lotacoes.forEach(p => {
      const cfg = getInterligacaoConfig(p)
      console.log(`  ${p} pessoas: Tubo ${cfg.tuboPrincipal} | ${cfg.adaptadoresInferior + cfg.adaptadoresSuperior} adaptadores | ${cfg.niplesInferior + cfg.niplesSuperior} niples`)
    })
    console.log('\n✅ 6 Testes adicionados ao checklist de inspeção:')
    console.log('  1. Teste de Estanquicidade da Válvula')
    console.log('  2. Verificação de Torques dos Adaptadores')
    console.log('  3. Teste de Pressão Câmara Inferior (SOLAS)')
    console.log('  4. Teste de Pressão Câmara Superior (SOLAS)')
    console.log('  5. Teste de Interligação Completa')
    console.log('  6. Inspeção Visual de Vedações')
    console.log('\n✅ Diagramas de fluxo incluídos em cada especificação')
    console.log('═'.repeat(80))

  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
