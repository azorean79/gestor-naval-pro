import { PrismaClient } from '../prisma/app/generated-prisma-client'
import { EXEMPLOS_JANGADAS } from '../src/lib/exemplos-jangadas'

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
})

async function main() {
  console.log('🛟 Criando todas as jangadas (reais + genéricas)...\n')

  // Marcas com exemplos reais
  const marcasComExemplos = ['RFD', 'DSB', 'Zodiac', 'Eurovinil', 'Plastimo']

  const exemplosFiltrados = EXEMPLOS_JANGADAS.filter(e =>
    marcasComExemplos.includes(e.marca)
  )

  // Marcas genéricas (sem dados nos exemplos)
  const marcasGenericas = [
    { nome: 'ARIMAR', modelos: ['Classic', 'Pro', 'Elite'] },
    { nome: 'HERO', modelos: ['Standard', 'Plus', 'Premium'] },
    { nome: 'OCEAN SAFETY', modelos: ['OSX-1', 'OSX-2', 'OSX-3'] },
    { nome: 'LALILZAS', modelos: ['Marine', 'Coastal', 'Deep'] },
  ]

  console.log(`📊 Resumo do plano:`)
  console.log(`   Marcas com exemplos reais: ${marcasComExemplos.join(', ')}`)
  console.log(`   Exemplos encontrados: ${exemplosFiltrados.length}`)
  console.log(`   Marcas genéricas: ${marcasGenericas.map(m => m.nome).join(', ')}`)
  console.log(`   Total marcas: ${marcasComExemplos.length + marcasGenericas.length}\n`)

  // Buscar um cliente para vincular
  let cliente = await prisma.cliente.findFirst()
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        nome: 'Exemplo de Cliente',
        email: 'exemplo@cliente.com',
        nif: '000000000',
      },
    })
  }

  // Buscar tipos de pack existentes
  const tiposPack = await prisma.tipoPack.findMany()

  let jangadasCriadas = 0
  const marcasProcessadas = new Map<string, number>()

  // ===== PARTE 1: Criar jangadas dos exemplos reais =====
  console.log(`\n📚 Criando jangadas com dados reais...\n`)

  for (const exemplo of exemplosFiltrados) {
    // Buscar ou criar marca
    let marca = await prisma.marcaJangada.findUnique({
      where: { nome: exemplo.marca },
    })

    if (!marca) {
      marca = await prisma.marcaJangada.create({
        data: {
          nome: exemplo.marca,
          ativo: true,
        },
      })
    }

    // Buscar ou criar modelo
    let modelo = await prisma.modeloJangada.findUnique({
      where: {
        nome_marcaId: {
          nome: exemplo.modelo,
          marcaId: marca.id,
        },
      },
    })

    if (!modelo) {
      modelo = await prisma.modeloJangada.create({
        data: {
          nome: exemplo.modelo,
          marcaId: marca.id,
          sistemaInsuflacao: exemplo.cilindroSistema || 'THANNER',
          valvulasPadrao: 'OTS65',
          ativo: true,
        },
      })
    }

    // Buscar ou criar lotação
    let lotacao = await prisma.lotacaoJangada.findUnique({
      where: { capacidade: exemplo.capacidade },
    })

    if (!lotacao) {
      lotacao = await prisma.lotacaoJangada.create({
        data: {
          capacidade: exemplo.capacidade,
          ativo: true,
        },
      })
    }

    // Buscar tipo de pack
    const tipoPack = tiposPack.find(tp => tp.nome === exemplo.tipoPack)

    try {
      const jangada = await prisma.jangada.create({
        data: {
          numeroSerie: exemplo.numeroSerie,
          tipo: exemplo.modelo,
          marcaId: marca.id,
          modeloId: modelo.id,
          lotacaoId: lotacao.id,
          tipoPackId: tipoPack?.id,
          tipoPack: exemplo.tipoPack,
          clienteId: cliente.id,
          capacidade: exemplo.capacidade,
          peso: 35,
          numeroAprovacao: exemplo.numeroSerie.split('-')[0],
          dataFabricacao: exemplo.dataFabricacao,
          dataInspecao: exemplo.dataInspecao,
          dataProximaInspecao: exemplo.dataProximaInspecao,
          status: exemplo.status,
          estado: 'instalada',
          tecnico: exemplo.tecnico || 'Julio Correia',
        },
      })

      // Criar inspeção para a jangada
      const inspecao = await prisma.inspecao.create({
        data: {
          numero: `INS-${exemplo.numeroSerie}`,
          tipoInspecao: 'anual',
          dataInspecao: exemplo.dataInspecao,
          dataProxima: exemplo.dataProximaInspecao,
          resultado: 'aprovada',
          status: 'realizada',
          tecnico: exemplo.tecnico || 'Julio Correia',
          jangadaId: jangada.id,
          observacoes: `${marca.nome} ${modelo.nome} - ${exemplo.tipoPack}`,
        },
      })

      // Criar componentes de inspeção baseado nos dados do exemplo
      const componentesDoExemplo = Object.entries(
        exemplo.componentesSelecionados || {}
      )

      for (const [nomeComponente, dados] of componentesDoExemplo) {
        if ((dados as any).incluido) {
          const validadeKey = nomeComponente as keyof typeof exemplo.validadeComponentes
          const validadeStr = exemplo.validadeComponentes?.[validadeKey]
          let dataValidade: Date | undefined

          if (validadeStr) {
            const [mes, ano] = validadeStr.split('/')
            dataValidade = new Date(`${ano}-${mes}-01`)
          }

          await prisma.inspecaoComponente.create({
            data: {
              jangadaId: jangada.id,
              nome: nomeComponente,
              quantidade: (dados as any).quantidade || 1,
              estado: 'OK',
              validade: dataValidade,
              notas: `Componente do pack ${exemplo.tipoPack}`,
            },
          })
        }
      }

      // Contar por marca
      const contagemMarca = (marcasProcessadas.get(marca.nome) || 0) + 1
      marcasProcessadas.set(marca.nome, contagemMarca)

      console.log(
        `✅ ${marca.nome} - ${modelo.nome} (${exemplo.numeroSerie})`
      )
      console.log(`   └─ ${exemplo.tipoPack} com ${componentesDoExemplo.length} componentes`)
      jangadasCriadas++
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⚠️  ${marca.nome} - ${modelo.nome} - Já existe`)
      } else {
        console.log(`❌ ${marca.nome} - Erro: ${error.message}`)
      }
    }
  }

  // ===== PARTE 2: Criar marcas genéricas com modelos =====
  console.log(`\n🔧 Criando marcas genéricas...\n`)
  const tiposPackGenerico = ['STD', 'ORC', 'E']
  const capacidadesGenerico = [4, 6, 8, 10, 12]

  for (const marcaGen of marcasGenericas) {
    let marca = await prisma.marcaJangada.findUnique({
      where: { nome: marcaGen.nome },
    })

    if (!marca) {
      marca = await prisma.marcaJangada.create({
        data: {
          nome: marcaGen.nome,
          ativo: true,
        },
      })
    }

    for (const nomeModelo of marcaGen.modelos) {
      let modelo = await prisma.modeloJangada.findUnique({
        where: {
          nome_marcaId: {
            nome: nomeModelo,
            marcaId: marca.id,
          },
        },
      })

      if (!modelo) {
        modelo = await prisma.modeloJangada.create({
          data: {
            nome: nomeModelo,
            marcaId: marca.id,
            sistemaInsuflacao: 'THANNER',
            valvulasPadrao: 'OTS65',
            ativo: true,
          },
        })
      }

      // Criar uma jangada para cada modelo genérico
      const capacidade = capacidadesGenerico[Math.floor(Math.random() * capacidadesGenerico.length)]
      const tipoPack = tiposPackGenerico[Math.floor(Math.random() * tiposPackGenerico.length)]

      let lotacao = await prisma.lotacaoJangada.findUnique({
        where: { capacidade },
      })

      if (!lotacao) {
        lotacao = await prisma.lotacaoJangada.create({
          data: {
            capacidade,
            ativo: true,
          },
        })
      }

      const tipoPackObj = tiposPack.find(tp => tp.nome === tipoPack)
      const numeroSerie = `${marcaGen.nome}-${nomeModelo}-${Date.now()}`
      const dataFabricacao = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      const dataInspecao = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      const dataProxima = new Date(dataInspecao.getFullYear() + 1, dataInspecao.getMonth(), dataInspecao.getDate())

      try {
        const jangada = await prisma.jangada.create({
          data: {
            numeroSerie,
            tipo: nomeModelo,
            marcaId: marca.id,
            modeloId: modelo.id,
            lotacaoId: lotacao.id,
            tipoPackId: tipoPackObj?.id,
            tipoPack,
            clienteId: cliente.id,
            capacidade,
            peso: 35,
            numeroAprovacao: numeroSerie.split('-')[0],
            dataFabricacao,
            dataInspecao,
            dataProximaInspecao: dataProxima,
            status: 'ativo',
            estado: 'instalada',
            tecnico: 'Julio Correia',
          },
        })

        // Criar inspeção
        await prisma.inspecao.create({
          data: {
            numero: `INS-${numeroSerie}`,
            tipoInspecao: 'anual',
            dataInspecao,
            dataProxima,
            resultado: 'aprovada',
            status: 'realizada',
            tecnico: 'Julio Correia',
            jangadaId: jangada.id,
            observacoes: `${marca.nome} ${modelo.nome} - ${tipoPack} (Genérica)`,
          },
        })

        // Criar componentes padrão
        const componentesPadrao = [
          { nome: 'Coletes de Salvação', quantidade: capacidade },
          { nome: 'EPIRB', quantidade: 1 },
          { nome: 'Cilindro CO2', quantidade: 2 },
          { nome: 'Sinalizador Luminoso', quantidade: 3 },
          { nome: 'Espelho de Sinais', quantidade: 1 },
          { nome: 'Corneta de Sinais', quantidade: 1 },
          { nome: 'Bussola', quantidade: 1 },
          { nome: 'Kit de Pesca', quantidade: 1 },
          { nome: 'Bomba Manual', quantidade: 1 },
          { nome: 'Remo de Emergência', quantidade: 2 },
        ]

        for (const comp of componentesPadrao) {
          await prisma.inspecaoComponente.create({
            data: {
              jangadaId: jangada.id,
              nome: comp.nome,
              quantidade: comp.quantidade,
              estado: 'OK',
              notas: `Componente do pack ${tipoPack} (Genérico)`,
            },
          })
        }

        const contagemMarca = (marcasProcessadas.get(marca.nome) || 0) + 1
        marcasProcessadas.set(marca.nome, contagemMarca)

        console.log(`✅ ${marca.nome} - ${modelo.nome}`)
        console.log(`   └─ ${tipoPack} com ${capacidade} pessoas`)
        jangadasCriadas++
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️  ${marca.nome} - ${modelo.nome} - Já existe`)
        } else {
          console.log(`❌ ${marca.nome} - Erro: ${error.message}`)
        }
      }
    }
  }

  console.log(`\n✨ Processo concluído!`)
  console.log(`📊 Estatísticas:`)
  console.log(`   Total de jangadas criadas: ${jangadasCriadas}`)
  console.log(`   Por marca:`)
  for (const [marca, quantidade] of marcasProcessadas) {
    console.log(`   - ${marca}: ${quantidade}`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
