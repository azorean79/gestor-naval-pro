import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marcaId = searchParams.get('marcaId');

    const where: any = { ativo: true };
    if (marcaId) {
      where.marcaId = marcaId;
    }

    const modelos = await prisma.modeloJangada.findMany({
      where,
      include: {
        marca: true,
      },
      orderBy: { nome: 'asc' },
      cacheStrategy: { ttl: 300 }
    });

    return NextResponse.json({ data: modelos });
  } catch (error) {
    console.error('Error fetching modelos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modelos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Ensure table exists
    await prisma.$queryRaw`CREATE TABLE IF NOT EXISTS "modelos_jangada" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "nome" TEXT,
      "marcaId" TEXT,
      "ativo" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`;

    const modelo = await prisma.modeloJangada.create({
      data: {
        nome: body.nome,
        marcaId: body.marcaId,
        ativo: true,
      },
      include: {
        marca: true,
      },
    });

    return NextResponse.json(modelo);
  } catch (error) {
    console.error('Error creating modelo:', error);
    return NextResponse.json(
      { error: 'Failed to create modelo' },
      { status: 500 }
    );
  }
}