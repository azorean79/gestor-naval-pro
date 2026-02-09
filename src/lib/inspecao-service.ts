import { prisma } from './prisma'
import { addDays, addMonths, addYears, isBefore } from 'date-fns'

export interface InspecaoData {
  tipoInspecao: string
  resultado?: string
  observacoes?: string
  tecnico: string
  navioId?: string | null
  jangadaId?: string | null
  cilindroId?: string | null
  dataProxima?: Date | null
}

export interface CustoData {
  tipo: string
  descricao: string
  valor: number
  quantidade?: number
  responsavel: string
}

export interface CronogramaData {
  titulo: string
  descricao?: string
  tipoManutencao: string
  frequencia: string
  proximaManutencao: Date
  prioridade?: string
  navioId?: string | null
  jangadaId?: string | null
  cilindroId?: string | null
  custoEstimado?: number | null
  responsavel?: string
}

/**
 * Cria uma nova inspeção
 */
export async function criarInspecao(data: InspecaoData) {
  // Gerar número único
  const ultimaInspecao = await prisma.inspecao.findFirst({
    orderBy: { numero: 'desc' },
    select: { numero: true },
  })

  const proximoNumero = ultimaInspecao
    ? (parseInt(ultimaInspecao.numero.split('-')[1]) + 1).toString().padStart(6, '0')
    : '000001'
  const numero = `INS-${proximoNumero}`

  // Observação automática de boletins aplicados
  let observacaoBoletins = '';
  if (data.jangadaId) {
    // Boletins aplicados foram removidos do schema
    // const jangada = await prisma.jangada.findUnique({
    //   where: { id: data.jangadaId },
    //   include: { marca: true, modelo: true },
    // });
    // const boletinsMarca = jangada?.marca?.boletinsAplicados || [];
    // const boletinsModelo = jangada?.modelo?.boletinsAplicados || [];
    // const boletins = [...boletinsMarca, ...boletinsModelo];
    // if (boletins.length > 0) {
    //   observacaoBoletins = `Boletins de serviço aplicados: ${boletins.join(', ')}. Verificar aplicação e registrar durante a inspeção.`;
    // }
  }

  const observacoesFinal = [data.observacoes, observacaoBoletins].filter(Boolean).join('\n');

  return prisma.inspecao.create({
    data: {
      numero,
      tipoInspecao: data.tipoInspecao,
      resultado: data.resultado || 'aprovada',
      observacoes: observacoesFinal,
      tecnico: data.tecnico,
      navioId: data.navioId,
      jangadaId: data.jangadaId,
      cilindroId: data.cilindroId,
      dataInspecao: new Date(),
      dataProxima: data.dataProxima,
      status: 'realizada',
    },
    include: {
      navio: true,
      jangada: true,
      cilindro: true,
      custos: true,
      historicos: true,
    },
  })
}

/**
 * Adiciona um custo a uma inspeção
 */
export async function adicionarCustoInspecao(
  inspecaoId: string,
  data: CustoData
) {
  return prisma.custoInspecao.create({
    data: {
      inspecaoId,
      ...data,
    },
  })
}

/**
 * Calcula custos totais de uma inspeção
 */
export async function calcularCustosInspecao(inspecaoId: string) {
  const custos = await prisma.custoInspecao.findMany({
    where: { inspecaoId },
  })

  const total = custos.reduce((sum, c) => sum + c.valor * (c.quantidade || 1), 0)
  const media = custos.length > 0 ? total / custos.length : 0

  return {
    total,
    media,
    count: custos.length,
    custos,
  }
}

/**
 * Cria um registro no histórico de inspeção
 */
export async function adicionarHistoricoInspecao(
  inspecaoId: string,
  data: {
    resultado: string
    observacoes?: string
    custo?: number
    tecnico: string
    dataPreviaProxima?: Date | null
  }
) {
  return prisma.historicoInspecao.create({
    data: {
      inspecaoId,
      ...data,
      dataRealizada: new Date(),
    },
  })
}

/**
 * Obtém histórico completo de inspeção
 */
export async function obterHistoricoInspecao(inspecaoId: string) {
  return prisma.historicoInspecao.findMany({
    where: { inspecaoId },
    orderBy: { dataRealizada: 'desc' },
  })
}

/**
 * Cria um cronograma de manutenção
 */
export async function criarCronogramaManutencao(data: CronogramaData) {
  return prisma.agendamento.create({
    data: {
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: data.tipoManutencao,
      dataInicio: data.proximaManutencao,
      dataFim: data.proximaManutencao, // same day
      prioridade: data.prioridade || 'normal',
      navioId: data.navioId,
      jangadaId: data.jangadaId,
      cilindroId: data.cilindroId,
      responsavel: data.responsavel,
      status: 'agendado',
    },
    include: {
      navio: true,
      jangada: true,
      cilindro: true,
    },
  })
}

/**
 * Gera próxima data de manutenção baseado na frequência
 */
