import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const historico = await prisma.historicoInspecao.findMany({
      where: { inspecaoId: id },
      orderBy: { dataRealizada: 'desc' },
    })

    return NextResponse.json(historico)
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      resultado,
      observacoes,
      custo,
      tecnico,
      dataPreviaProxima,
    } = body

    const registro = await prisma.historicoInspecao.create({
      data: {
        inspecaoId: id,
        dataRealizada: new Date(),
        resultado,
        observacoes,
        custo: custo || null,
        tecnico,
        dataPreviaProxima: dataPreviaProxima ? new Date(dataPreviaProxima) : null,
      },
    })

    return NextResponse.json(registro, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar histórico:', error)
    return NextResponse.json(
      { error: 'Erro ao criar histórico' },
      { status: 500 }
    )
  }
}
