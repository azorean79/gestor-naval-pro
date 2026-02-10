import { PrismaClient } from '../prisma/app/generated-prisma-client'

const prisma = new PrismaClient();
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
})

async function main() {
  console.log('🔧 Criando inspeções com TODOS os componentes substituídos...\n')

  // Buscar jangadas existentes (pegar várias marcas diferentes)
  const jangadas = await prisma.jangada.findMany({
    take: 8,
    include: {
      marca: true,
      modelo: true,
    },
  })

  if (jangadas.length === 0) {
    console.log('❌ Nenhuma jangada encontrada!')
    return
  }

  console.log(`📊 Encontradas ${jangadas.length} jangadas\n`)

  let inspecoesCriadas = 0

  for (const jangada of jangadas) {
    // Criar data de inspeção (nos últimos 3 meses)
    const dataInspecao = new Date()
    dataInspecao.setMonth(dataInspecao.getMonth() - Math.floor(Math.random() * 3))

    const dataProxima = new Date(dataInspecao)
    dataProxima.setFullYear(dataProxima.getFullYear() + 1)

    try {
      // Componentes que serão TODOS substituídos
      const componentesSubstituidos = [
     
        { nome: 'Cilindro CO2', quantidade: 2, motivoSubstituicao: 'Peso abaixo do recomendado' },
        { nome: 'Sinalizador Luminoso', quantidade: 3, motivoSubstituicao: 'Bateria vencida' },
        { nome: 'Foguetes de Sinalização', quantidade: 6, motivoSubstituicao: 'Validade expirada' },
        { nome: 'Fumígenos Flutuantes', quantidade: 2, motivoSubstituicao: 'Validade expirada' },
        { nome: 'Espelho de Sinais', quantidade: 1, motivoSubstituicao: 'Rachado/danificado' },
        { nome: 'Corneta de Sinais', quantidade: 1, motivoSubstituicao: 'Sem pressão' },
        { nome: 'Kit de Primeiros Socorros', quantidade: 1, motivoSubstituicao: 'Medicamentos vencidos' },
        { nome: 'Kit Enjoo Mar', quantidade: 1, motivoSubstituicao: 'Validade expirada' },
       { nome: 'Lanterna Estanque', quantidade: 1, motivoSubstituicao: 'Não funciona' },
        { nome: 'Kit de Pesca', quantidade: 1, motivoSubstituicao: 'Anzóis enferrujados' },
        { nome: 'Copo Graduado', quantidade: 1, motivoSubstituicao: 'Trincado' },
        { nome: 'Bomba Manual', quantidade: 1, motivoSubstituicao: 'Válvulas desgastadas' },
        { nome: 'Kit de Reparação', quantidade: 1, motivoSubstituicao: 'Cola seca' },
        { nome: 'Esponja de Limpeza', quantidade: 2, motivoSubstituicao: 'Desgastadas' },
        { nome: 'Faca de Segurança', quantidade: 1, motivoSubstituicao: 'Corrosão na lâmina' },
        { nome: 'Abertura de Cobertura', quantidade: 1, motivoSubstituicao: 'Fecho defeituoso' },
        { nome: 'Remo de Emergência', quantidade: 2, motivoSubstituicao: 'Rachadura no material' },
        { nome: 'Âncora Flutuante', quantidade: 1, motivoSubstituicao: 'Cabo desgastado' },
        { nome: 'Cabo de Segurança', quantidade: 1, motivoSubstituicao: 'Fibras rompidas' },
        { nome: 'Válvula de Pressão', quantidade: 2, motivoSubstituicao: 'Vedação comprometida' },
        { nome: 'Manual de Instruções', quantidade: 1, motivoSubstituicao: 'Ilegível por umidade' }
       ,
      ]

      // Criar inspeção
      const inspecao = await prisma.inspecao.create({
        data: {
          numero: `INS-SUB-${Date.now()}-${jangada.id}`,
          tipoInspecao: 'anual',
          dataInspecao,
          dataProxima,
          resultado: 'aprovada',
          status: 'realizada',
          tecnico: 'Julio Correia',
          jangadaId: jangada.id,
          observacoes: `Substituição completa - Todos os ${componentesSubstituidos.length} componentes foram trocados`,
        },
      })

      // Criar registros de substituição para cada componente
      for (const componente of componentesSubstituidos) {
        await prisma.substituicaoComponente.create({
          data: {
            componenteNome: componente.nome,
            quantidade: componente.quantidade || 1,
            motivoSubstituicao: componente.motivoSubstituicao,
            dataSubstituicao: dataInspecao,
            inspecaoId: inspecao.id,
          },
        })
      }

      inspecoesCriadas++
      console.log(`✅ ${jangada.marca?.nome || 'Sem Marca'} ${jangada.modelo?.nome || 'Sem Modelo'} - Inspeção criada com ${componentesSubstituidos.length} componentes substituídos`)

    } catch (error) {
      console.error(`❌ Erro ao criar inspeção para ${jangada.marca?.nome || 'Sem Marca'} ${jangada.modelo?.nome || 'Sem Modelo'}:`, error)
    }
  }

  console.log(`\n🎉 Criadas ${inspecoesCriadas} inspeções com substituições completas!`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
