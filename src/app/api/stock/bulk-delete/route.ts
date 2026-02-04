import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs inválidos' },
        { status: 400 }
      );
    }

    await prisma.stock.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao deletar itens do stock:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar itens do stock' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}