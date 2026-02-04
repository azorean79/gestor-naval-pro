import { NextRequest, NextResponse } from 'next/server'
import { obterTendenciasInspecao } from '@/lib/inspecao-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const meses = parseInt(searchParams.get('meses') || '12')
    const navioId = searchParams.get('navioId') || undefined
    const jangadaId = searchParams.get('jangadaId') || undefined

    const tendencias = await obterTendenciasInspecao(meses, navioId, jangadaId)

    return NextResponse.json({ data: tendencias, meses })
  } catch (error) {
    console.error('Erro ao buscar tendências de inspeção:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tendências de inspeção' },
      { status: 500 }
    )
  }
}
