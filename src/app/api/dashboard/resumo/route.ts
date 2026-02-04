import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getDateRange() {
  const now = new Date()

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  return { now, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth }
}

export async function GET() {
  try {
    const { now, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getDateRange()
    const dataLimite = new Date(now)
    dataLimite.setDate(now.getDate() + 30)

    const [
      totalJangadas,
      totalNavios,
      totalClientes,
      totalCilindros,
      jangadasAtivas,
      jangadasManutencao,
      naviosAtivos,
      naviosManutencao,
      cilindrosAtivos,
      cilindrosDefeituosos,
      inspecoesVencidas,
      cronogramasVencidos,
      totalInspecoes,
      aprovadas,
      reprovadas,
      comCondicoes,
      custosInspecoes,
      agendamentosHoje,
      agendamentosSemana,
      agendamentosMes,
    ] = await Promise.all([
      prisma.jangada.count(),
      prisma.navio.count(),
      prisma.cliente.count(),
      prisma.cilindro.count(),
      prisma.jangada.count({ where: { status: 'ativo' } }),
      prisma.jangada.count({ where: { status: 'manutencao' } }),
      prisma.navio.count({ where: { status: 'ativo' } }),
      prisma.navio.count({ where: { status: 'manutencao' } }),
      prisma.cilindro.count({ where: { status: 'ativo' } }),
      prisma.cilindro.count({ where: { status: 'defeituoso' } }),
      prisma.inspecao.count({
        where: {
          dataProxima: { lt: now },
          status: { not: 'cancelada' },
        },
      }),
      prisma.agendamento.count({
        where: {
          dataInicio: { lt: now },
          status: 'agendado',
        },
      }),
      prisma.inspecao.count(),
      prisma.inspecao.count({ where: { resultado: 'aprovada' } }),
      prisma.inspecao.count({ where: { resultado: 'reprovada' } }),
      prisma.inspecao.count({ where: { resultado: 'aprovada_com_condicoes' } }),
      prisma.custoInspecao.aggregate({ _sum: { valor: true } }),
      prisma.agendamento.count({
        where: { dataInicio: { gte: startOfToday, lte: endOfToday } },
      }),
      prisma.agendamento.count({
        where: { dataInicio: { gte: startOfWeek, lt: endOfWeek } },
      }),
      prisma.agendamento.count({
        where: { dataInicio: { gte: startOfMonth, lte: endOfMonth } },
      }),
    ])

    const jangadasExpirando = await prisma.jangada.count({
      where: {
        dataProximaInspecao: { lte: dataLimite },
      },
    })

    const naviosExpirando = await prisma.navio.count({
      where: {
        dataProximaInspecao: { lte: dataLimite },
      },
    })

    const cilindrosExpirando = await prisma.cilindro.count({
      where: {
        dataProximoTeste: { lte: dataLimite },
      },
    })

    const stockItens = await prisma.stock.findMany({ where: { status: 'ativo' } })
    const stockBaixo = stockItens.filter(
      (item: any) => item.quantidadeMinima > 0 && item.quantidade <= item.quantidadeMinima
    ).length
    const stockEsgotado = stockItens.filter((item: any) => item.quantidade === 0).length
    const stockValorTotal = stockItens.reduce(
      (sum: number, item: any) => sum + (item.precoUnitario || 0) * item.quantidade,
      0
    )

    const taxaAprovacao = totalInspecoes > 0 ? (aprovadas / totalInspecoes) * 100 : 0

    return NextResponse.json({
      dashboardStats: {
        jangadas: {
          total: totalJangadas,
          ativas: jangadasAtivas,
          manutencao: jangadasManutencao,
          expirando: jangadasExpirando,
        },
        navios: {
          total: totalNavios,
          ativas: naviosAtivos,
          manutencao: naviosManutencao,
          expirando: naviosExpirando,
        },
        clientes: {
          total: totalClientes,
          ativos: totalClientes,
          novosMes: 0,
        },
        stock: {
          valorTotal: stockValorTotal,
          itensBaixo: stockBaixo,
          itensEsgotados: stockEsgotado,
        },
        cilindros: {
          total: totalCilindros,
          expirando: cilindrosExpirando,
          defeituosos: cilindrosDefeituosos,
        },
        agenda: {
          hoje: agendamentosHoje,
          semana: agendamentosSemana,
          mes: agendamentosMes,
        },
      },
      kpis: {
        totalJangadas,
        cilindrosBomEstado: cilindrosAtivos,
        alertasStock: stockBaixo + stockEsgotado,
        inspecoesVencidas,
        cronogramasVencidos,
      },
      resumoExecutivo: {
        totalInspecoes,
        aprovadas,
        reprovadas,
        comCondicoes,
        taxaAprovacao: Number(taxaAprovacao.toFixed(2)),
        custoTotalInspecoes: custosInspecoes._sum.valor || 0,
      },
      atualizadoEm: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao buscar resumo do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resumo do dashboard' },
      { status: 500 }
    )
  }
}
