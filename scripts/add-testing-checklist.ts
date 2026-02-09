import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📋 Adicionando Testes de Inspecção à Checklist...')

  try {
    // Testes de inspecção com cronograma baseado no manual RFD SURVIVA MKIII
    const testes = [
      {
        nome: 'WP - Working Pressure Test',
        descricao: 'Teste de Pressão de Trabalho. Verificar que a jangada mantém pressão de 2.8 PSI (1970 mm WG) por 5 minutos sem queda de pressão anormal.',
        categoria: 'Testes de Pressão',
        frequencia: 'Anual / a cada ano de idade',
        ferramentaNecessaria: 'Manómetro (0-5 PSI / 0-350 mm WG)',
        criterioAprovacao: 'Pressão de 2.8 PSI mantida. Queda máxima aceitável: 5% (corrigida para temperatura e pressão barométrica)',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 9: Testing Schedule',
        ordem: 1
      },
      {
        nome: 'GI - Gas Inflation Test',
        descricao: 'Teste de Insuflação a Gás. Verificar se o sistema de insuflação funciona corretamente, inflando a jangada completamente em tempo aceitável.',
        categoria: 'Testes de Pressão',
        frequencia: 'Anos 5, 10, 15, 20, etc. (a cada 5 anos)',
        ferramentaNecessaria: 'Cilindro de gás carregado, manómetro, ambiente controlado',
        criterioAprovacao: 'Insuflação completa em tempo aceitável (< 30 segundos), sem vazamentos audíveis',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 9: Testing Schedule',
        ordem: 2
      },
      {
        nome: 'NAP - Necessary Additional Pressure Test',
        descricao: 'Teste de Pressão Adicional Necessária. Teste de sobrepressão para verificar integridade estrutural. Pressão: 2x pressão de trabalho durante 5 minutos.',
        categoria: 'Testes de Pressão',
        frequencia: 'Anos 10+: a partir dos 10 anos de idade, a cada ciclo de testes',
        ferramentaNecessaria: 'Manómetro (0-10 PSI / 0-700 mm WG), sistema de pressurização controlada',
        criterioAprovacao: 'Resistência a 5.6 PSI (3940 mm WG) por 5 minutos. Sem deslize de costuras, rachaduras ou outros defeitos.',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 9.3: NAP Test',
        ordem: 3
      },
      {
        nome: 'FS - Floor Seam Test',
        descricao: 'Teste das Costuras do Piso. Verificar integridade das costuras do piso isolado sob pressão de trabalho e inspecção visual de desgaste, rassgos ou separações.',
        categoria: 'Testes de Estrutura',
        frequencia: 'Anos 11+: a partir dos 11 anos, bienalmente (2 em 2 anos)',
        ferramentaNecessaria: 'Inspecção visual, possível pressurização a 2.8 PSI',
        criterioAprovacao: 'Sem danos nas costuras, sem separações. Piso mantém integridade sob pressão.',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 9: Testing Schedule',
        ordem: 4
      },
      {
        nome: 'B - Bridle Overload Test',
        descricao: 'Teste de Sobrecarga da Bridle. APENAS PARA DAVIT LAUNCH (DL). Teste de tensão aplicada aos pontos de bridle para verificar resistência e segurança de lançamento.',
        categoria: 'Testes de Equipamento',
        frequencia: 'Anos 2, 4, 6, 8 (a cada 2 anos, com alternância)',
        ferramentaNecessaria: 'Célula de carga, pontos de fixação seguros, equipamento de teste de tensão',
        criterioAprovacao: 'Bridle suporta carga especificada (conforme desenho técnico) sem deformação permanente',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 9: Testing Schedule - DL Only',
        ordem: 5
      },
      {
        nome: 'Inspecção Visual Completa',
        descricao: 'Inspecção visual geral de toda a jangada: tecido inflável, costuras, válvulas, iluminação, equipamento, packs SOLAS, container, bridle (se DL).',
        categoria: 'Inspecção Visual',
        frequencia: 'Anual (obrigatório todos os anos)',
        ferramentaNecessaria: 'Nenhuma (visual)',
        criterioAprovacao: 'Sem danos, rassgos, decoloração excessiva, corrosão, mofo, dano na tinta do container',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Annual Inspection Procedure',
        ordem: 6
      },
      {
        nome: 'Verificação de Válvulas',
        descricao: 'Verificação de integridade e funcionamento de todas as válvulas: OTS65 (alívio), MKIII (insuflação), A8 (recarga). Testar para vazamentos.',
        categoria: 'Componentes',
        frequencia: 'Anual',
        ferramentaNecessaria: 'Solução de sabão/espuma, ar pressurizado (opcional)',
        criterioAprovacao: 'Nenhum vazamento audível ou visível. Válvulas funcionam suavemente.',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 5: Valves Maintenance',
        ordem: 7
      },
      {
        nome: 'Verificação de Iluminação',
        descricao: 'Verificação do funcionamento de luzes internas e externas, verificação da data de validade das baterias (SAFT BA5800 ou equivalente).',
        categoria: 'Componentes',
        frequencia: 'Anual',
        ferramentaNecessaria: 'Nenhuma (visual)',
        criterioAprovacao: 'Luzes funcionam corretamente. Baterias com mais de 12 meses de validade restante.',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 8: Lighting Systems',
        ordem: 8
      },
      {
        nome: 'Verificação de Packs SOLAS',
        descricao: 'Verificação de integridade dos packs SOLAS A e/ou B: água (sachets sem vazamentos), rações (vácuo mantido), pirotécnicos (sem danos), medicamentos (prazo válido).',
        categoria: 'Equipamento',
        frequencia: 'Anual',
        ferramentaNecessaria: 'Nenhuma (visual)',
        criterioAprovacao: 'Nenhum sachê com vazamento. Rações com vácuo. Pirotécnicos sem danos ou corrosão. Medicamentos com data válida (mínimo 12 meses).',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 7: Equipment and Pack Contents',
        ordem: 9
      },
      {
        nome: 'Verificação de Kit de Reparação',
        descricao: 'Verificação de validade e integridade do kit de reparação (3 anos vida útil). Solução adesiva com máximo 2 anos de idade.',
        categoria: 'Equipamento',
        frequencia: 'Anual',
        ferramentaNecessaria: 'Nenhuma (visual)',
        criterioAprovacao: 'Kit dentro do prazo de validade (3 anos). Solução adesiva com menos de 2 anos. Patches intactos.',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 7.2: Repair Kit',
        ordem: 10
      },
      {
        nome: 'Teste de Vazamentos com Solução de Sabão',
        descricao: 'Teste sensível de vasamento aplicando solução de sabão/espuma em toda a jangada pressurizada a 2.8 PSI para detectar micro-vazamentos.',
        categoria: 'Testes de Vazamento',
        frequencia: 'A cada 2-3 anos (ou conforme necessário)',
        ferramentaNecessaria: 'Solução de sabão/espuma, pincel, manómetro',
        criterioAprovacao: 'Sem bolhas de ar indicando vazamentos em qualquer ponto',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Maintenance Procedures',
        ordem: 11
      },
      {
        nome: 'Inspecção do Container',
        descricao: 'Inspecção de dano físico, corrosão, mofo interior, drenagem inferior funcional, fechos, etiquetas de identificação.',
        categoria: 'Container',
        frequencia: 'Anual',
        ferramentaNecessaria: 'Nenhuma (visual)',
        criterioAprovacao: 'Sem dano estrutural. Sem corrosão significativa. Drenagem mantém abertura. Fechos funcionam. Etiquetas legíveis.',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Container Inspection',
        ordem: 12
      },
      {
        nome: 'Inspecção de Painter e Bridle',
        descricao: 'Inspecção visual do cabo painter (corda de ativação) e bridle (apenas DL): ausência de danos, corrosão dos pontos de fixação, resistência do weak link.',
        categoria: 'Sistema de Lançamento',
        frequencia: 'Anual (Throw Over e Davit Launch)',
        ferramentaNecessaria: 'Nenhuma (visual)',
        criterioAprovacao: 'Painter íntegro, sem nós largos. Bridle (DL) sem desgaste. Weak link com resistência entre 1.8-2.6 kN.',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Installation and Deployment',
        ordem: 13
      },
      {
        nome: 'Teste de Drogue (Âncora Flutuante)',
        descricao: 'Verificação de que o drogue/âncora flutuante se abre completamente quando ativado, corda íntegra sin nós ou danificações.',
        categoria: 'Equipamento',
        frequencia: 'A cada 2-3 anos (evitar ativação desnecessária)',
        ferramentaNecessaria: 'Tanque de água ou local controlado',
        criterioAprovacao: 'Drogue se abre completamente e mantém forma. Corda sem nós ou desgaste significativo.',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Sea Anchor Deployment',
        ordem: 14
      },
      {
        nome: 'Cronograma de Testes por Idade da Jangada',
        descricao: 'Referência ao cronograma detalhado de testes conforme idade da jangada. WP (1,3), B+WP (2,4), GI+WP (5), B+WP (6,8), WP (7,9), GI+NAP+FS+B+WP (10), etc.',
        categoria: 'Referência',
        frequencia: 'Referência anual',
        ferramentaNecessaria: 'Ver tabela de cronograma',
        criterioAprovacao: 'Cumprir cronograma exato conforme idade documentada da jangada',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 9.2: Testing Schedule by Age',
        ordem: 0
      }
    ]

    for (const teste of testes) {
      const existing = await prisma.checklistInspecao.findFirst({
        where: { nome: teste.nome }
      })

      let created
      if (existing) {
        created = await prisma.checklistInspecao.update({
          where: { id: existing.id },
          data: teste
        })
      } else {
        created = await prisma.checklistInspecao.create({
          data: teste
        })
      }
      console.log(`✅ ${teste.nome}`)
    }

    console.log('\n✨ Todos os testes foram adicionados à checklist com sucesso!')
    console.log(`📊 Total: ${testes.length} itens de checklist`)
    console.log('\n📋 Cronograma de Testes por Idade (RFD SURVIVA MKIII):')
    console.log('   Anos 1, 3:     WP')
    console.log('   Anos 2, 4:     B + WP')
    console.log('   Ano 5:         GI + WP')
    console.log('   Anos 6, 8:     B + WP')
    console.log('   Anos 7, 9:     WP')
    console.log('   Ano 10:        GI + NAP + FS + B + WP')
    console.log('   Anos 11, 13:   NAP + FS + WP')
    console.log('   Anos 12, 14:   NAP + FS + B + WP')
    console.log('   Ano 15:        GI + NAP + FS + WP')
    console.log('   Anos 16, 18:   NAP + FS + B + WP')
    console.log('   Anos 17, 19:   NAP + FS + WP')
    console.log('   Ano 20:        GI + NAP + FS + B + WP')
  } catch (error) {
    console.error('❌ Erro ao adicionar testes:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
