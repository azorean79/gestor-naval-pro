import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const marcaId = searchParams.get('marcaId')
    const modeloId = searchParams.get('modeloId')
    const lotacaoId = searchParams.get('lotacaoId')

    const where: any = {}
    if (marcaId) where.marcaId = marcaId
    if (modeloId) where.modeloId = modeloId
    if (lotacaoId) where.lotacaoId = lotacaoId

    const especificacoes = await prisma.especificacaoTecnica.findMany({
      where,
      include: {
        marca: true,
        modelo: true,
        lotacao: true
      },
      orderBy: [
        { marca: { nome: 'asc' } },
        { modelo: { nome: 'asc' } },
        { lotacao: { capacidade: 'asc' } }
      ]
    })

    // Parse JSON fields
    const parsed = especificacoes.map((spec: any) => ({
      ...spec,
      referenciaCilindro: spec.referenciaCilindro 
        ? JSON.parse(spec.referenciaCilindro) 
        : null
    }))

    return NextResponse.json({ 
      success: true, 
      data: parsed,
      count: parsed.length
    })
  } catch (error) {
    console.error('[API] Erro ao buscar especificações:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar especificações técnicas',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
