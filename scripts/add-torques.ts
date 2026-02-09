import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🔧 Adicionando Torques para Válvulas e Componentes...')

  try {
    // Buscar ou criar categoria de Torques
    const torques = [
      {
        nome: 'Válvula OTS65 - Alívio de Pressão (RFD MKIII)',
        descricao: 'Torque para instalação da válvula de alívio de pressão Thanner OTS65',
        categoria: 'Torques',
        frequencia: 'durante manutenção',
        ferramentaNecessaria: 'Ferramenta especial (hex key)',
        criterioAprovacao: '27 Nm ± 2 Nm',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 5.1'
      },
      {
        nome: 'Válvula MKIII - Insuflação (RFD)',
        descricao: 'Torque para instalação da válvula de insuflação Thanner MKIII',
        categoria: 'Torques',
        frequencia: 'durante manutenção',
        ferramentaNecessaria: 'Nenhuma/chave comum',
        criterioAprovacao: '30 Nm ± 2 Nm',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual, Section 5.1'
      },
      {
        nome: 'Válvula A8 - Recarga (Topping-up)',
        descricao: 'Torque para instalação da válvula de recarga/enchimento A8',
        categoria: 'Torques',
        frequencia: 'durante manutenção',
        ferramentaNecessaria: 'Nenhuma/chave comum',
        criterioAprovacao: '16 Nm ± 1 Nm',
        referenciaManual: 'DSB LR05 Service Manual, Section 5'
      },
      {
        nome: 'Válvula LEAFIELD M24 - Inlet Check Valve',
        descricao: 'Torque para instalação da válvula de verificação de entrada M24 (LEAFIELD)',
        categoria: 'Torques',
        frequencia: 'durante manutenção',
        ferramentaNecessaria: 'Ferramenta especial',
        criterioAprovacao: '30 Nm ± 2 Nm',
        referenciaManual: 'DSB LR05 Service Manual, Section 5'
      },
      {
        nome: 'Válvula LEAFIELD M16 - Inlet Check Valve Connector',
        descricao: 'Torque para instalação do conector M16 (LEAFIELD)',
        categoria: 'Torques',
        frequencia: 'durante manutenção',
        ferramentaNecessaria: 'Nenhuma/chave comum',
        criterioAprovacao: '9 Nm ± 1 Nm',
        referenciaManual: 'DSB LR05 Service Manual, Section 5'
      },
      {
        nome: 'Válvula LEAFIELD A10 - Pressure Relief Inner',
        descricao: 'Torque para instalação da válvula de alívio de pressão interior A10',
        categoria: 'Torques',
        frequencia: 'durante manutenção',
        ferramentaNecessaria: 'Ferramenta especial',
        criterioAprovacao: '27 Nm ± 2 Nm',
        referenciaManual: 'DSB LR05 Service Manual, Section 5'
      },
      {
        nome: 'Cilindro - Válvula do Gás',
        descricao: 'Torque para conexão da válvula do cilindro de gás (CO2/N2)',
        categoria: 'Torques',
        frequencia: 'durante recarregamento',
        ferramentaNecessaria: 'Chave apropriada',
        criterioAprovacao: '200 Nm (máximo)',
        referenciaManual: 'DSB LR05 Service Manual, Section 5'
      },
      {
        nome: 'Cilindro - Válvula/Mangueira',
        descricao: 'Torque para conexão da mangueira no cilindro',
        categoria: 'Torques',
        frequencia: 'durante manutenção',
        ferramentaNecessaria: 'Chave comum',
        criterioAprovacao: '12.2 Nm ± 1 Nm',
        referenciaManual: 'DSB LR05 Service Manual, Section 5'
      },
      {
        nome: 'Luzes de Posição - Instalação',
        descricao: 'Torque para instalação de luzes de posição externas',
        categoria: 'Torques',
        frequencia: 'durante manutenção',
        ferramentaNecessaria: 'Chave pequena',
        criterioAprovacao: '5-10 Nm',
        referenciaManual: 'RFD SURVIVA MKIII Service Manual'
      },
      {
        nome: 'Bridle - Ponto de Fixação (Davit Launch)',
        descricao: 'Torque para fixação dos pontos de bridle em jangadas Davit Launch',
        categoria: 'Torques',
        frequencia: 'durante inspeção anual',
        ferramentaNecessaria: 'Ferramenta especial',
        criterioAprovacao: 'Conforme desenho técnico específico',
        referenciaManual: 'RFD/DSB Service Manual - Davit Launch Section'
      }
    ]

    for (const torque of torques) {
      // Buscar se já existe
      const existing = await prisma.checklistInspecao.findFirst({
        where: { nome: torque.nome }
      })

      let created
      if (existing) {
        created = await prisma.checklistInspecao.update({
          where: { id: existing.id },
          data: {
            ...torque,
            ordem: torques.indexOf(torque)
          }
        })
      } else {
        created = await prisma.checklistInspecao.create({
          data: {
            ...torque,
            ordem: torques.indexOf(torque)
          }
        })
      }
      console.log(`✅ ${torque.nome} (${torque.criterioAprovacao})`)
    }

    console.log('\n✨ Todos os torques foram adicionados com sucesso!')
    console.log(`📊 Total: ${torques.length} especificações de torque`)
  } catch (error) {
    console.error('❌ Erro ao adicionar torques:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
