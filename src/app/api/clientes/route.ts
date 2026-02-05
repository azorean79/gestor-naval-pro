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
      where
    });

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit
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

    const cliente = await prisma.cliente.create({
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        endereco: data.endereco,
        nif: data.nif,
        delegacao: data.delegacao || 'Açores',
        tecnico: data.tecnico || 'Julio Correia',
      },
    });

    return NextResponse.json(cliente);

  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Já existe um cliente com este email ou NIF' },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}