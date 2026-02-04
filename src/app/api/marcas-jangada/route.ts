import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const marcas = await prisma.marcaJangada.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(marcas);
  } catch (error) {
    console.error('Error fetching marcas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marcas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Ensure table exists
    await prisma.$queryRaw`CREATE TABLE IF NOT EXISTS "marcas_jangada" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "nome" TEXT UNIQUE,
      "ativo" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`;

    const marca = await prisma.marcaJangada.create({
      data: {
        nome: body.nome,
        ativo: true,
      },
    });

    return NextResponse.json(marca);
  } catch (error) {
    console.error('Error creating marca:', error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Já existe uma marca com este nome' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create marca' },
      { status: 500 }
    );
  }
}