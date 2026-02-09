import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📦 Adicionando conteúdo dos packs SOLAS para RFD MKIV...')

  try {
    // Buscar tipos de pack existentes
    let solas_a_pack = await prisma.tipoPack.findFirst({
      where: { nome: 'SOLAS A' }
    })

    if (!solas_a_pack) {
      solas_a_pack = await prisma.tipoPack.create({
        data: {
          nome: 'SOLAS A',
          descricao: 'Pack SOLAS A - Equipamento de Emergência Completo'
        }
      })
    }

    let solas_b_pack = await prisma.tipoPack.findFirst({
      where: { nome: 'SOLAS B' }
    })

    if (!solas_b_pack) {
      solas_b_pack = await prisma.tipoPack.create({
        data: {
          nome: 'SOLAS B',
          descricao: 'Pack SOLAS B - Equipamento de Segurança Padrão'
        }
      })
    }

    // Conteúdo do pack SOLAS A para RFD MKIV
    // Baseado nas especificações extraídas do manual
    const contentSOLASA = {
      racoesEmergencia: 1,           // 1 rações por pessoa
      aguaPotavel: 1.5,              // 1.5 litros por pessoa (dependendo do tamanho)
      kitPrimeirosSocorros: true,
      comprimidosEnjooPorPessoa: 2,
      sacosEnjooPorPessoa: 2,
      foguetesParaquedas: 2,         // Sinalizadores
      fachosMao: 5,                  // Fachos de mão
      sinaisFumo: 3,                 // Sinais de fumo
      lanternaEstanque: true,        // Lanterna estanque
      heliógrafo: true,              // Espelho heliógrafo
      apito: true,                   // Apitos de emergência
      faca: true,                    // Facas de corte
      esponjas: 2,                   // Espongas de absorção
      abreLatas: 1,                  // Abre-latas
      coposGraduados: 2,             // Copos graduados
      mantasTermicas: 2,             // Mantas térmicas
      kitPesca: false,
      manualSobrevivencia: true,     // Manual de sobrevivência
      tabelaSinais: true,            // Tabela de sinais
      foleEnchimento: false,         // Fole de enchimento
      tampoesFuros: true,            // Tampos para furos
      kitReparacao: true,            // Kit de reparação
      ancorasQuantidade: 1,          // Âncora flutuante
      luzInterna: 'RL5 ou RL6',      // Sistema de iluminação interna
      luzExterna: 'RL5 ou RL6',      // Sistema de iluminação externa
      bateria: 'SAFT BA5800 ou equivalente'
    }

    // Atualizar ou criar conteúdo do pack SOLAS A
    const packSOLASACriado = await prisma.conteudoPack.upsert({
      where: { tipoPackId: solas_a_pack.id },
      update: contentSOLASA,
      create: {
        tipoPackId: solas_a_pack.id,
        ...contentSOLASA
      }
    })

    console.log(`✅ Conteúdo Pack SOLAS A criado/atualizado`)
    console.log(`   - Rações de emergência: ${contentSOLASA.racoesEmergencia} por pessoa`)
    console.log(`   - Água potável: ${contentSOLASA.aguaPotavel}L por pessoa`)
    console.log(`   - Kit primeiros socorros: ${contentSOLASA.kitPrimeirosSocorros ? 'Incluído' : 'Não'}`)
    console.log(`   - Sinalizadores: ${contentSOLASA.foguetesParaquedas} foguetes + ${contentSOLASA.fachosMao} fachos + ${contentSOLASA.sinaisFumo} fumos`)
    console.log(`   - Iluminação: ${contentSOLASA.luzExterna} (externa) + ${contentSOLASA.luzInterna} (interna)`)

    // Conteúdo SOLAS B (versão simplificada)
    const contentSOLASB = {
      racoesEmergencia: 1,
      aguaPotavel: 1.5,
      kitPrimeirosSocorros: true,
      comprimidosEnjooPorPessoa: 1,
      sacosEnjooPorPessoa: 1,
      foguetesParaquedas: 1,
      fachosMao: 2,
      sinaisFumo: 1,
      lanternaEstanque: true,
      heliógrafo: true,
      apito: true,
      faca: true,
      esponjas: 1,
      abreLatas: 1,
      coposGraduados: 1,
      mantasTermicas: 1,
      kitPesca: false,
      manualSobrevivencia: true,
      tabelaSinais: true,
      foleEnchimento: false,
      tampoesFuros: true,
      kitReparacao: true,
      ancorasQuantidade: 1,
      luzInterna: 'RL5 ou RL6',
      luzExterna: 'RL5 ou RL6',
      bateria: 'SAFT BA5800 ou equivalente'
    }

    // Atualizar ou criar conteúdo do pack SOLAS B
    const packSOLASBCriado = await prisma.conteudoPack.upsert({
      where: { tipoPackId: solas_b_pack.id },
      update: contentSOLASB,
      create: {
        tipoPackId: solas_b_pack.id,
        ...contentSOLASB
      }
    })

    console.log(`\n✅ Conteúdo Pack SOLAS B criado/atualizado (versão simplificada)`)

    // Buscar modelo RFD MKIV e atualizar informações
    console.log('\n📋 Atualizando configuração do modelo RFD MKIV...')

    const marca = await prisma.marcaJangada.findUnique({
      where: { nome: 'RFD' }
    })

    const modelo = await prisma.modeloJangada.findFirst({
      where: { nome: 'MKIV', marcaId: marca!.id }
    })

    if (modelo) {
      await prisma.modeloJangada.update({
        where: { id: modelo.id },
        data: {
          sistemaInsuflacao: 'LEAFIELD',
          valvulasPadrao: 'OTS65'
        }
      })
      console.log(`✅ Modelo MKIV atualizado com sistema LEAFIELD e válvulas OTS65`)
    }

    console.log('\n' + '═'.repeat(60))
    console.log('✨ CONFIGURAÇÃO COMPLETA DO RFD MKIV')
    console.log('═'.repeat(60))
    console.log('\n📊 Marca: RFD')
    console.log('🛟 Modelo: MKIV')
    console.log('\n📏 Tamanhos disponíveis:')
    console.log('   • 4, 6, 8, 10 pessoas (Container MK 10)')
    console.log('   • 12, 16, 20, 25 pessoas (Container MK 14)')
    console.log('\n⚙️  Sistema de insuflação: LEAFIELD')
    console.log('🔧 Válvulas padrão: OTS65')
    console.log('\n📦 Packs inclusos:')
    console.log('   • SOLAS A - Completo (com rações, águaágua, sinalizadores, iluminação)')
    console.log('   • SOLAS B - Padrão (versão simplificada)')
    console.log('\n🔦 Iluminação:')
    console.log('   • Sistema RL5 ou RL6')
    console.log('   • Bateria: SAFT BA5800 ou equivalente')
    console.log('\n📋 Equipamento incluso padrão (SOLAS A):')
    console.log('   ✓ Espuma protetora (tipos 1-6 conforme tamanho)')
    console.log('   ✓ Rações de emergência (1 por pessoa)')
    console.log('   ✓ Água potável (1.5L por pessoa)')
    console.log('   ✓ Kit primeiros socorros completo')
    console.log('   ✓ Sinalizadores (foguetes, fachos, fumo)')
    console.log('   ✓ Manual de sobrevivência')
    console.log('   ✓ Tabela de sinais')
    console.log('   ✓ Kit de reparação')
    console.log('   ✓ Âncora flutuante')
    console.log('   ✓ Esponjas, abre-latas, copos graduados')
    console.log('\n✅ Status: Pronto para uso em produção!')
    console.log('═'.repeat(60))

  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
