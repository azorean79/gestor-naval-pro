import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { withErrorMonitoring } from '@/lib/monitoring';

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
  return withErrorMonitoring(async (req) => {
    // Rate limiting: máximo 5 criações por minuto por IP
    const rateLimitResponse = rateLimit(req, 5, 60000);
    if (rateLimitResponse) return rateLimitResponse;

    try {
    const body = await request.json();

    // Validar input
    const nome = body.nome?.trim();
    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da marca é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe
    const marcaExistente = await prisma.marcaJangada.findUnique({
      where: { nome: nome },
    });

    if (marcaExistente) {
      return NextResponse.json(
        { error: 'Já existe uma marca com este nome' },
        { status: 400 }
      );
    }

    const marca = await prisma.marcaJangada.create({
      data: {
        nome: nome,
        ativo: true,
      },
    });

    return NextResponse.json(marca);
  } catch (error) {
    console.error('Error creating marca:', error);
    
    // Handle Prisma errors
    const err = error as any;
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe uma marca com este nome' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Falha ao criar marca' },
      { status: 500 }
    );
  }
}, request);
}