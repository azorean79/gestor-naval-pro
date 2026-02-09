import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📦 Adicionando Spares (Peças de Reposição) ao Armazém...')

  try {
    // Spares extraídos dos manuais RFD SURVIVA MKIII e DSB LR05
    const spares = [
      // ==================== PIROTÉCNICOS ====================
      {
        nome: 'Fachos Manuais (Hand Flares)',
        descricao: 'Fachos manuais para sinalização de emergência - Aprovação MED',
        categoria: 'Pirotécnicos',
        refFabricante: 'R08374009',
        quantidade: 50,
        quantidadeMinima: 10,
        precoUnitario: 12.50,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Foguetes com Paraquedas (Rocket Parachute Flares)',
        descricao: 'Sinalizadores com paraquedas para visibilidade noturna - Aprovação MED',
        categoria: 'Pirotécnicos',
        refFabricante: 'R08375009',
        quantidade: 35,
        quantidadeMinima: 8,
        precoUnitario: 25.00,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Sinais de Fumo (Buoyant Smoke Signals)',
        descricao: 'Sinalizadores de fumo flutuante para uso diurno - Aprovação MED',
        categoria: 'Pirotécnicos',
        refFabricante: 'R08376009',
        quantidade: 40,
        quantidadeMinima: 10,
        precoUnitario: 18.75,
        fornecedor: 'RFD Beaufort / DSB'
      },

      // ==================== ÁGUA E RAÇÕES ====================
      {
        nome: 'Água Potável - Sachets 500ml',
        descricao: 'Sachets de água potável com validade de 5 anos para packs SOLAS',
        categoria: 'Água e Rações',
        refFabricante: 'R05163009',
        quantidade: 200,
        quantidadeMinima: 50,
        precoUnitario: 1.50,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Rações de Emergência - Blocos 500g',
        descricao: 'Blocos de rações de emergência com alta densidade calórica (500g)',
        categoria: 'Água e Rações',
        refFabricante: 'R04776009',
        quantidade: 150,
        quantidadeMinima: 30,
        precoUnitario: 3.25,
        fornecedor: 'RFD Beaufort / DSB'
      },

      // ==================== EQUIPAMENTO DE SOBREVIVÊNCIA ====================
      {
        nome: 'Kit de Pesca Completo',
        descricao: 'Kit de pesca com anzol, linha e flutuadores para sobrevivência prolongada',
        categoria: 'Equipamento de Sobrevivência',
        refFabricante: 'R05720099',
        quantidade: 25,
        quantidadeMinima: 5,
        precoUnitario: 8.50,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Proteção Térmica (Thermal Protective Aids - TPA)',
        descricao: 'Ajudas térmicas para proteção contra hipotermia - Aprovação MED',
        categoria: 'Equipamento de Sobrevivência',
        refFabricante: '00940200',
        quantidade: 80,
        quantidadeMinima: 20,
        precoUnitario: 22.00,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Lanterna de Emergência com LED',
        descricao: 'Lanterna com bateria não recarregável e longa duração. Incluir peças sobressalentes.',
        categoria: 'Equipamento de Sobrevivência',
        refFabricante: '07966009',
        quantidade: 30,
        quantidadeMinima: 5,
        precoUnitario: 18.50,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Refletor de Radar (Radar Reflector)',
        descricao: 'Espelho de radar (heliograph) com mastro para sinalização',
        categoria: 'Equipamento de Sobrevivência',
        refFabricante: 'N/A',
        quantidade: 45,
        quantidadeMinima: 10,
        precoUnitario: 35.00,
        fornecedor: 'RFD Beaufort / DSB'
      },

      // ==================== KIT DE REPARAÇÃO ====================
      {
        nome: 'Kit de Reparação Completo (3 anos vida útil)',
        descricao: 'Kit de reparação com patches, solução adesiva e ferramentas (vida útil: 3 anos)',
        categoria: 'Reparação',
        refFabricante: 'R50387001',
        quantidade: 40,
        quantidadeMinima: 10,
        precoUnitario: 45.00,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Patches de Reparação - Avulsos',
        descricao: 'Patches adicionais para reparação de rassgos no material inflável',
        categoria: 'Reparação',
        refFabricante: 'N/A',
        quantidade: 100,
        quantidadeMinima: 20,
        precoUnitario: 2.50,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Solução Adesiva de Reparação (Bostic 486)',
        descricao: 'Adesivo policloropreno para reparação de tecido inflável (vida útil: 2 anos)',
        categoria: 'Reparação',
        refFabricante: 'Bostic 486',
        quantidade: 20,
        quantidadeMinima: 5,
        precoUnitario: 15.00,
        fornecedor: 'Bostic / RFD Beaufort'
      },
      {
        nome: 'Âncora Flutuante Sobressalente',
        descricao: 'Âncora flutuante (drogue/sea anchor) para manutenção de posição',
        categoria: 'Reparação',
        refFabricante: '00940470',
        quantidade: 35,
        quantidadeMinima: 8,
        precoUnitario: 28.00,
        fornecedor: 'RFD Beaufort / DSB'
      },

      // ==================== FERRAMENTAS E ACESSÓRIOS ====================
      {
        nome: 'Faca Flutuante para Jangadas',
        descricao: 'Faca flutuante com cabo para corte de cordas e linhas de salvamento',
        categoria: 'Ferramentas e Acessórios',
        refFabricante: '00904040',
        quantidade: 50,
        quantidadeMinima: 10,
        precoUnitario: 12.00,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Baldes para Descarga (Bailers)',
        descricao: 'Baldes para remoção de água - quantidade varia por capacidade da jangada',
        categoria: 'Ferramentas e Acessórios',
        refFabricante: '00904210',
        quantidade: 60,
        quantidadeMinima: 15,
        precoUnitario: 6.50,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Fole Manual de Enchimento',
        descricao: 'Fole com adaptador para insuflação manual da jangada',
        categoria: 'Ferramentas e Acessórios',
        refFabricante: 'R45201001',
        quantidade: 25,
        quantidadeMinima: 5,
        precoUnitario: 24.00,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Tesoura de Emergência',
        descricao: 'Tesoura robusta para corte de linhas e amarrações',
        categoria: 'Ferramentas e Acessórios',
        refFabricante: '00725220',
        quantidade: 40,
        quantidadeMinima: 8,
        precoUnitario: 9.00,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Abre-latas (Can Opener)',
        descricao: 'Abre-latas para abertura de rações e suprimentos de emergência',
        categoria: 'Ferramentas e Acessórios',
        refFabricante: '00904200',
        quantidade: 100,
        quantidadeMinima: 20,
        precoUnitario: 3.50,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Apito de Emergência',
        descricao: 'Apito de emergência para sinalização e comunicação',
        categoria: 'Ferramentas e Acessórios',
        refFabricante: '00904130',
        quantidade: 80,
        quantidadeMinima: 15,
        precoUnitario: 4.50,
        fornecedor: 'RFD Beaufort / DSB'
      },

      // ==================== VÁLVULAS E COMPONENTES ====================
      {
        nome: 'Válvula OTS65 - Alívio de Pressão',
        descricao: 'Válvula de alívio de pressão Thanner OTS65 (27 Nm)',
        categoria: 'Válvulas e Componentes',
        refFabricante: 'OTS65',
        quantidade: 15,
        quantidadeMinima: 3,
        precoUnitario: 120.00,
        fornecedor: 'Thanner & Co. A/S'
      },
      {
        nome: 'Válvula MKIII - Insuflação',
        descricao: 'Válvula de insuflação Thanner MK III para jangadas RFD',
        categoria: 'Válvulas e Componentes',
        refFabricante: 'MK III',
        quantidade: 12,
        quantidadeMinima: 2,
        precoUnitario: 95.00,
        fornecedor: 'Thanner & Co. A/S'
      },
      {
        nome: 'Válvula A8 - Recarga (Topping-up)',
        descricao: 'Válvula de recarga/enchimento A8 para sistema THANNER',
        categoria: 'Válvulas e Componentes',
        refFabricante: 'A8',
        quantidade: 20,
        quantidadeMinima: 5,
        precoUnitario: 55.00,
        fornecedor: 'Thanner & Co. A/S'
      },
      {
        nome: 'Válvula LEAFIELD M24 - Inlet Check',
        descricao: 'Válvula de verificação de entrada M24 para sistema LEAFIELD (30 Nm)',
        categoria: 'Válvulas e Componentes',
        refFabricante: 'M24',
        quantidade: 10,
        quantidadeMinima: 2,
        precoUnitario: 130.00,
        fornecedor: 'Leafield Marine Limited'
      },
      {
        nome: 'Válvula LEAFIELD A10 - Pressure Relief',
        descricao: 'Válvula de alívio de pressão interior A10 para sistema LEAFIELD',
        categoria: 'Válvulas e Componentes',
        refFabricante: 'A10',
        quantidade: 8,
        quantidadeMinima: 2,
        precoUnitario: 110.00,
        fornecedor: 'Leafield Marine Limited'
      },
      {
        nome: 'Tampões/Batoque tipo 1',
        descricao: 'Tampão tipo 1 para vedação de furos pequenos',
        categoria: 'Válvulas e Componentes',
        refFabricante: 'R40318001',
        quantidade: 100,
        quantidadeMinima: 20,
        precoUnitario: 8.00,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Tampões/Batoque tipo 3',
        descricao: 'Tampão tipo 3 para vedação de furos médios',
        categoria: 'Válvulas e Componentes',
        refFabricante: 'R05720019',
        quantidade: 80,
        quantidadeMinima: 15,
        precoUnitario: 10.00,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Tampões/Batoque tipo 5',
        descricao: 'Tampão tipo 5 para vedação de furos grandes',
        categoria: 'Válvulas e Componentes',
        refFabricante: 'R05720023',
        quantidade: 60,
        quantidadeMinima: 12,
        precoUnitario: 12.00,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Tampas Thanner para Válvulas',
        descricao: 'Tampas de proteção para válvulas Thanner (proteção contra poeira e corrosão)',
        categoria: 'Válvulas e Componentes',
        refFabricante: 'R06742009',
        quantidade: 100,
        quantidadeMinima: 20,
        precoUnitario: 5.50,
        fornecedor: 'RFD Beaufort / DSB'
      },

      // ==================== ILUMINAÇÃO ====================
      {
        nome: 'Bateria SAFT BA5800 para Lâmpadas',
        descricao: 'Bateria não recarregável para sistemas de iluminação RL5, RL1, RL4',
        categoria: 'Iluminação',
        refFabricante: 'SAFT BA5800',
        quantidade: 60,
        quantidadeMinima: 15,
        precoUnitario: 22.00,
        fornecedor: 'SAFT'
      },
      {
        nome: 'Lâmpada LED para Iluminação Interna',
        descricao: 'Lâmpada LED com interruptor lateral para jangadas RFD (RL5)',
        categoria: 'Iluminação',
        refFabricante: 'RL5 LED',
        quantidade: 35,
        quantidadeMinima: 5,
        precoUnitario: 28.00,
        fornecedor: 'RFD Beaufort / Sistema RL5'
      },
      {
        nome: 'Conector Elétrico para Iluminação',
        descricao: 'Conector estanque para ligação de luzes externas/internas',
        categoria: 'Iluminação',
        refFabricante: 'N/A',
        quantidade: 50,
        quantidadeMinima: 10,
        precoUnitario: 6.50,
        fornecedor: 'RFD Beaufort / DSB'
      },

      // ==================== MEDICAMENTOS ====================
      {
        nome: 'Comprimidos Anti-Enjoo',
        descricao: 'Comprimidos para prevenção de enjoo em cápsulas adequadas. Vida útil: 3 anos',
        categoria: 'Medicamentos',
        refFabricante: 'N/A',
        quantidade: 500,
        quantidadeMinima: 100,
        precoUnitario: 0.75,
        fornecedor: 'Fornecedor farmacêutico aprovado'
      },
      {
        nome: 'Kit de Primeiros Socorros Completo',
        descricao: 'Kit de primeiros socorros com materiais médicos de emergência (3 anos vida útil)',
        categoria: 'Medicamentos',
        refFabricante: 'N/A',
        quantidade: 25,
        quantidadeMinima: 5,
        precoUnitario: 35.00,
        fornecedor: 'Fornecedor farmacêutico aprovado'
      },

      // ==================== DOCUMENTAÇÃO ====================
      {
        nome: 'Tabela de Sinais de Resgate',
        descricao: 'Tabela com sinais internacionais de resgate (plastificada, à prova de água)',
        categoria: 'Documentação',
        refFabricante: 'R02176011',
        quantidade: 100,
        quantidadeMinima: 20,
        precoUnitario: 2.50,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Folheto de Ação Imediata',
        descricao: 'Folheto com procedimentos de ação imediata para emergência em português',
        categoria: 'Documentação',
        refFabricante: 'N/A',
        quantidade: 150,
        quantidadeMinima: 30,
        precoUnitario: 1.00,
        fornecedor: 'RFD Beaufort / DSB'
      },
      {
        nome: 'Manual de Sobrevivência Ilustrado',
        descricao: 'Manual com ilustrações de procedimentos de sobrevivência em emergência',
        categoria: 'Documentação',
        refFabricante: 'N/A',
        quantidade: 80,
        quantidadeMinima: 15,
        precoUnitario: 3.50,
        fornecedor: 'RFD Beaufort / DSB'
      },

      // ==================== MATERIAIS DE LIMPEZA ====================
      {
        nome: 'Solução de Limpeza (Tolueno)',
        descricao: 'Tolueno/Solvente petrolífero para limpeza de tecidos revestidos com poliuretano',
        categoria: 'Materiais de Limpeza',
        refFabricante: 'N/A',
        quantidade: 30,
        quantidadeMinima: 5,
        precoUnitario: 18.00,
        fornecedor: 'Fornecedor químico aprovado'
      },
      {
        nome: 'Sabão Duro para Jangadas',
        descricao: 'Sabão duro (NÃO detergente) para lavagem geral da jangada',
        categoria: 'Materiais de Limpeza',
        refFabricante: 'N/A',
        quantidade: 100,
        quantidadeMinima: 20,
        precoUnitario: 3.00,
        fornecedor: 'Fornecedor geral'
      },
      {
        nome: 'Hipoclorito de Sódio (Solução 14-15%)',
        descricao: 'Hipoclorito de Sódio para tratamento anti-mofo de containers (proporção 1:25)',
        categoria: 'Materiais de Limpeza',
        refFabricante: 'N/A',
        quantidade: 50,
        quantidadeMinima: 10,
        precoUnitario: 8.00,
        fornecedor: 'Fornecedor químico aprovado'
      }
    ]

    for (const spare of spares) {
      // Buscar se já existe
      const existing = await prisma.stock.findFirst({
        where: { 
          AND: [
            { nome: spare.nome },
            { categoria: spare.categoria }
          ]
        }
      })

      let created
      if (existing) {
        created = await prisma.stock.update({
          where: { id: existing.id },
          data: spare
        })
      } else {
        created = await prisma.stock.create({
          data: spare
        })
      }
      console.log(`✅ ${spare.nome} (ID: ${created.id})`)
    }

    console.log('\n✨ Todos os spares foram adicionados com sucesso!')
    console.log(`📊 Total: ${spares.length} itens ao armazém`)
    console.log(`💰 Valor aproximado do inventário: €${spares.reduce((sum, s) => sum + ((s.precoUnitario || 0) * (s.quantidade || 0)), 0).toLocaleString()}`)
  } catch (error) {
    console.error('❌ Erro ao adicionar spares:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
