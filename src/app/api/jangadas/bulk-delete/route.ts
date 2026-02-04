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

    const result = await prisma.jangada.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      deletedIds: ids,
      deletedCount: result.count,
    });

  } catch (error) {
    console.error('Erro ao deletar jangadas:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar jangadas' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}