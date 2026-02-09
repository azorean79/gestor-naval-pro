import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoria = searchParams.get('categoria')
    const marcaId = searchParams.get('marcaId')
    const modeloId = searchParams.get('modeloId')
    const lotacaoId = searchParams.get('lotacaoId')
    const ativo = searchParams.get('ativo')

    const where: any = {}
    if (categoria) where.categoria = categoria
    if (marcaId) where.aplicavelMarcaId = marcaId
    if (modeloId) where.aplicavelModeloId = modeloId
    if (lotacaoId) where.aplicavelLotacaoId = lotacaoId
    if (ativo !== null) where.ativo = ativo === 'true'

    const items = await prisma.checklistInspecao.findMany({
      where,
      include: {
        marca: true,
        modelo: true,
        lotacao: true
      },
      orderBy: {
        ordem: 'asc'
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: items,
      count: items.length
    })
  } catch (error) {
    console.error('[API] Erro ao buscar checklist:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar checklist de inspeção',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
