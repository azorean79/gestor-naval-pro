import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const inspecao = await prisma.inspecao.findUnique({
      where: { id },
      include: {
        navio: {
          include: {
            cliente: true
          }
        },
        jangada: {
          include: {
            marca: true,
            modelo: true,
            navio: true
          }
        },
        cilindro: true,
        custos: true,
        historicos: true,
        substituicoesComponente: true
      }
    })

    if (!inspecao) {
      return NextResponse.json(
        { error: 'Inspeção não encontrada' },
        { status: 404 }
      )
    }

    const custoTotal = inspecao.custos?.reduce((acc: any, c) => acc + (c.valor || 0), 0) || 0

    return NextResponse.json({
      data: inspecao,
      stats: {
        tempoDesdeInspecao: Math.ceil((new Date().getTime() - new Date(inspecao.dataInspecao).getTime()) / (1000 * 60 * 60 * 24)),
        diasParaProxima: inspecao.dataProxima
          ? Math.ceil((new Date(inspecao.dataProxima).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null,
        custoTotal: custoTotal,
        totalComponentesSubstituidos: inspecao.substituicoesComponente?.length || 0,
        totalHistoricos: inspecao.historicos?.length || 0
      }
    })
  } catch (error) {
    console.error('Erro ao buscar inspeção:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar inspeção' },
      { status: 500 }
    )
  }
}
