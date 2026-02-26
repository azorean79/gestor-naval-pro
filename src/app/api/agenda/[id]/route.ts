// src/app/api/agenda/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/agenda/[id] - Buscar agendamento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { id } = await params;

    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
    });

    if (!agendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/agenda/[id] - Atualizar agendamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { id } = await params;
    const body = await request.json();

    // Verificar se o agendamento existe
    const existingAgendamento = await prisma.agendamento.findUnique({
      where: { id }
    });

    if (!existingAgendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    const agendamento = await prisma.agendamento.update({
      where: { id },
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        tipo: body.tipo,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : undefined,
        dataFim: body.dataFim ? new Date(body.dataFim) : undefined,
        local: body.local,
        responsavel: body.responsavel,
        participantes: body.participantes,
        status: body.status,
        prioridade: body.prioridade,
        entidadeRelacionada: body.entidadeRelacionada,
        observacoes: body.observacoes,
      },
    });

    return NextResponse.json(agendamento);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/agenda/[id] - Deletar agendamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { id } = await params;

    // Verificar se o agendamento existe
    const agendamento = await prisma.agendamento.findUnique({
      where: { id }
    });

    if (!agendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    await prisma.agendamento.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Agendamento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}