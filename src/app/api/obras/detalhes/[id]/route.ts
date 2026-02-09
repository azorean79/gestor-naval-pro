import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const obra = await prisma.obra.findUnique({
      where: { id },
      include: {
        cliente: true,
        inspecoes: {
          include: {
            navio: true,
            jangada: true
          }
        }
      }
    })

    if (!obra) {
      return NextResponse.json(
        { error: 'Obra não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: obra,
      stats: {
        totalInspecoes: obra.inspecoes.length,
        inspecoesAprovadas: obra.inspecoes.filter(i => i.resultado === 'aprovada').length,
        inspecoesReprovadas: obra.inspecoes.filter(i => i.resultado === 'reprovada').length,
        inspecoesPendentes: obra.inspecoes.filter(i => i.resultado === 'pendente').length,
        diasAtivos: obra.dataFim 
          ? Math.floor((new Date(obra.dataFim).getTime() - new Date(obra.dataInicio || new Date()).getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((new Date().getTime() - new Date(obra.dataInicio || new Date()).getTime()) / (1000 * 60 * 60 * 24))
      }
    })
  } catch (error) {
    console.error('Erro ao buscar obra:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar obra' },
      { status: 500 }
    )
  }
}
