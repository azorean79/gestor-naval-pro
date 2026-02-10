import { PrismaClient } from '../prisma/app/generated-prisma-client'

const prisma = new PrismaClient();
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
})

async function main() {
  console.log('🛟 Criando jangadas de exemplo para cada marca/modelo...\n')

  // Buscar todas as marcas
  const marcas = await prisma.marcaJangada.findMany({
    include: {
      modelos: true,
    },
  })

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

  // Buscar lotações para usar nos exemplos
  const lotacoes = await prisma.lotacaoJangada.findMany()

  // Buscar tipos de pack
  const tipoPacks = await prisma.tipoPack.findMany()

  let jangadasCriadas = 0

  // Para cada marca e modelo, criar uma jangada de exemplo
  for (const marca of marcas) {
    console.log(`\n📦 Marca: ${marca.nome}`)
    
    for (const modelo of marca.modelos) {
      // Pegar uma lotação aleatória
      const lotacao = lotacoes[Math.floor(Math.random() * lotacoes.length)]
      const tipoPack = tipoPacks[Math.floor(Math.random() * tipoPacks.length)]

      // Gerar número de série único
      const numeroSerie = `ESP-${marca.nome.slice(0, 3).toUpperCase()}-${modelo.nome.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`

      // Datas de inspeção
      const hoje = new Date()
      const dataFabricacao = new Date(hoje.getFullYear() - 2, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      const dataInspecao = new Date(hoje.getFullYear() - 1, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      const dataProxima = new Date(dataInspecao)
      dataProxima.setFullYear(dataProxima.getFullYear() + 1)

      try {
        const jangada = await prisma.jangada.create({
          data: {
            numeroSerie,
            tipo: modelo.nome,
            marcaId: marca.id,
            modeloId: modelo.id,
            lotacaoId: lotacao?.id,
            tipoPackId: tipoPack?.id,
            tipoPack: tipoPack?.nome,
            clienteId: cliente.id,
            capacidade: lotacao?.capacidade || 5,
            peso: Math.floor(Math.random() * 50) + 30, // 30-80 kg
            dimensoes: `${Math.floor(Math.random() * 100) + 100}x${Math.floor(Math.random() * 80) + 60}x${Math.floor(Math.random() * 40) + 30}cm`,
            numeroAprovacao: `A${Math.floor(Math.random() * 9999) + 1000}`,
            dataFabricacao,
            dataInspecao,
            dataProximaInspecao: dataProxima,
            status: 'ativo',
            estado: 'instalada',
            tecnico: 'Julio Correia',
          },
        })

        // Criar inspeção para a jangada
        const inspecao = await prisma.inspecao.create({
          data: {
            numero: `INS-${numeroSerie}-${Date.now().toString().slice(-5)}`,
            tipoInspecao: 'anual',
            dataInspecao,
            dataProxima: dataProxima,
            resultado: 'aprovada',
            status: 'realizada',
            tecnico: 'Julio Correia',
            jangadaId: jangada.id,
            observacoes: `Inspeção de exemplo para ${marca.nome} ${modelo.nome}`,
          },
        })

        // Criar componentes de inspeção (itens padrão de uma jangada)
        const componentesPadrao = [
          
          { nome: 'Cilindro de CO2+n2', tipo: 'cilindro', quantidade: 1 },
          { nome: 'Kit Primeiros Socorros', tipo: 'kit', quantidade: 1 },
          { nome: 'Sinalizadores de Fumo', tipo: 'sinalizador', quantidade: 4 },
          { nome: 'Sinalizadores Luminosos', tipo: 'sinalizador', quantidade: 2 },
          { nome: 'Espelho de Sinalização', tipo: 'sinalizador', quantidade: 1 },
          { nome: 'Apito de Emergência', tipo: 'sinalizador', quantidade: 2 },
          { nome: 'Cabos e Cordas de Amarração', tipo: 'acessorio', quantidade: 3 },
          { nome: 'Remos de Emergência', tipo: 'remo', quantidade: 2 },
          { nome: 'Âncora de Flutuação', tipo: 'acessorio', quantidade: 1 },
          { nome: 'Manta Térmica', tipo: 'sobrevivencia', quantidade: 2 },
          { nome: 'Sacolas de Enjôo', tipo: 'consumivel', quantidade: 10 },
          { nome: 'Água Potável de Emergência', tipo: 'consumivel', quantidade: 1 },
          { nome: 'Rações de Emergência', tipo: 'consumivel', quantidade: 2 },
          { nome: 'Lanterna à Prova de Água', tipo: 'acessorio', quantidade: 1 },
          { nome: 'Faca de Sobrevivência', tipo: 'ferramenta', quantidade: 1 },
          { nome: 'Reparo de Patcha', tipo: 'reparacao', quantidade: 2 },
          { nome: 'Documentação (Certificados/Manuais)', tipo: 'documentacao', quantidade: 1 },
        ]

        for (const componente of componentesPadrao) {
          const dataValidade = new Date(dataProxima)
          dataValidade.setMonth(dataValidade.getMonth() + 6)

          await prisma.inspecaoComponente.create({
            data: {
              jangadaId: jangada.id,
              nome: componente.nome,
              quantidade: componente.quantidade,
              tipo: componente.tipo,
              estado: 'OK',
              validade: dataValidade,
              notas: `Componente padrão - ${componente.tipo}`,
            },
          })
        }

        console.log(`  ✅ ${modelo.nome} - Série: ${numeroSerie}`)
        console.log(`     └─ Inspeção criada com ${componentesPadrao.length} componentes`)
        jangadasCriadas++
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`  ⚠️  ${modelo.nome} - Já existe (série duplicada)`)
        } else {
          console.log(`  ❌ ${modelo.nome} - Erro: ${error.message}`)
        }
      }
    }
  }

  console.log(`\n✨ Processo concluído!`)
  console.log(`📊 Jangadas criadas: ${jangadasCriadas}`)
  console.log(`📍 Cliente vinculado: ${cliente.nome}`)
  console.log(`\n🔍 Próximos passos:`)
  console.log(`   1. Abra o dashboard`)
  console.log(`   2. Vá para Jangadas`)
  console.log(`   3. Veja os exemplos de cada marca/modelo`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
