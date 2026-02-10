import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const numeroSerie = searchParams.get('numeroSerie');
    const excludeId = searchParams.get('excludeId');

    if (!numeroSerie) {
      return NextResponse.json(
        { error: 'Número de série é obrigatório' },
        { status: 400 }
      );
    }

    const where: any = {
      numeroSerie: numeroSerie
    };

    // Se estiver editando, excluir o próprio registro
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const jangadaExistente = await prisma.jangada.findFirst({
      where: where
    });

    return NextResponse.json({
      disponivel: !jangadaExistente,
      numeroSerie: numeroSerie
    });

  } catch (error) {
    console.error('Erro ao verificar número de série:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar número de série' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}