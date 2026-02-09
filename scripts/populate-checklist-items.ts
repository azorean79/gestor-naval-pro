/**
 * Script para popular checklist de inspeção com os 13 items derivados do manual RFD MKIV
 */

import { prisma } from '../src/lib/prisma'

interface ChecklistItem {
  nome: string
  descricao: string
  categoria: string
  frequencia: string
  ferramentaNecessaria: string
  criterioAprovacao: string
  referenciaManual: string
  aplicavelMarcaId?: string
  aplicavelModeloId?: string
  aplicavelLotacaoId?: string
  ordem: number
}

async function main() {
  console.log('🔧 Iniciando população de checklist de inspeção...\n')

  // Buscar RFD MKIV para definir aplicabilidade
  const rfldMarca = await prisma.marcaJangada.findUnique({
    where: { nome: 'RFD' }
  })

  const mkivModelo = rfldMarca 
    ? await prisma.modeloJangada.findFirst({
        where: { 
          nome: 'MKIV',
          marcaId: rfldMarca.id 
        }
      })
    : null

  // 13 checklist items derivados do manual RFD MKIV M269-00
  const checklistItems: ChecklistItem[] = [
    // Categoria: Pressão e Inflação (2 items)
    {
      nome: 'Verificação de Pressão',
      descricao: 'Verificar pressão de trabalho das câmaras contra valores do manual: Throwover (2.8 psi / 193 mb), Davit-launch (3.5 psi / 241 mb)',
      categoria: 'Pressão e Inflação',
      frequencia: 'Anual',
      ferramentaNecessaria: 'Manômetro digital WIKA DG10-BAR-001',
      criterioAprovacao: 'Pressão dentro da faixa especificada ±5%',
      referenciaManual: 'RFD MKIV M269-00, Seção Pressões de Trabalho',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 1
    },
    {
      nome: 'Verificação Peso CO₂/N₂',
      descricao: 'Pesar cilindro e verificar contra tabela de cargas de gás validada do manual',
      categoria: 'Pressão e Inflação',
      frequencia: 'Bienal',
      ferramentaNecessaria: 'Balança calibrada com precisão ±10g',
      criterioAprovacao: 'Peso dentro dos valores especificados na tabela (R5-R30) ±2%',
      referenciaManual: 'RFD MKIV M269-00, Tabela Gas Charges (pg 73)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 2
    },

    // Categoria: Torques e Apertos (4 items)
    {
      nome: 'Torque Válvula M24',
      descricao: 'Verificar e aplicar torque de 30 Nm na válvula M24 após manutenção',
      categoria: 'Torques e Apertos',
      frequencia: 'Após manutenção válvula',
      ferramentaNecessaria: 'Torquímetro GEDO-TRQ-080-DIG ou equivalente',
      criterioAprovacao: '30 Nm ±1 Nm',
      referenciaManual: 'RFD MKIV M269-00, Tabela Torque Settings (pg 74)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 3
    },
    {
      nome: 'Torque Válvula Cilindro',
      descricao: 'Aplicar torque de 160 Nm na válvula do cilindro após substituição',
      categoria: 'Torques e Apertos',
      frequencia: 'Após substituição cilindro',
      ferramentaNecessaria: 'Torquímetro calibrado 150-200 Nm',
      criterioAprovacao: '160 Nm ±5 Nm',
      referenciaManual: 'RFD MKIV M269-00, Item "Cylinder Valve" (pg 74)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 4
    },
    {
      nome: 'Torque Válvulas A10/B10',
      descricao: 'Verificar e aplicar torque de 27 Nm em válvulas A10 ou B10 após serviço',
      categoria: 'Torques e Apertos',
      frequencia: 'Após serviço válvulas',
      ferramentaNecessaria: 'Chave específica HAMM-KEY-AB10-SP + torquímetro',
      criterioAprovacao: '27 Nm ±2 Nm',
      referenciaManual: 'RFD MKIV M269-00, Item "A10/B10 valve" (pg 74)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 5
    },
    {
      nome: 'Torque H-Pack Nut',
      descricao: 'Aplicar torque de 9.5 Nm na porca do H-Pack após repacking',
      categoria: 'Torques e Apertos',
      frequencia: 'Após repacking',
      ferramentaNecessaria: 'Torquímetro de precisão 5-15 Nm',
      criterioAprovacao: '9.5 Nm ±0.5 Nm',
      referenciaManual: 'RFD MKIV M269-00, Item "H-Pack nut" (pg 74)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 6
    },

    // Categoria: Painter e HRU (3 items)
    {
      nome: 'Verificação Comprimento Painter',
      descricao: 'Medir comprimento do painter e verificar conformidade com requisito de 10m+ de comprimento',
      categoria: 'Painter e HRU',
      frequencia: 'Anual',
      ferramentaNecessaria: 'Fita métrica 15m',
      criterioAprovacao: 'Comprimento ≥ 10 metros',
      referenciaManual: 'RFD MKIV M269-00, Seção Painter Requirements (pg 77-79)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 7
    },
    {
      nome: 'Teste Weak Link',
      descricao: 'Testar resistência do weak link do painter. Inspeção visual anual, teste de carga bienal.',
      categoria: 'Painter e HRU',
      frequencia: 'Anual (visual), Bienal (carga)',
      ferramentaNecessaria: 'Dinamômetro 0-5 kN para teste bienal',
      criterioAprovacao: 'Weak link deve romper entre 1.8-2.6 kN',
      referenciaManual: 'RFD MKIV M269-00, Weak Link Specification (pg 77-79)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 8
    },
    {
      nome: 'Verificação Fixação Painter',
      descricao: 'Verificar integridade da fixação do painter à jangada e ao HRU',
      categoria: 'Painter e HRU',
      frequencia: 'Trimestral',
      ferramentaNecessaria: 'Inspeção visual, não requer ferramenta específica',
      criterioAprovacao: 'Fixação segura, sem sinais de desgaste ou danos',
      referenciaManual: 'RFD MKIV M269-00, Painter Attachment (pg 77-79)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 9
    },

    // Categoria: Sistema Elétrico (2 items)
    {
      nome: 'Verificação Cabo RL5',
      descricao: 'Medir comprimento do cabo de ativação de bateria RL5 após substituição de bateria',
      categoria: 'Sistema Elétrico',
      frequencia: 'Após substituição bateria',
      ferramentaNecessaria: 'Fita métrica/paquímetro',
      criterioAprovacao: 'Comprimento entre 700-1000 mm (aplicável a jangadas 8-20p)',
      referenciaManual: 'RFD MKIV M269-00, Battery Activation Cords (pg 74)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 10
    },
    {
      nome: 'Verificação Cabo RL6',
      descricao: 'Medir comprimento do cabo de ativação de bateria RL6 após substituição de bateria',
      categoria: 'Sistema Elétrico',
      frequencia: 'Após substituição bateria',
      ferramentaNecessaria: 'Fita métrica/paquímetro',
      criterioAprovacao: 'Comprimento entre 400-1500 mm (aplicável a jangadas 8-25p)',
      referenciaManual: 'RFD MKIV M269-00, Battery Activation Cords (pg 74)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 11
    },

    // Categoria: Contentores (1 item)
    {
      nome: 'Verificação Dimensões Contentor Xtrem',
      descricao: 'Verificar dimensões e peso do contentor Xtrem contra especificações do manual (N137-N140)',
      categoria: 'Contentores',
      frequencia: 'Após repacking',
      ferramentaNecessaria: 'Fita métrica, balança industrial',
      criterioAprovacao: 'Dimensões e peso dentro dos valores especificados ±5%',
      referenciaManual: 'RFD MKIV M269-00, Xtrem Container Dimensions (pg 72)',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 12
    },

    // Categoria: Manutenção Periódica (1 item)
    {
      nome: 'Overhaul Completo 12 Meses',
      descricao: 'Revisão completa de 12 meses conforme manual de serviço',
      categoria: 'Manutenção Periódica',
      frequencia: '12 meses',
      ferramentaNecessaria: 'Kit completo de ferramentas conforme manual',
      criterioAprovacao: 'Todos os itens do checklist de overhaul aprovados',
      referenciaManual: 'RFD MKIV M269-00, 12-Month Overhaul Period',
      aplicavelMarcaId: rfldMarca?.id,
      ordem: 13
    }
  ]

  console.log(`📋 Criando ${checklistItems.length} items de checklist...\n`)

  let created = 0
  let skipped = 0

  for (const item of checklistItems) {
    try {
      // Verificar se item já existe
      const existing = await prisma.checklistInspecao.findFirst({
        where: {
          nome: item.nome,
          categoria: item.categoria
        }
      })

      if (existing) {
        console.log(`⏭️  ${item.nome} - já existe`)
        skipped++
        continue
      }

      await prisma.checklistInspecao.create({
        data: item
      })

      console.log(`✅ ${item.categoria}: ${item.nome}`)
      created++
    } catch (error) {
      console.error(`❌ Erro ao criar ${item.nome}:`, error)
    }
  }

  console.log(`\n✨ Resumo:`)
  console.log(`   ✅ Criados: ${created}`)
  console.log(`   ⏭️  Ignorados: ${skipped}`)
  console.log(`   📊 Total: ${checklistItems.length}`)

  // Mostrar distribuição por categoria
  console.log(`\n📊 Distribuição por categoria:`)
  const categorias = Array.from(new Set(checklistItems.map(i => i.categoria)))
  for (const cat of categorias) {
    const count = checklistItems.filter(i => i.categoria === cat).length
    console.log(`   - ${cat}: ${count} items`)
  }
}

main()
  .catch((e) => {
    console.error('💥 Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
