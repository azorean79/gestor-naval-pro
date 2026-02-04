import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stockItem = await prisma.stock.findUnique({
      where: { id },
      include: {
        movimentacoes: {
          orderBy: {
            data: 'desc',
          },
        },
      },
    });

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Item do stock não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(stockItem);

  } catch (error) {
    console.error('Erro ao buscar item do stock:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const stockItem = await prisma.stock.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        categoria: data.categoria,
        quantidade: data.quantidade,
        quantidadeMinima: data.quantidadeMinima,
        precoUnitario: data.precoUnitario,
        fornecedor: data.fornecedor,
        localizacao: data.localizacao,
        refOrey: data.refOrey,
        refFabricante: data.refFabricante,
        lote: data.lote,
        dataValidade: data.dataValidade,
        imagem: data.imagem,
        status: data.status,
      },
      include: {
        movimentacoes: {
          orderBy: {
            data: 'desc',
          },
          take: 5,
        },
      },
    });

    return NextResponse.json(stockItem);

  } catch (error) {
    console.error('Erro ao atualizar item do stock:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar item do stock' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.stock.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao deletar item do stock:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar item do stock' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}