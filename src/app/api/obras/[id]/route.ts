import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const obra = await prisma.obra.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nome: true, nif: true },
        },
      },
    });

    if (!obra) {
      return NextResponse.json(
        { error: 'Obra não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(obra);

  } catch (error) {
    console.error('Erro ao buscar obra:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const obra = await prisma.obra.update({
      where: { id },
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        status: body.status,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : null,
        dataFim: body.dataFim ? new Date(body.dataFim) : null,
        orcamento: body.orcamento,
        clienteId: body.clienteId,
        responsavel: body.responsavel,
      },
      include: {
        cliente: {
          select: { id: true, nome: true, nif: true },
        },
      },
    });

    return NextResponse.json(obra);

  } catch (error) {
    console.error('Erro ao atualizar obra:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
    await prisma.obra.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao excluir obra:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}