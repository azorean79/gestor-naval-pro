import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const especificacao = await prisma.especificacaoTecnica.findUnique({
      where: { id },
      include: {
        marca: true,
        modelo: true,
        lotacao: true
      }
    })

    if (!especificacao) {
      return NextResponse.json(
        { success: false, error: 'Especificação não encontrada' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const parsed = {
      ...especificacao,
      referenciaCilindro: especificacao.referenciaCilindro 
        ? JSON.parse(especificacao.referenciaCilindro) 
        : null
    }

    return NextResponse.json({ 
      success: true, 
      data: parsed
    })
  } catch (error) {
    console.error('[API] Erro ao buscar especificação:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar especificação técnica',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
