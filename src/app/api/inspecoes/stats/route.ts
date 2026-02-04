import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Retorna estatísticas de inspeção
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const navioId = searchParams.get('navioId')
    const jangadaId = searchParams.get('jangadaId')
    const cilindroId = searchParams.get('cilindroId')

    const where: any = {}
    if (navioId) where.navioId = navioId
    if (jangadaId) where.jangadaId = jangadaId
    if (cilindroId) where.cilindroId = cilindroId

    const [
      totalInspecoes,
      aprovadas,
      reprovadas,
      withCondicoes,
      custoTotal,
      proximasInspecoes,
    ] = await Promise.all([
      prisma.inspecao.count({ where }),
      prisma.inspecao.count({
        where: { ...where, resultado: 'aprovada' },
      }),
      prisma.inspecao.count({
        where: { ...where, resultado: 'reprovada' },
      }),
      prisma.inspecao.count({
        where: { ...where, resultado: 'aprovada_com_condicoes' },
      }),
      prisma.custoInspecao.aggregate({
        where: { inspecao: where },
        _sum: { valor: true },
      }),
      prisma.inspecao.findMany({
        where: { ...where, dataProxima: { gte: new Date() } },
        orderBy: { dataProxima: 'asc' },
        take: 5,
      }),
    ])

    const taxaAprovacao = totalInspecoes > 0 ? (aprovadas / totalInspecoes) * 100 : 0

    return NextResponse.json({
      stats: {
        totalInspecoes,
        aprovadas,
        reprovadas,
        withCondicoes,
        taxaAprovacao: taxaAprovacao.toFixed(2),
        custoTotal: custoTotal._sum.valor || 0,
      },
      proximasInspecoes,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