export function calcularProximaManutencao(
  dataUltima: Date,
  frequencia: string
): Date {
  switch (frequencia.toLowerCase()) {
    case 'mensal':
      return addMonths(dataUltima, 1)
    case 'trimestral':
      return addMonths(dataUltima, 3)
    case 'semestral':
      return addMonths(dataUltima, 6)
    case 'anual':
      return addYears(dataUltima, 1)
    default:
      return addMonths(dataUltima, 1)
  }
}

/**
 * Marca manutenção como realizada e cria próxima
 */
export async function marcarManutencaoRealizada(
  cronogramaId: string,
  frequencia: string
) {
  const hoje = new Date()
  const proximaData = calcularProximaManutencao(hoje, frequencia)

  return prisma.agendamento.update({
    where: { id: cronogramaId },
    data: {
      status: 'realizado',
    },
    include: {
      navio: true,
      jangada: true,
      cilindro: true,
    },
  })
}

/**
 * Obtém inspeções vencidas (dataProxima < hoje)
 */
export async function obterInspecoesVencidas() {
  const hoje = new Date()
  return prisma.inspecao.findMany({
    where: {
      dataProxima: {
        lt: hoje,
      },
      status: { not: 'cancelada' },
    },
    orderBy: { dataProxima: 'asc' },
    include: {
      navio: true,
      jangada: true,
      cilindro: true,
    },
  })
}

/**
 * Obtém inspeções próximas (7 dias)
 */
export async function obterInspecoesProximas(diasAntecipacao = 7) {
  const hoje = new Date()
  const limite = addDays(hoje, diasAntecipacao)

  return prisma.inspecao.findMany({
    where: {
      dataProxima: {
        gte: hoje,
        lte: limite,
      },
      status: { not: 'cancelada' },
    },
    orderBy: { dataProxima: 'asc' },
    include: {
      navio: true,
      jangada: true,
      cilindro: true,
    },
  })
}

/**
 * Obtém manutencões vencidas
 */
export async function obterManutencaoesVencidas() {
  const hoje = new Date()
  return prisma.agendamento.findMany({
    where: {
      dataInicio: {
        lt: hoje,
      },
      status: 'agendado',
    },
    orderBy: { dataInicio: 'asc' },
    include: {
      navio: true,
      jangada: true,
      cilindro: true,
    },
  })
}

/**
 * Obtém estatísticas de inspeção
 */
export async function obterEstatisticasInspecao(
  navioId?: string,
  jangadaId?: string,
  cilindroId?: string
) {
  const where: any = {}
  if (navioId) where.navioId = navioId
  if (jangadaId) where.jangadaId = jangadaId
  if (cilindroId) where.cilindroId = cilindroId

  const [
    total,
    aprovadas,
    reprovadas,
    comCondicoes,
    proximasVencidas,
    custoTotal,
  ] = await Promise.all([
    prisma.inspecao.count({ where }),
    prisma.inspecao.count({ where: { ...where, resultado: 'aprovada' } }),
    prisma.inspecao.count({ where: { ...where, resultado: 'reprovada' } }),
    prisma.inspecao.count({ where: { ...where, resultado: 'aprovada_com_condicoes' } }),
    prisma.inspecao.count({
      where: { ...where, dataProxima: { lt: new Date() } },
    }),
    prisma.custoInspecao.aggregate({
      where: { inspecao: where },
      _sum: { valor: true },
    }),
  ])

  const taxaAprovacao = total > 0 ? ((aprovadas / total) * 100).toFixed(2) : '0'

  return {
    total,
    aprovadas,
    reprovadas,
    comCondicoes,
    proximasVencidas,
    custoTotal: custoTotal._sum.valor || 0,
    taxaAprovacao: parseFloat(taxaAprovacao),
  }
}

/**
 * Obtém tendências de inspeção para gráficos
 */
export async function obterTendenciasInspecao(
  meses = 12,
  navioId?: string,
  jangadaId?: string
) {
  const hoje = new Date()
  const dataInicio = addMonths(hoje, -meses)

  const inspecoes = await prisma.inspecao.findMany({
    where: {
      dataInspecao: { gte: dataInicio },
      ...(navioId ? { navioId } : {}),
      ...(jangadaId ? { jangadaId } : {}),
    },
    include: { custos: true },
    orderBy: { dataInspecao: 'asc' },
  })

  // Agrupar por mês
  const porMes: Record<string, any> = {}

  inspecoes.forEach((insp: any) => {
    const chave = insp.dataInspecao.toISOString().slice(0, 7) // YYYY-MM
    if (!porMes[chave]) {
      porMes[chave] = {
        mes: chave,
        total: 0,
        aprovadas: 0,
        reprovadas: 0,
        comCondicoes: 0,
        custo: 0,
      }
    }

    const resultado = (insp.resultado || 'aprovada').toLowerCase()
    const chaveResultado =
      resultado === 'aprovada'
        ? 'aprovadas'
        : resultado === 'reprovada'
          ? 'reprovadas'
          : 'comCondicoes'

    porMes[chave].total++
    porMes[chave][chaveResultado]++
    porMes[chave].custo += insp.custos.reduce(
      (sum: number, c: any) => sum + c.valor * (c.quantidade || 1),
      0
    )
  })

  return Object.values(porMes)
}
