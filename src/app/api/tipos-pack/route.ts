import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tiposPack = await prisma.tipoPack.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    });

    return NextResponse.json({
      data: tiposPack,
    });
  } catch (error) {
    console.error('Error fetching tipos pack:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tipos pack' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Ensure table exists
    await prisma.$queryRaw`CREATE TABLE IF NOT EXISTS "tipos_pack" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "nome" TEXT UNIQUE,
      "descricao" TEXT,
      "ativo" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`;

    const tipoPack = await prisma.tipoPack.create({
      data: {
        nome: body.nome,
        ativo: true,
      },
    });

    return NextResponse.json(tipoPack);
  } catch (error) {
    console.error('Error creating tipo pack:', error);
    return NextResponse.json(
      { error: 'Failed to create tipo pack' },
      { status: 500 }
    );
  }
}