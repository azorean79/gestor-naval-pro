import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Adicionando marca DSB e modelo LR07...')

  try {
    // Criar marca DSB
    const marca = await prisma.marcaJangada.upsert({
      where: { nome: 'DSB' },
      update: { ativo: true },
      create: { 
        nome: 'DSB', 
        ativo: true 
      }
    })
    console.log(`✅ Marca DSB criada/atualizada com ID: ${marca.id}`)

    // Criar modelo LR07
    const modelo = await prisma.modeloJangada.upsert({
      where: { 
        nome_marcaId: { 
          nome: 'LR07', 
          marcaId: marca.id 
        } 
      },
      update: { ativo: true },
      create: { 
        nome: 'LR07', 
        marcaId: marca.id,
        sistemaInsuflacao: 'LEAFIELD',
        valvulasPadrao: 'OTS65',
        ativo: true 
      }
    })
    console.log(`✅ Modelo LR07 criado/atualizado com ID: ${modelo.id}`)

    console.log('✨ Processo concluído com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao adicionar marca e modelo:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
