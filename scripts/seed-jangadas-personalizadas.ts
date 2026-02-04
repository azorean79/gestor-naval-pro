import { PrismaClient } from '../prisma/app/generated-prisma-client'
import { EXEMPLOS_JANGADAS } from '../src/lib/exemplos-jangadas'

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
})

async function main() {
  console.log('🛟 Criando jangadas de exemplo com dados fornecidos...\n')

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

  console.log(`📦 Marcas e Modelos com dados enviados:`)
  console.log(`   ${new Set(EXEMPLOS_JANGADAS.map(e => e.marca)).size} marcas`)
  console.log(`   ${EXEMPLOS_JANGADAS.length} exemplos de jangadas\n`)

  let jangadasCriadas = 0
  const marcasProcessadas = new Set<string>()

  // Criar jangada para cada exemplo dos EXEMPLOS_JANGADAS
  for (const exemplo of EXEMPLOS_JANGADAS) {
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
      const componentesDoExemplo = Object.entries(exemplo.componentesSelecionados || {})

      for (const [nomeComponente, dados] of componentesDoExemplo) {
        if (dados.incluido) {
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

      if (!marcasProcessadas.has(marca.nome)) {
        console.log(`✅ ${marca.nome}`)
        marcasProcessadas.add(marca.nome)
      }

      console.log(`   └─ ${modelo.nome} (${exemplo.numeroSerie}) - ${exemplo.tipoPack}`)
      jangadasCriadas++
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(
          `   ⚠️  ${modelo.nome} (${exemplo.numeroSerie}) - Já existe`
        )
      } else {
        console.log(`   ❌ ${modelo.nome} - Erro: ${error.message}`)
      }
    }
  }

  console.log(`\n✨ Processo concluído!`)
  console.log(`📊 Jangadas criadas: ${jangadasCriadas}`)
  console.log(`📍 Cliente vinculado: ${cliente.nome}`)
  console.log(`🔖 Tipos de Pack usados: ${new Set(EXEMPLOS_JANGADAS.map(e => e.tipoPack)).size}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
