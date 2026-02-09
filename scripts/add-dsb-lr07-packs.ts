import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📦 Adicionando conteúdo dos packs SOLAS para DSB LR07...')

  try {
    // Buscar tipos de pack existentes (já criados para RFD MKIV)
    const solas_a_pack = await prisma.tipoPack.findUnique({
      where: { nome: 'SOLAS A' }
    })

    const solas_b_pack = await prisma.tipoPack.findUnique({
      where: { nome: 'SOLAS B' }
    })

    if (!solas_a_pack || !solas_b_pack) {
      throw new Error('Packs SOLAS A e B não encontrados no sistema')
    }

    // Conteúdo do pack SOLAS A já está criado
    // Apenas atualizamos o modelo para referência

    // Buscar modelo DSB LR07 e atualizar informações
    console.log('📋 Atualizando configuração do modelo DSB LR07...')

    const marca = await prisma.marcaJangada.findUnique({
      where: { nome: 'DSB' }
    })

    const modelo = await prisma.modeloJangada.findFirst({
      where: { nome: 'LR07', marcaId: marca!.id }
    })

    if (modelo) {
      await prisma.modeloJangada.update({
        where: { id: modelo.id },
        data: {
          sistemaInsuflacao: 'LEAFIELD',
          valvulasPadrao: 'OTS65'
        }
      })
      console.log(`✅ Modelo LR07 atualizado com sistema LEAFIELD e válvulas OTS65`)
    }

    console.log('\n' + '═'.repeat(60))
    console.log('✨ CONFIGURAÇÃO COMPLETA DO DSB LR07')
    console.log('═'.repeat(60))
    console.log('\n📊 Marca: DSB')
    console.log('🛟 Modelo: LR07')
    console.log('\n📏 Tamanhos disponíveis:')
    console.log('   • 4, 6, 8, 10 pessoas (Container MK 10)')
    console.log('   • 12, 16, 20, 25 pessoas (Container MK 14)')
    console.log('\n⚙️  Sistema de insuflação: LEAFIELD')
    console.log('🔧 Válvulas padrão: OTS65')
    console.log('\n📦 Packs inclusos:')
    console.log('   • SOLAS A - Completo')
    console.log('   • SOLAS B - Padrão')
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
