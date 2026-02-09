import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📦 Adicionando peças de reposição (Spare Parts) ao stock...')

  try {
    // Peças de reposição para RFD MKIV e DSB LR07
    const spareParts = [
      // Cilindros
      {
        nome: 'Cilindro CO2 1.5L (Tipo R5)',
        descricao: 'Cilindro CO2 pré-carregado 1.5L para jangadas 4 pessoas',
        categoria: 'Cilindros e Insuflação',
        quantidade: 15,
        quantidadeMinima: 3,
        precoUnitario: 85.00,
        fornecedor: 'HAMMAR / Zodiac',
        localizacao: 'Armário Cilindros - Prateleira 1',
        status: 'ativo',
        especificacao: 'Pressão 58 bar, Cartridge R5'
      },
      {
        nome: 'Cilindro CO2 2.0L (Tipo R6)',
        descricao: 'Cilindro CO2 pré-carregado 2.0L para jangadas 6 pessoas',
        categoria: 'Cilindros e Insuflação',
        quantidade: 15,
        quantidadeMinima: 3,
        precoUnitario: 95.00,
        fornecedor: 'HAMMAR / Zodiac',
        localizacao: 'Armário Cilindros - Prateleira 1',
        status: 'ativo',
        especificacao: 'Pressão 58 bar, Cartridge R6'
      },
      {
        nome: 'Cilindro CO2 2.5L (Tipo R8)',
        descricao: 'Cilindro CO2 pré-carregado 2.5L para jangadas 8 pessoas',
        categoria: 'Cilindros e Insuflação',
        quantidade: 12,
        quantidadeMinima: 2,
        precoUnitario: 105.00,
        fornecedor: 'HAMMAR / Zodiac',
        localizacao: 'Armário Cilindros - Prateleira 2',
        status: 'ativo',
        especificacao: 'Pressão 58 bar, Cartridge R8'
      },
      {
        nome: 'Cilindro CO2 3.0L (Tipo R10)',
        descricao: 'Cilindro CO2 pré-carregado 3.0L para jangadas 10 pessoas',
        categoria: 'Cilindros e Insuflação',
        quantidade: 10,
        quantidadeMinima: 2,
        precoUnitario: 120.00,
        fornecedor: 'HAMMAR / Zodiac',
        localizacao: 'Armário Cilindros - Prateleira 2',
        status: 'ativo',
        especificacao: 'Pressão 58 bar, Cartridge R10'
      },
      {
        nome: 'Cilindro CO2 3.5L (Tipo R12)',
        descricao: 'Cilindro CO2 pré-carregado 3.5L para jangadas 12 pessoas',
        categoria: 'Cilindros e Insuflação',
        quantidade: 8,
        quantidadeMinima: 1,
        precoUnitario: 135.00,
        fornecedor: 'HAMMAR / Zodiac',
        localizacao: 'Armário Cilindros - Prateleira 3',
        status: 'ativo',
        especificacao: 'Pressão 58 bar, Cartridge R12'
      },
      {
        nome: 'Cilindro CO2 4.0L (Tipo R16)',
        descricao: 'Cilindro CO2 pré-carregado 4.0L para jangadas 16 pessoas',
        categoria: 'Cilindros e Insuflação',
        quantidade: 6,
        quantidadeMinima: 1,
        precoUnitario: 150.00,
        fornecedor: 'HAMMAR / Zodiac',
        localizacao: 'Armário Cilindros - Prateleira 3',
        status: 'ativo',
        especificacao: 'Pressão 58 bar, Cartridge R16'
      },
      {
        nome: 'Cilindro CO2 5.0L (Tipo R20)',
        descricao: 'Cilindro CO2 pré-carregado 5.0L para jangadas 20 pessoas',
        categoria: 'Cilindros e Insuflação',
        quantidade: 4,
        quantidadeMinima: 1,
        precoUnitario: 175.00,
        fornecedor: 'HAMMAR / Zodiac',
        localizacao: 'Armário Cilindros - Prateleira 4',
        status: 'ativo',
        especificacao: 'Pressão 58 bar, Cartridge R20'
      },
      {
        nome: 'Cilindro CO2 6.0L (Tipo R25)',
        descricao: 'Cilindro CO2 pré-carregado 6.0L para jangadas 25 pessoas',
        categoria: 'Cilindros e Insuflação',
        quantidade: 3,
        quantidadeMinima: 1,
        precoUnitario: 195.00,
        fornecedor: 'HAMMAR / Zodiac',
        localizacao: 'Armário Cilindros - Prateleira 4',
        status: 'ativo',
        especificacao: 'Pressão 58 bar, Cartridge R25'
      },

      // Válvulas
      {
        nome: 'Válvula OTS65 (LEAFIELD)',
        descricao: 'Válvula de insuflação OTS65 sistema LEAFIELD',
        categoria: 'Válvulas e Acessórios',
        quantidade: 20,
        quantidadeMinima: 3,
        precoUnitario: 280.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Armário Válvulas - Caixa 1',
        status: 'ativo',
        especificacao: 'Pressão abertura 0.4 bar, margem segurança 0.05 bar'
      },
      {
        nome: 'Kit Reparação Válvula OTS65',
        descricao: 'Kit completo de reparação para válvula OTS65 (anéis, molas)',
        categoria: 'Válvulas e Acessórios',
        quantidade: 10,
        quantidadeMinima: 2,
        precoUnitario: 85.00,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Válvulas - Caixa 2',
        status: 'ativo',
        especificacao: 'Inclui O-rings, molas, parafusos inox'
      },

      // Cabeças de disparo (Firing heads/Cartridges)
      {
        nome: 'Cartridge Disparo R5',
        descricao: 'Cartucho de disparo para cilindro R5 (1.5L)',
        categoria: 'Sistemas de Disparo',
        quantidade: 15,
        quantidadeMinima: 3,
        precoUnitario: 45.00,
        fornecedor: 'HAMMAR',
        localizacao: 'Armário Segurança - Caixa Pólvora 1',
        status: 'ativo',
        especificacao: 'Pólvora sem chumbo, pressão ativação manual'
      },
      {
        nome: 'Cartridge Disparo R6',
        descricao: 'Cartucho de disparo para cilindro R6 (2.0L)',
        categoria: 'Sistemas de Disparo',
        quantidade: 12,
        quantidadeMinima: 2,
        precoUnitario: 50.00,
        fornecedor: 'HAMMAR',
        localizacao: 'Armário Segurança - Caixa Pólvora 1',
        status: 'ativo',
        especificacao: 'Pólvora sem chumbo, pressão ativação manual'
      },
      {
        nome: 'Cartridge Disparo R8',
        descricao: 'Cartucho de disparo para cilindro R8 (2.5L)',
        categoria: 'Sistemas de Disparo',
        quantidade: 10,
        quantidadeMinima: 2,
        precoUnitario: 55.00,
        fornecedor: 'HAMMAR',
        localizacao: 'Armário Segurança - Caixa Pólvora 2',
        status: 'ativo',
        especificacao: 'Pólvora sem chumbo, pressão ativação manual'
      },
      {
        nome: 'Cartridge Disparo R10',
        descricao: 'Cartucho de disparo para cilindro R10 (3.0L)',
        categoria: 'Sistemas de Disparo',
        quantidade: 8,
        quantidadeMinima: 1,
        precoUnitario: 60.00,
        fornecedor: 'HAMMAR',
        localizacao: 'Armário Segurança - Caixa Pólvora 2',
        status: 'ativo',
        especificacao: 'Pólvora sem chumbo, pressão ativação manual'
      },

      // Tubagem e acessórios
      {
        nome: 'Tubo Principal LEAFIELD 12mm (por metro)',
        descricao: 'Tubo principal de nylon reforçado 12mm para sistema LEAFIELD',
        categoria: 'Tubagem',
        quantidade: 50,
        quantidadeMinima: 5,
        precoUnitario: 12.50,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Tubagem - Rolo 1',
        status: 'ativo',
        especificacao: 'Nylon reforçado, pressão máx 10 bar'
      },
      {
        nome: 'Tubo Principal LEAFIELD 14mm (por metro)',
        descricao: 'Tubo principal de nylon reforçado 14mm para sistema LEAFIELD',
        categoria: 'Tubagem',
        quantidade: 40,
        quantidadeMinima: 5,
        precoUnitario: 15.00,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Tubagem - Rolo 2',
        status: 'ativo',
        especificacao: 'Nylon reforçado, pressão máx 10 bar'
      },
      {
        nome: 'Tubo Principal LEAFIELD 16mm (por metro)',
        descricao: 'Tubo principal de nylon reforçado 16mm para sistema LEAFIELD',
        categoria: 'Tubagem',
        quantidade: 30,
        quantidadeMinima: 3,
        precoUnitario: 18.00,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Tubagem - Rolo 3',
        status: 'ativo',
        especificacao: 'Nylon reforçado, pressão máx 10 bar'
      },
      {
        nome: 'Nipel Rápido Acoplamento 12mm',
        descricao: 'Nipel de acoplamento rápido 12mm inox',
        categoria: 'Tubagem',
        quantidade: 100,
        quantidadeMinima: 10,
        precoUnitario: 8.50,
        fornecedor: 'Zodiac',
        localizacao: 'Gaveta Nípeis - Bandeja 1',
        status: 'ativo',
        especificacao: 'Aço inox, pressão máx 10 bar'
      },
      {
        nome: 'Nipel Rápido Acoplamento 14mm',
        descricao: 'Nipel de acoplamento rápido 14mm inox',
        categoria: 'Tubagem',
        quantidade: 80,
        quantidadeMinima: 8,
        precoUnitario: 10.00,
        fornecedor: 'Zodiac',
        localizacao: 'Gaveta Nípeis - Bandeja 2',
        status: 'ativo',
        especificacao: 'Aço inox, pressão máx 10 bar'
      },

      // Cintas de fecho
      {
        nome: 'Cinta Fecho Aço Inox 25mm x 0.6mm',
        descricao: 'Cinta de fecho em aço inox (clip-on) 25mm',
        categoria: 'Cintas e Fixação',
        quantidade: 200,
        quantidadeMinima: 20,
        precoUnitario: 2.50,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Caixa Cintas - Compartimento 1',
        status: 'ativo',
        especificacao: 'Inox 304, torque aperto 15 Nm'
      },
      {
        nome: 'Cinta Fecho Aço Inox 32mm x 0.8mm',
        descricao: 'Cinta de fecho em aço inox (clip-on) 32mm',
        categoria: 'Cintas e Fixação',
        quantidade: 150,
        quantidadeMinima: 15,
        precoUnitario: 3.50,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Caixa Cintas - Compartimento 2',
        status: 'ativo',
        especificacao: 'Inox 304, torque aperto 18-22 Nm'
      },
      {
        nome: 'Cinta Fecho Aço Inox 40mm x 1.0mm',
        descricao: 'Cinta de fecho em aço inox (clip-on) 40mm',
        categoria: 'Cintas e Fixação',
        quantidade: 100,
        quantidadeMinima: 10,
        precoUnitario: 5.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Caixa Cintas - Compartimento 3',
        status: 'ativo',
        especificacao: 'Inox 304, torque aperto 25 Nm'
      },

      // Espumas protetoras
      {
        nome: 'Protection Foam 1 (750x500x25)',
        descricao: 'Espuma protetora tipo 1 para válvulas (750x500x25mm)',
        categoria: 'Espumas e Proteção',
        quantidade: 30,
        quantidadeMinima: 3,
        precoUnitario: 25.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Caixa Espumas - Prateleira 1',
        status: 'ativo',
        especificacao: 'Poliuretano, densidade 32 kg/m³'
      },
      {
        nome: 'Protection Foam 2 (500x250x25)',
        descricao: 'Espuma protetora tipo 2 para cilindro (500x250x25mm)',
        categoria: 'Espumas e Proteção',
        quantidade: 25,
        quantidadeMinima: 3,
        precoUnitario: 15.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Caixa Espumas - Prateleira 1',
        status: 'ativo',
        especificacao: 'Poliuretano, densidade 32 kg/m³'
      },
      {
        nome: 'Protection Foam 3 (175x175x25)',
        descricao: 'Espuma protetora tipo 3 para válvulas (175x175x25mm)',
        categoria: 'Espumas e Proteção',
        quantidade: 40,
        quantidadeMinima: 5,
        precoUnitario: 8.50,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Caixa Espumas - Prateleira 2',
        status: 'ativo',
        especificacao: 'Poliuretano, densidade 32 kg/m³'
      },
      {
        nome: 'Protection Foam 4 (150x150x25)',
        descricao: 'Espuma protetora tipo 4 para extremidade cilindro (150x150x25mm)',
        categoria: 'Espumas e Proteção',
        quantidade: 50,
        quantidadeMinima: 5,
        precoUnitario: 8.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Caixa Espumas - Prateleira 2',
        status: 'ativo',
        especificacao: 'Poliuretano, densidade 32 kg/m³'
      },
      {
        nome: 'Protection Foam 6 (350x150x25)',
        descricao: 'Espuma protetora tipo 6 para agua E-pack (350x150x25mm)',
        categoria: 'Espumas e Proteção',
        quantidade: 35,
        quantidadeMinima: 3,
        precoUnitario: 12.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Caixa Espumas - Prateleira 3',
        status: 'ativo',
        especificacao: 'Poliuretano, densidade 32 kg/m³'
      },

      // Peças diversas
      {
        nome: 'Bateria SAFT BA5800',
        descricao: 'Bateria litio para iluminação RL5/RL6 (2800 mAh)',
        categoria: 'Iluminação',
        quantidade: 25,
        quantidadeMinima: 5,
        precoUnitario: 95.00,
        fornecedor: 'SAFT / ULTRALIFE',
        localizacao: 'Armário Elétrico - Caixa Baterias',
        status: 'ativo',
        especificacao: 'CR123A, 3V, alta luminosidade'
      },
      {
        nome: 'Lanterna Estanque LED RL6',
        descricao: 'Unidade de iluminação externa LED estanque',
        categoria: 'Iluminação',
        quantidade: 12,
        quantidadeMinima: 2,
        precoUnitario: 185.00,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Iluminação - Prateleira 1',
        status: 'ativo',
        especificacao: 'IP67, 1000 lumens, ativação por água'
      },
      {
        nome: 'Espelho Heliógrafo',
        descricao: 'Espelho de sinalização para heliógrafo',
        categoria: 'Sinalizadores',
        quantidade: 20,
        quantidadeMinima: 3,
        precoUnitario: 35.00,
        fornecedor: 'Zodiac',
        localizacao: 'Caixa Sinalizadores - Compartimento 1',
        status: 'ativo',
        especificacao: 'Espelho polido inox, visibilidade até 5km'
      },
      {
        nome: 'Apito de Emergência',
        descricao: 'Apito de plástico de alta frequência para emergência',
        categoria: 'Sinalizadores',
        quantidade: 50,
        quantidadeMinima: 5,
        precoUnitario: 8.00,
        fornecedor: 'Zodiac',
        localizacao: 'Caixa Sinalizadores - Compartimento 2',
        status: 'ativo',
        especificacao: 'Frequência alta, alcance máx 100m'
      },
      {
        nome: 'Faca de Segurança Inflável',
        descricao: 'Faca para corte de cordas e cabos (sistema de liberação segura)',
        categoria: 'Ferramentas',
        quantidade: 15,
        quantidadeMinima: 2,
        precoUnitario: 42.00,
        fornecedor: 'Zodiac',
        localizacao: 'Gaveta Ferramentas - Compartimento 1',
        status: 'ativo',
        especificacao: 'Aço carbono, lâmina 80mm'
      },
      {
        nome: 'Kit Reparação Jangada Completo',
        descricao: 'Kit de reparação com diafragma, cola, patch, adesivo',
        categoria: 'Kits Reparação',
        quantidade: 20,
        quantidadeMinima: 3,
        precoUnitario: 65.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Armário Reparação - Caixa 1',
        status: 'ativo',
        especificacao: 'Inclui patches, adesivo de poliuretano, diafragmas'
      },
      {
        nome: 'Corda Anel 30m',
        descricao: 'Corda cilindrada flutuante de 30m (branca)',
        categoria: 'Cabos e Cordas',
        quantidade: 35,
        quantidadeMinima: 5,
        precoUnitario: 280.00,
        fornecedor: 'Zodiac Maritime',
        localizacao: 'Armazém Principal - Rolo Cordas',
        status: 'ativo',
        especificacao: 'Nylon flutuante, 10mm diâmetro'
      },
      {
        nome: 'Âncora Flutuante 10kg',
        descricao: 'Âncora dobrável flutuante 10kg com corda',
        categoria: 'Âncoras',
        quantidade: 25,
        quantidadeMinima: 3,
        precoUnitario: 185.00,
        fornecedor: 'Zodiac',
        localizacao: 'Armazém Principal - Prateleira Âncoras',
        status: 'ativo',
        especificacao: 'Nylon/lona, flutuabilidade positiva'
      },
      {
        nome: 'Esponja Absorção (par)',
        descricao: 'Par de esponjas para absorção de água em emergência',
        categoria: 'Acessórios',
        quantidade: 100,
        quantidadeMinima: 10,
        precoUnitario: 5.50,
        fornecedor: 'Zodiac',
        localizacao: 'Caixa Acessórios - Compartimento 1',
        status: 'ativo',
        especificacao: 'Algodão natural, absorção até 2L'
      }
    ]

    console.log(`📦 Inserindo ${spareParts.length} peças de reposição...`)

    for (const part of spareParts) {
      // Combinar descrição com especificação
      const descricaoCompleta = part.especificacao 
        ? `${part.descricao} | ${part.especificacao}`
        : part.descricao

      await prisma.stock.upsert({
        where: { 
          nome_categoria: {
            nome: part.nome,
            categoria: part.categoria
          }
        },
        update: {
          quantidade: part.quantidade,
          quantidadeMinima: part.quantidadeMinima,
          precoUnitario: part.precoUnitario,
          status: part.status,
          localizacao: part.localizacao,
          fornecedor: part.fornecedor
        },
        create: {
          nome: part.nome,
          descricao: descricaoCompleta,
          categoria: part.categoria,
          quantidade: part.quantidade,
          quantidadeMinima: part.quantidadeMinima,
          precoUnitario: part.precoUnitario,
          fornecedor: part.fornecedor,
          localizacao: part.localizacao,
          status: part.status
        }
      })
    }

    console.log('\n✨ Peças de reposição inseridas com sucesso!')
    console.log(`\n📊 Resumo de Stock:`)
    console.log('━'.repeat(70))
    console.log('CILINDROS:')
    console.log('  • R5 (1.5L) - 15 unidades')
    console.log('  • R6 (2.0L) - 15 unidades')
    console.log('  • R8 (2.5L) - 12 unidades')
    console.log('  • R10 (3.0L) - 10 unidades')
    console.log('  • R12 (3.5L) - 8 unidades')
    console.log('  • R16 (4.0L) - 6 unidades')
    console.log('  • R20 (5.0L) - 4 unidades')
    console.log('  • R25 (6.0L) - 3 unidades')
    console.log('\nVÁLVULAS:')
    console.log('  • OTS65 - 20 unidades')
    console.log('  • Kits Reparação OTS65 - 10 unidades')
    console.log('\nCARTUCHOS DE DISPARO:')
    console.log('  • R5-R10 - 45 unidades total')
    console.log('\nTUBAGEM:')
    console.log('  • Tubo 12mm - 50m')
    console.log('  • Tubo 14mm - 40m')
    console.log('  • Tubo 16mm - 30m')
    console.log('  • Nípeis 12/14mm - 180 unidades')
    console.log('\nCINTAS DE FECHO (Inox):')
    console.log('  • 25mm - 200 unidades')
    console.log('  • 32mm - 150 unidades')
    console.log('  • 40mm - 100 unidades')
    console.log('\nESPUMAS PROTETORAS:')
    console.log('  • Tipo 1-6 - 180 unidades total')
    console.log('\nILUMINAÇÃO E SINALIZADORES:')
    console.log('  • Baterias SAFT BA5800 - 25 unidades')
    console.log('  • Lanternas RL6 - 12 unidades')
    console.log('  • Heliógrafo - 20 unidades')
    console.log('  • Apitos - 50 unidades')
    console.log('\nOUTROS:')
    console.log('  • Facas segurança - 15 unidades')
    console.log('  • Kits reparação - 20 unidades')
    console.log('  • Cordas 30m - 35 unidades')
    console.log('  • Âncoras flutuantes - 25 unidades')
    console.log('  • Esponjas absorção - 100 pares')
    console.log('━'.repeat(70))

  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
