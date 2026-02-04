import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fatura = await prisma.fatura.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nome: true, nif: true },
        },
        navio: {
          select: { id: true, nome: true, matricula: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
      },
    });

    if (!fatura) {
      return NextResponse.json(
        { error: 'Fatura não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(fatura);

  } catch (error) {
    console.error('Erro ao buscar fatura:', error);
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

    const fatura = await prisma.fatura.update({
      where: { id },
      data: {
        numero: body.numero,
        dataEmissao: new Date(body.dataEmissao),
        dataVencimento: new Date(body.dataVencimento),
        valor: body.valor,
        status: body.status,
        descricao: body.descricao,
        clienteId: body.clienteId,
        navioId: body.navioId,
        jangadaId: body.jangadaId,
      },
      include: {
        cliente: {
          select: { id: true, nome: true, nif: true },
        },
        navio: {
          select: { id: true, nome: true, matricula: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
      },
    });

    return NextResponse.json(fatura);

  } catch (error) {
    console.error('Erro ao atualizar fatura:', error);
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
    await prisma.fatura.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao excluir fatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}