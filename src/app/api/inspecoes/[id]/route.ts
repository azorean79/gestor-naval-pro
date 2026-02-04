import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const inspecao = await prisma.inspecao.findUnique({
      where: { id },
      include: {
        navio: true,
        jangada: true,
        cilindro: true,
        custos: {
          orderBy: { createdAt: 'desc' },
        },
        historicos: {
          orderBy: { dataRealizada: 'desc' },
        },
      },
    })

    if (!inspecao) {
      return NextResponse.json(
        { error: 'Inspeção não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(inspecao)
  } catch (error) {
    console.error('Erro ao buscar inspeção:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar inspeção' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const inspecao = await prisma.inspecao.update({
      where: { id },
      data: body,
      include: {
        navio: true,
        jangada: true,
        cilindro: true,
        custos: true,
        historicos: true,
      },
    })

    return NextResponse.json(inspecao)
  } catch (error) {
    console.error('Erro ao atualizar inspeção:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar inspeção' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.inspecao.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar inspeção:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar inspeção' },
      { status: 500 }
    )
  }
}
