import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cronograma = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        navio: true,
        jangada: true,
        cilindro: true,
      },
    })

    if (!cronograma) {
      return NextResponse.json(
        { error: 'Cronograma não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(cronograma)
  } catch (error) {
    console.error('Erro ao buscar cronograma:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cronograma' },
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

    const cronograma = await prisma.agendamento.update({
      where: { id },
      data: body,
      include: {
        navio: true,
        jangada: true,
        cilindro: true,
      },
    })

    return NextResponse.json(cronograma)
  } catch (error) {
    console.error('Erro ao atualizar cronograma:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cronograma' },
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
    await prisma.agendamento.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar cronograma:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar cronograma' },
      { status: 500 }
    )
  }
}
