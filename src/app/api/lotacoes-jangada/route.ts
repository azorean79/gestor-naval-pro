import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const lotacoes = await prisma.lotacaoJangada.findMany({
      where: { ativo: true },
      orderBy: { capacidade: 'asc' },
      cacheStrategy: { ttl: 300 }
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

    // Ensure table exists
    await prisma.$queryRaw`CREATE TABLE IF NOT EXISTS "lotacoes_jangada" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "capacidade" INTEGER,
      "ativo" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`;

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