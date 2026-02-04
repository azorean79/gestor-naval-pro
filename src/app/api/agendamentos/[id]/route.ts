import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        navio: {
          select: { id: true, nome: true, matricula: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        cilindro: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        pessoa: {
          select: { id: true, nome: true, cargo: true },
        },
      },
    })

    if (!agendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(agendamento)
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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

    const agendamento = await prisma.agendamento.update({
      where: { id },
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : undefined,
        dataFim: body.dataFim ? new Date(body.dataFim) : undefined,
        tipo: body.tipo,
        status: body.status,
        prioridade: body.prioridade,
        navioId: body.navioId || null,
        jangadaId: body.jangadaId || null,
        cilindroId: body.cilindroId || null,
        pessoaId: body.pessoaId || null,
        responsavel: body.responsavel,
      },
      include: {
        navio: {
          select: { id: true, nome: true, matricula: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        cilindro: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        pessoa: {
          select: { id: true, nome: true, cargo: true },
        },
      },
    })

    return NextResponse.json(agendamento)
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento' },
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

    await prisma.agendamento.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao eliminar agendamento:', error)
    return NextResponse.json(
      { error: 'Erro ao eliminar agendamento' },
      { status: 500 }
    )
  }
}
