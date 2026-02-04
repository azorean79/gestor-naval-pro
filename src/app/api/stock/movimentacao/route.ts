import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { stockId, tipo, quantidade, motivo, responsavel } = await request.json();

    if (!stockId || !tipo || !quantidade) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    if (!['entrada', 'saida'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo deve ser entrada ou saida' },
        { status: 400 }
      );
    }

    if (quantidade <= 0) {
      return NextResponse.json(
        { error: 'Quantidade deve ser positiva' },
        { status: 400 }
      );
    }

    // Buscar item atual do stock
    const stockItem = await prisma.stock.findUnique({
      where: { id: stockId },
    });

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Item do stock não encontrado' },
        { status: 404 }
      );
    }

    // Calcular nova quantidade
    let novaQuantidade = stockItem.quantidade;
    if (tipo === 'entrada') {
      novaQuantidade += quantidade;
    } else if (tipo === 'saida') {
      novaQuantidade -= quantidade;
      if (novaQuantidade < 0) {
        return NextResponse.json(
          { error: 'Quantidade insuficiente em stock' },
          { status: 400 }
        );
      }
    }

    // Usar transação para atualizar stock e criar movimentação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar quantidade do item
      const updatedStock = await tx.stock.update({
        where: { id: stockId },
        data: { quantidade: novaQuantidade },
      });

      // Criar registro de movimentação
      const movimentacao = await tx.movimentacaoStock.create({
        data: {
          stockId,
          tipo,
          quantidade,
          motivo: motivo || 'Movimentação manual',
          responsavel: responsavel || 'Sistema',
        },
      });

      return { updatedStock, movimentacao };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro ao criar movimentação de stock:', error);
    return NextResponse.json(
      { error: 'Erro ao criar movimentação de stock' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}