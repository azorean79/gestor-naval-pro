import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const lotacoes = await prisma.lotacaoJangada.findMany({
      where: { ativo: true },
      orderBy: { capacidade: 'asc' },

    });

    return NextResponse.json({ data: lotacoes });
  } catch (error) {
    console.error('Error fetching lotacoes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lotacoes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const lotacao = await prisma.lotacaoJangada.create({
      data: {
        capacidade: body.capacidade,
        ativo: true,
      },
    });

    return NextResponse.json(lotacao);
  } catch (error) {
    console.error('Error creating lotacao:', error);
    return NextResponse.json(
      { error: 'Failed to create lotacao' },
      { status: 500 }
    );
  }
}