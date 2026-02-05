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

    // Validar input
    const nome = body.nome?.trim();
    if (!nome) {
      return NextResponse.json(
        { error: 'Nome do tipo de pack é obrigatório' },
        { status: 400 }
      );
    }

    // Ensure table exists
    await prisma.$queryRaw`CREATE TABLE IF NOT EXISTS "tipos_pack" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "nome" TEXT UNIQUE,
      "descricao" TEXT,
      "ativo" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`;

    // Verificar se já existe
    const tipoPackExistente = await prisma.tipoPack.findUnique({
      where: { nome: nome },
    });

    if (tipoPackExistente) {
      return NextResponse.json(
        { error: 'Já existe um tipo de pack com este nome' },
        { status: 400 }
      );
    }

    const tipoPack = await prisma.tipoPack.create({
      data: {
        nome: nome,
        ativo: true,
      },
    });

    return NextResponse.json(tipoPack);
  } catch (error) {
    console.error('Error creating tipo pack:', error);
    
    // Handle Prisma errors
    const err = error as any;
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe um tipo de pack com este nome' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Falha ao criar tipo de pack' },
      { status: 500 }
    );
  }
}