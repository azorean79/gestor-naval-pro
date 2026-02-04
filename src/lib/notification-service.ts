import { prisma } from './prisma'
import { subDays, differenceInDays } from 'date-fns'

export interface AlertConfig {
  diasAvisoCilindroTesteHidraulico: number // dias de antecedência
  diasAvisoStockBaixo: number
  diasAvisoInspecaoProxima: number
}

const DEFAULT_CONFIG: AlertConfig = {
  diasAvisoCilindroTesteHidraulico: 30,
  diasAvisoStockBaixo: 0,
  diasAvisoInspecaoProxima: 7
}

/**
 * Verifica cilindros com teste hidráulico próximo de expirar
 */
export async function verificarCilindrosTesteHidraulico(config = DEFAULT_CONFIG) {
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() + config.diasAvisoCilindroTesteHidraulico)

  const cilindros = await prisma.cilindro.findMany({
    where: {
      status: 'ativo',
      dataProximoTeste: {
        lte: dataLimite,
        gt: new Date() // não expirou ainda
      }
    }
  })

  const notificacoes = []

  for (const cilindro of cilindros) {
    const diasRestantes = differenceInDays(cilindro.dataProximoTeste!, new Date())
    
    // Verifica se já existe notificação recente para este cilindro
    const notificacaoExistente = await prisma.notificacao.findFirst({
      where: {
        cilindroId: cilindro.id,
        tipo: 'warning',
        createdAt: {
          gte: subDays(new Date(), 1) // criada há menos de 1 dia
        }
      }
    })

    if (!notificacaoExistente) {
      const notificacao = await prisma.notificacao.create({
        data: {
          titulo: `⚠️ Teste Hidráulico Expirando`,
          mensagem: `Cilindro ${cilindro.numeroSerie} vence em ${diasRestantes} dias (${cilindro.dataProximoTeste?.toLocaleDateString('pt-PT')})`,
          tipo: 'warning',
          cilindroId: cilindro.id
        }
      })
      notificacoes.push(notificacao)
    }
  }

  // Marca cilindros expirados como defeituosos
  await prisma.cilindro.updateMany({
    where: {
      status: 'ativo',
      dataProximoTeste: {
        lt: new Date()
      }
    },
    data: {
      status: 'expirado'
    }
  })

  return notificacoes
}

/**
 * Verifica itens de stock com quantidade abaixo do mínimo
 */
export async function verificarStockBaixo(config = DEFAULT_CONFIG) {
  const itensComBaixa = await prisma.stock.findMany({
    where: {
      status: 'ativo',
      quantidade: {
        lte: prisma.stock.fields.quantidadeMinima as any
      },
      quantidadeMinima: {
        gt: 0
      }
    }
  })

  const notificacoes = []

  for (const item of itensComBaixa) {
    // Verifica se já existe notificação recente
    const notificacaoExistente = await prisma.notificacao.findFirst({
      where: {
        titulo: {
          contains: item.nome
        },
        tipo: 'warning',
        createdAt: {
          gte: subDays(new Date(), 7) // criada há menos de 7 dias
        }
      }
    })

    if (!notificacaoExistente) {
      const notificacao = await prisma.notificacao.create({
        data: {
          titulo: `📦 Stock Baixo`,
          mensagem: `${item.nome} tem ${item.quantidade} unidades (mínimo: ${item.quantidadeMinima}). Categoria: ${item.categoria}`,
          tipo: 'warning'
        }
      })
      notificacoes.push(notificacao)
    }
  }

  return notificacoes
}

/**
 * Verifica inspeções programadas próximas
 */
export async function verificarInspecoesProximas(config = DEFAULT_CONFIG) {
  const hoje = new Date()
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() + config.diasAvisoInspecaoProxima)

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      tipo: 'inspecao',
      status: {
        in: ['agendado', 'confirmado']
      },
      dataInicio: {
        lte: dataLimite,
        gte: hoje
      }
    },
    include: {
      navio: true,
      jangada: true,
      cilindro: true
    }
  })

  const notificacoes = []

  for (const agendamento of agendamentos) {
    // Verifica se já existe notificação
    const notificacaoExistente = await prisma.notificacao.findFirst({
      where: {
        titulo: {
          contains: 'Inspeção Agendada'
        },
        createdAt: {
          gte: subDays(new Date(), 1)
        }
      }
    })

    if (!notificacaoExistente) {
      const diasRestantes = differenceInDays(agendamento.dataInicio, hoje)
      const recurso = agendamento.navio?.nome || agendamento.jangada?.numeroSerie || agendamento.cilindro?.numeroSerie || 'N/A'
      
      const notificacao = await prisma.notificacao.create({
        data: {
          titulo: `📅 Inspeção Agendada`,
          mensagem: `${recurso} tem inspeção em ${diasRestantes} dias (${agendamento.dataInicio.toLocaleDateString('pt-PT')}). ${agendamento.descricao || ''}`,
          tipo: 'info',
          navioId: agendamento.navioId,
          jangadaId: agendamento.jangadaId,
          cilindroId: agendamento.cilindroId,
          clienteId: agendamento.navio?.clienteId
        }
      })
      notificacoes.push(notificacao)
    }
  }

  return notificacoes
}

