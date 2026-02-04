import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: any = {};
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nif: { contains: search, mode: 'insensitive' } },
      ];
    }

    const proprietarios = await prisma.proprietario.findMany({
      where,
      orderBy: { nome: 'asc' },
      cacheStrategy: { ttl: 300 }
    });

    return NextResponse.json({ 
      data: proprietarios,
      total: proprietarios.length 
    });
  } catch (error) {
    console.error('Error fetching proprietarios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proprietarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const proprietario = await prisma.proprietario.create({
      data: {
        nome: body.nome,
        email: body.email,
        telefone: body.telefone,
        endereco: body.endereco,
        nif: body.nif,
      },
    });

    return NextResponse.json(proprietario);
  } catch (error) {
    console.error('Error creating proprietario:', error);
    return NextResponse.json(
      { error: 'Failed to create proprietario' },
      { status: 500 }
    );
  }
}
