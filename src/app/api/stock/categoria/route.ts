import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoria é obrigatória' },
        { status: 400 }
      )
    }

    const itens = await prisma.stock.findMany({
      where: {
        categoria: categoria,
        status: 'ativo',
        quantidade: {
          gt: 0
        }
      },
      orderBy: { nome: 'asc' }
    })

    return NextResponse.json({
      data: itens,
      success: true
    })
  } catch (error) {
    console.error('Erro ao buscar itens do stock por categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}