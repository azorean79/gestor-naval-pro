import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const navio = await prisma.navio.findUnique({
      where: { id },
      include: {
        cliente: true,
        proprietario: true,
      },
    });

    if (!navio) {
      return NextResponse.json(
        { error: 'Navio não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(navio);

  } catch (error) {
    console.error('Erro ao buscar navio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const navio = await prisma.navio.update({
      where: { id },
      data: {
        nome: data.nome,
        tipo: data.tipo,
        matricula: data.matricula,
        comprimento: data.comprimento,
        largura: data.largura,
        calado: data.calado,
        capacidade: data.capacidade,
        anoConstrucao: data.anoConstrucao,
        status: data.status,
        dataInspecao: data.dataInspecao ? new Date(data.dataInspecao) : null,
        dataProximaInspecao: data.dataProximaInspecao ? new Date(data.dataProximaInspecao) : null,
        clienteId: data.clienteId,
        proprietarioId: data.proprietarioId,
        delegacao: data.delegacao,
      },
      include: {
        cliente: true,
        proprietario: true,
      },
    });

    return NextResponse.json(navio);

  } catch (error) {
    console.error('Erro ao atualizar navio:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar navio' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.navio.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao deletar navio:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar navio' },
      { status: 500 }
    );
  }
}