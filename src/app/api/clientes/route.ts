import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tecnico = searchParams.get('tecnico');

    const where: any = {};

    if (tecnico) {
      where.tecnico = tecnico;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefone: { contains: search } },
        { nif: { contains: search } },
      ];
    }

    const total = await prisma.cliente.count({ 
      where,
      cacheStrategy: { ttl: 300 } // Cache por 5 minutos
    });

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      cacheStrategy: { ttl: 300 } // Cache por 5 minutos
    });

    return NextResponse.json({
      data: clientes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Ensure table exists
    await prisma.$queryRaw`CREATE TABLE IF NOT EXISTS "clientes" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "nome" TEXT,
      "email" TEXT UNIQUE,
      "telefone" TEXT,
      "endereco" TEXT,
      "nif" TEXT UNIQUE,
      "delegacao" TEXT DEFAULT 'Açores',
      "tecnico" TEXT DEFAULT 'Julio Correia',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`;

    const cliente = await prisma.cliente.create({
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        endereco: data.endereco,
        nif: data.nif,
        delegacao: data.delegacao || 'Açores',
        tecnico: data.tecnico,
      },
    });

    return NextResponse.json(cliente);

  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}