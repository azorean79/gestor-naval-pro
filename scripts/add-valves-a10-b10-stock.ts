import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📦 Adicionando válvulas A10 e B10 ao stock...')

  try {
    const valvulasNovas = [
      {
        nome: 'Válvula A10 (Sistema Tubo Pressão)',
        descricao: 'Válvula A10 de insuflação com sistema de tubo de pressão',
        categoria: 'Válvulas e Acessórios',
        quantidade: 18,
        quantidadeMinima: 3,
        precoUnitario: 320.00,
        fornecedor: 'Zodiac / RFD / HAMMAR',
        localizacao: 'Armário Válvulas - Caixa 3',
        status: 'ativo',
        especificacao: 'Pressão abertura 0.5 bar, compatível com tubo de pressão'
      },
      {
        nome: 'Válvula B10 (Sistema Tubo Pressão)',
        descricao: 'Válvula B10 de insuflação com sistema de tubo de pressão',
        categoria: 'Válvulas e Acessórios',
        quantidade: 18,
        quantidadeMinima: 3,
        precoUnitario: 320.00,
        fornecedor: 'Zodiac / RFD / HAMMAR',
        localizacao: 'Armário Válvulas - Caixa 3',
        status: 'ativo',
        especificacao: 'Pressão abertura 0.5 bar, compatível com tubo de pressão'
      },
      {
        nome: 'Kit Reparação A10/B10',
        descricao: 'Kit completo de reparação para válvulas A10/B10',
        categoria: 'Válvulas e Acessórios',
        quantidade: 12,
        quantidadeMinima: 2,
        precoUnitario: 95.00,
        fornecedor: 'Zodiac / HAMMAR',
        localizacao: 'Armário Válvulas - Caixa 4',
        status: 'ativo',
        especificacao: 'Inclui O-rings, regulador pressão, parafusos inox'
      },
      {
        nome: 'Tubo Pressão para A10/B10 (por metro)',
        descricao: 'Tubo de pressão 6mm para sistema A10/B10',
        categoria: 'Tubagem',
        quantidade: 80,
        quantidadeMinima: 10,
        precoUnitario: 4.50,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Tubagem - Rolo 4',
        status: 'ativo',
        especificacao: 'Nylon reforçado 6mm, pressão máx 5 bar'
      },
      {
        nome: 'Conectores Tubo Pressão A10/B10',
        descricao: 'Conectores rápidos para tubo de pressão 6mm',
        categoria: 'Tubagem',
        quantidade: 100,
        quantidadeMinima: 10,
        precoUnitario: 6.50,
        fornecedor: 'Zodiac',
        localizacao: 'Gaveta Conectores - Bandeja 3',
        status: 'ativo',
        especificacao: 'Inox, encaixe rápido 6mm'
      }
    ]

    console.log(`📦 Inserindo ${valvulasNovas.length} novos itens de válvulas A10/B10...`)

    for (const valvula of valvulasNovas) {
      const descricaoCompleta = valvula.especificacao 
        ? `${valvula.descricao} | ${valvula.especificacao}`
        : valvula.descricao

      await prisma.stock.upsert({
        where: { 
          nome_categoria: {
            nome: valvula.nome,
            categoria: valvula.categoria
          }
        },
        update: {
          quantidade: valvula.quantidade,
          quantidadeMinima: valvula.quantidadeMinima,
          precoUnitario: valvula.precoUnitario,
          status: valvula.status,
          localizacao: valvula.localizacao,
          fornecedor: valvula.fornecedor
        },
        create: {
          nome: valvula.nome,
          descricao: descricaoCompleta,
          categoria: valvula.categoria,
          quantidade: valvula.quantidade,
          quantidadeMinima: valvula.quantidadeMinima,
          precoUnitario: valvula.precoUnitario,
          fornecedor: valvula.fornecedor,
          localizacao: valvula.localizacao,
          status: valvula.status
        }
      })
    }

    console.log('\n' + '═'.repeat(70))
    console.log('✨ VÁLVULAS A10 E B10 ADICIONADAS COM SUCESSO!')
    console.log('═'.repeat(70))
    console.log('\n📊 Resumo de válvulas no sistema:')
    console.log('\nVÁLVULAS PADRÃO (LEAFIELD):')
    console.log('  ✓ OTS65 - 20 unidades')
    console.log('  ✓ Kit Reparação OTS65 - 10 unidades')
    console.log('\nVÁLVULAS ALTERNATIVAS (TUBO DE PRESSÃO):')
    console.log('  ✓ A10 - 18 unidades')
    console.log('  ✓ B10 - 18 unidades')
    console.log('  ✓ Kit Reparação A10/B10 - 12 unidades')
    console.log('\nTUBAGEM ESPECÍFICA PARA A10/B10:')
    console.log('  ✓ Tubo Pressão 6mm - 80 metros')
    console.log('  ✓ Conectores Tubo Pressão - 100 unidades')
    console.log('\n📋 Configuração de todas as jangadas:')
    console.log('  • RFD MKIV (4-25 pessoas) - OTS65 / A10 / B10')
    console.log('  • DSB LR07 (4-25 pessoas) - OTS65 / A10 / B10')
    console.log('\n✅ Todos os modelos agora suportam múltiplas configurações de válvulas!')
    console.log('═'.repeat(70))

  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