/**
 * Verifica inspeções vencidas (dataProxima < hoje)
 */
export async function verificarInspecoesVencidas() {
  const hoje = new Date()

  const inspecoes = await prisma.inspecao.findMany({
    where: {
      dataProxima: { lt: hoje },
      status: { not: 'cancelada' },
    },
    include: {
      navio: true,
      jangada: true,
      cilindro: true,
    },
    orderBy: { dataProxima: 'asc' },
  })

  const notificacoes = []

  for (const inspecao of inspecoes as any[]) {
    const notificacaoExistente = await prisma.notificacao.findFirst({
      where: {
        titulo: {
          contains: 'Inspeção Vencida'
        },
        dataEnvio: {
          gte: subDays(new Date(), 1)
        },
        navioId: inspecao.navioId || undefined,
        jangadaId: inspecao.jangadaId || undefined,
        cilindroId: inspecao.cilindroId || undefined,
      }
    })

    if (!notificacaoExistente) {
      const recurso = inspecao.navio?.nome || inspecao.jangada?.numeroSerie || inspecao.cilindro?.numeroSerie || 'Equipamento'
      const notificacao = await prisma.notificacao.create({
        data: {
          titulo: `⛔ Inspeção Vencida`,
          mensagem: `${recurso} está com inspeção vencida desde ${inspecao.dataProxima?.toLocaleDateString('pt-PT')}.`,
          tipo: 'warning',
          navioId: inspecao.navioId,
          jangadaId: inspecao.jangadaId,
          cilindroId: inspecao.cilindroId,
        }
      })
      notificacoes.push(notificacao)
    }
  }

  return notificacoes
}

/**
 * Executa todas as verificações de alertas
 */
export async function executarTodasAsVerificacoes(config = DEFAULT_CONFIG) {
  try {
    const alertasCilindros = await verificarCilindrosTesteHidraulico(config)
    const alertasStock = await verificarStockBaixo(config)
    const alertasInspecoes = await verificarInspecoesProximas(config)
    const alertasInspecoesVencidas = await verificarInspecoesVencidas()

    return {
      totalGeradas: alertasCilindros.length + alertasStock.length + alertasInspecoes.length + alertasInspecoesVencidas.length,
      cilindros: alertasCilindros.length,
      stock: alertasStock.length,
      inspecoes: alertasInspecoes.length,
      inspecoesVencidas: alertasInspecoesVencidas.length,
      timestamp: new Date()
    }
  } catch (error) {
    console.error('Erro ao executar verificações de alertas:', error)
    throw error
  }
}

/**
 * Obtém resumo de alertas para o dashboard
 */
export async function obterResumoAlertas() {
  const hoje = new Date()
  const umDiaAtras = subDays(hoje, 1)

  const [
    totalNaoLidas,
    alertasWarning,
    alertasInfo,
    notificacoesRecentes
  ] = await Promise.all([
    prisma.notificacao.count({
      where: { lida: false }
    }),
    prisma.notificacao.count({
      where: {
        tipo: 'warning',
        lida: false,
        dataEnvio: { gte: umDiaAtras }
      }
    }),
    prisma.notificacao.count({
      where: {
        tipo: 'info',
        lida: false,
        dataEnvio: { gte: umDiaAtras }
      }
    }),
    prisma.notificacao.findMany({
      where: {
        lida: false
      },
      orderBy: {
        dataEnvio: 'desc'
      },
      take: 5,
      select: {
        id: true,
        titulo: true,
        tipo: true,
        dataEnvio: true
      }
    })
  ])

  return {
    totalNaoLidas,
    alertasWarning,
    alertasInfo,
    notificacoesRecentes
  }
}

/**
 * Marca notificação como lida
 */
export async function marcarComoLida(notificacaoId: string) {
  return prisma.notificacao.update({
    where: { id: notificacaoId },
    data: { lida: true }
  })
}

/**
 * Remove notificação
 */
export async function removerNotificacao(notificacaoId: string) {
  return prisma.notificacao.delete({
    where: { id: notificacaoId }
  })
}

/**
 * Obtém notificações com filtros
 */
export async function obterNotificacoes(options: {
  tipo?: string
  lida?: boolean
  limit?: number
  skip?: number
  clienteId?: string
} = {}) {
  const {
    tipo,
    lida,
    limit = 20,
    skip = 0,
    clienteId
  } = options

  return prisma.notificacao.findMany({
    where: {
      ...(tipo && { tipo }),
      ...(lida !== undefined && { lida }),
      ...(clienteId && { clienteId })
    },
    orderBy: {
      dataEnvio: 'desc'
    },
    take: limit,
    skip,
    include: {
      navio: {
        select: { nome: true }
      },
      jangada: {
        select: { numeroSerie: true }
      },
      cilindro: {
        select: { numeroSerie: true }
      }
    }
  })
}
