import { config } from 'dotenv'
config()

import { PrismaClient } from '../prisma/app/generated-prisma-client'
import { withAccelerate } from '@prisma/extension-accelerate'

// Check if we're using Prisma Accelerate URL or direct connection
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || '';
const isDatabaseUrlAccelerate = databaseUrl.startsWith('prisma+postgres://');

const prismaConfig: any = {
  log: ['error', 'warn'],
  omit: {
    navio: {
      createdAt: true,
      updatedAt: true,
    },
    jangada: {
      createdAt: true,
      updatedAt: true,
    },
    cliente: {
      createdAt: true,
      updatedAt: true,
    },
    inspecao: {
      createdAt: true,
      updatedAt: true,
    },
    cilindro: {
      createdAt: true,
      updatedAt: true,
    },
    stock: {
      createdAt: true,
      updatedAt: true,
    },
    fatura: {
      createdAt: true,
      updatedAt: true,
    },
    agendamento: {
      createdAt: true,
      updatedAt: true,
    },
    obra: {
      createdAt: true,
      updatedAt: true,
    },
    proprietario: {
      createdAt: true,
      updatedAt: true,
    },
    marcaJangada: {
      createdAt: true,
      updatedAt: true,
    },
    modeloJangada: {
      createdAt: true,
      updatedAt: true,
    },
    lotacaoJangada: {
      createdAt: true,
      updatedAt: true,
    },
    sistemaCilindro: {
      createdAt: true,
      updatedAt: true,
    },
    tipoValvula: {
      createdAt: true,
      updatedAt: true,
    },
    custoInspecao: {
      createdAt: true,
      updatedAt: true,
    },
    notificacao: {
      createdAt: true,
      updatedAt: true,
    },
  },
};

// Add accelerateUrl only if using Prisma Accelerate
if (isDatabaseUrlAccelerate) {
  prismaConfig.accelerateUrl = databaseUrl;
}

const prisma = new PrismaClient(prismaConfig).$extends(withAccelerate())

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
        { nome: 'Bussola', quantidade: 1, motivoSubstituicao: 'Bolha no líquido' },
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
        { nome: 'Manual de Instruções', quantidade: 1, motivoSubstituicao: 'Ilegível por umidade' },
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
            quantidade: componente.quantidade ?? 1,
            motivoSubstituicao: componente.motivoSubstituicao,
            dataSubstituicao: dataInspecao,
            inspecaoId: inspecao.id,
          },
        })
      }

      // Criar componentes com status SUBSTITUIDO
      for (const comp of componentesSubstituidos) {
        // Calcular validade (1-3 anos no futuro para componentes novos)
        const validadeMeses = 12 + Math.floor(Math.random() * 24) // 12-36 meses
        const dataValidade = new Date(dataInspecao)
        dataValidade.setMonth(dataValidade.getMonth() + validadeMeses)

        await prisma.inspecaoComponente.create({
          data: {
            jangadaId: jangada.id,
            nome: comp.nome,
            quantidade: comp.quantidade ?? 1,
            estado: 'SUBSTITUIDO',
            validade: dataValidade,
            notas: `✅ SUBSTITUÍDO - ${comp.motivoSubstituicao}. Novo componente instalado em ${dataInspecao.toLocaleDateString('pt-PT')}`,
          },
        })
      }

      console.log(`✅ ${jangada.marca?.nome} ${jangada.modelo?.nome}`)
      console.log(`   └─ Inspeção criada com ${componentesSubstituidos.length} componentes SUBSTITUÍDOS`)
      console.log(`   └─ Data: ${dataInspecao.toLocaleDateString('pt-PT')}`)
      console.log(`   └─ Próxima: ${dataProxima.toLocaleDateString('pt-PT')}\n`)
      
      inspecoesCriadas++
    } catch (error: any) {
      console.log(`❌ Erro ao criar inspeção para ${jangada.numeroSerie}: ${error.message}\n`)
    }
  }

  console.log(`✨ Processo concluído!`)
  console.log(`📊 Total de inspeções criadas: ${inspecoesCriadas}`)
  console.log(`📦 Total de componentes substituídos: ${inspecoesCriadas * 24}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
