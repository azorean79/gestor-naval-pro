import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('⚙️ Adicionando Pressões de Trabalho e Especificações de Teste para Modelos...')

  try {
    // Dados de pressão de trabalho por modelo (extraído dos manuais SOLAS)
    const ModelsSpecifications = [
      {
        modelo: 'SURVIVA MKIII',
        marca: 'RFD',
        pressaoTrabalho: {
          psi: 2.8,
          mmWG: 1968.59,
          inH2O: 77.51,
          milibares: 193.0
        },
        sistemaInsuflacao: 'THANNER',
        valvulas: 'OTS65',
        capacidadesDL: [12, 16, 20, 25],
        weakLink: {
          forcaMinKN: 1.8,
          forcaMaxKN: 2.6,
          forcaMinLbf: 404.66,
          forcaMaxLbf: 584.5
        },
        testeBridle: {
          frequencia: 'Bienal (a cada 2 anos)',
          ciclos: [2, 4, 6, 8],
          descricao: 'Teste de sobrecarga da bridle - verificar que aguenta carga de lançamento'
        }
      },
      {
        modelo: 'LR05',
        marca: 'DSB',
        pressaoTrabalho: {
          psi: 2.8,
          mmWG: 1968.59,
          inH2O: 77.51,
          milibares: 193.0
        },
        sistemaInsuflacao: 'THANNER / LEAFIELD',
        valvulas: 'OTS65 / A10',
        capacidadesDL: [12, 16, 20, 25],
        weakLink: {
          forcaMinKN: 1.8,
          forcaMaxKN: 2.6,
          forcaMinLbf: 404.66,
          forcaMaxLbf: 584.5
        },
        testeBridle: {
          frequencia: 'Bienal (a cada 2 anos)',
          ciclos: [2, 4, 6, 8],
          descricao: 'Teste de sobrecarga da bridle - verificar que aguenta carga de lançamento'
        }
      },
      {
        modelo: 'SURVIVA MKIV',
        marca: 'RFD',
        pressaoTrabalho: {
          psi: 3.75,
          mmWG: 2609.65,
          inH2O: 102.76,
          milibares: 510.0
        },
        sistemaInsuflacao: 'LEAFIELD',
        valvulas: 'OTS65 / A10',
        capacidadesDL: [10, 12, 16, 20, 25], // MKIV tem capacidades DL diferentes
        weakLink: {
          forcaMinKN: 2.0,
          forcaMaxKN: 3.0,
          forcaMinLbf: 449.24,
          forcaMaxLbf: 673.86
        },
        testeBridle: {
          frequencia: 'Bienal (a cada 2 anos)',
          ciclos: [2, 4, 6, 8],
          descricao: 'Teste de sobrecarga da bridle com carga elevada devido a pressão maior'
        }
      },
      {
        modelo: 'LR97',
        marca: 'DSB',
        pressaoTrabalho: {
          psi: 2.64,
          mmWG: 1850.5,
          inH2O: 72.83,
          milibares: 360.0
        },
        sistemaInsuflacao: 'THANNER',
        valvulas: 'OTS65',
        capacidadesDL: [12, 16, 20, 25],
        weakLink: {
          forcaMinKN: 1.8,
          forcaMaxKN: 2.6,
          forcaMinLbf: 404.66,
          forcaMaxLbf: 584.5
        },
        testeBridle: {
          frequencia: 'Bienal (a cada 2 anos)',
          ciclos: [2, 4, 6, 8],
          descricao: 'Teste de sobrecarga 1.1x G a cada 2 anos conforme manual'
        }
      },
      {
        modelo: 'LR07',
        marca: 'DSB',
        pressaoTrabalho: {
          psi: 2.8,
          mmWG: 1968.59,
          inH2O: 77.51,
          milibares: 193.0
        },
        sistemaInsuflacao: 'LEAFIELD',
        valvulas: 'A10, A6, C7, D7, A5, A7',
        capacidadesDL: [12, 16, 20, 25],
        weakLink: {
          forcaMinKN: 1.8,
          forcaMaxKN: 2.6,
          forcaMinLbf: 404.66,
          forcaMaxLbf: 584.5
        },
        testeBridle: {
          frequencia: 'Bienal (a cada 2 anos)',
          ciclos: [2, 4, 6, 8],
          descricao: 'Teste de sobrecarga da bridle'
        }
      }
    ]

    // Adicionar informações técnicas para cada modelo
    for (const specs of ModelsSpecifications) {
      const modelo = await prisma.modeloJangada.findFirst({
        where: { 
          nome: specs.modelo,
          marca: { nome: specs.marca }
        }
      })

      if (modelo) {
        // Adicionar itens de checklist para cada especificação de teste
        const testItems = [
          {
            nome: `WP - Teste de Pressão de Trabalho (${specs.modelo})`,
            descricao: `Verificar pressão de ${specs.pressaoTrabalho.psi} PSI (${specs.pressaoTrabalho.mmWG} mm WG) por 5 minutos`,
            categoria: 'Testes de Pressão',
            frequencia: 'Anual',
            criterioAprovacao: `${specs.pressaoTrabalho.psi} PSI ± 0.2 PSI`,
            referenciaManual: `Manual técnico ${specs.marca} ${specs.modelo}`
          },
          {
            nome: `NAP - Sobrepressão 2x Pressão (${specs.modelo})`,
            descricao: `Teste sob sobrepressão de ${specs.pressaoTrabalho.psi * 2} PSI por 5 minutos`,
            categoria: 'Testes de Pressão',
            frequencia: 'A partir dos 10 anos',
            criterioAprovacao: `${specs.pressaoTrabalho.psi * 2} PSI (2x pressão trabalho) sem danos`,
            referenciaManual: `Manual técnico ${specs.marca} ${specs.modelo}`
          }
        ]

        // Se tem capacidades DL, adicionar teste de bridle
        if (specs.capacidadesDL && specs.capacidadesDL.length > 0) {
          testItems.push({
            nome: `B - Teste de Bridle (${specs.modelo} DL)`,
            descricao: `Teste de sobrecarga da bridle para Davit Launch. Weak link: ${specs.weakLink.forcaMinKN}-${specs.weakLink.forcaMaxKN} kN`,
            categoria: 'Testes de Equipamento',
            frequencia: 'Bienal (a cada 2 anos)',
            criterioAprovacao: `Bridle suporta carga de lançamento. Weak link ${specs.weakLink.forcaMinKN}-${specs.weakLink.forcaMaxKN} kN`,
            referenciaManual: `Manual técnico ${specs.marca} ${specs.modelo} - Davit Launch Section`
          })
        }

        // Adicionar os itens de checklist
        for (const item of testItems) {
          const existing = await prisma.checklistInspecao.findFirst({
            where: { nome: item.nome }
          })

          if (!existing) {
            await prisma.checklistInspecao.create({
              data: {
                ...item,
                aplicavelModeloId: modelo.id,
                ordem: 0
              }
            })
            console.log(`✅ ${item.nome}`)
          }
        }

        // Log das especificações de pressão
        console.log(`\n📊 ${specs.marca} ${specs.modelo}:`)
        console.log(`   Pressão: ${specs.pressaoTrabalho.psi} PSI (${specs.pressaoTrabalho.mmWG} mmWG / ${specs.pressaoTrabalho.inH2O} inH2O)`)
        console.log(`   Sistema: ${specs.sistemaInsuflacao}`)
        if (specs.capacidadesDL.length > 0) {
          console.log(`   Davit Launch: ${specs.capacidadesDL.join(', ')} pessoas`)
          console.log(`   Weak Link: ${specs.weakLink.forcaMinKN}-${specs.weakLink.forcaMaxKN} kN`)
        }
      }
    }

    console.log('\n✨ Pressões de trabalho e especificações de teste adicionadas com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao adicionar especificações:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
