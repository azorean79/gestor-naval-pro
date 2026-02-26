// src/app/api/navios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/navios - Listar todos os navios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 500;

    // Construir filtros
    const where: {
      status?: string;
      tipo?: string;
      OR?: Array<{
        nome?: { contains: string; mode: string };
        matricula?: { contains: string; mode: string };
        proprietario?: { contains: string; mode: string };
        imo?: { contains: string; mode: string };
        mmsi?: { contains: string; mode: string };
      }>;
    } = {};

    if (status) {
      where.status = status;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { imo: { contains: search, mode: 'insensitive' } },
        { mmsi: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calcular offset para paginação
    const skip = (page - 1) * limit;

    // Buscar navios com filtros e paginação
    const [navios, total] = await Promise.all([
      prisma.navio.findMany({
        where,
        include: {
          certificados: true,
          equipamentos: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.navio.count({ where }),
    ]);

    return NextResponse.json({
      data: navios,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar navios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/navios - Criar novo navio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    const requiredFields = ['nome', 'imo', 'tipo'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        );
      }
    }

    // Verificar se o IMO já existe
    const existingNavio = await prisma.navio.findUnique({
      where: { imo: body.imo }
    });

    if (existingNavio) {
      return NextResponse.json(
        { error: 'Já existe um navio com este IMO' },
        { status: 400 }
      );
    }

    const navio = await prisma.navio.create({
      data: ({
        nome: body.nome,
        imo: body.imo,
        mmsi: body.mmsi,
        matricula: body.matricula,
        bandeira: body.bandeira,
        tipo: body.tipo,
        comprimento: body.comprimento,
        largura: body.largura,
        calado: body.calado,
        capacidade: body.capacidade,
        proprietario: body.proprietario,
        armador: body.armador,
        ultimaInspecao: body.ultimaInspecao ? new Date(body.ultimaInspecao) : null,
        proximaInspecao: body.proximaInspecao ? new Date(body.proximaInspecao) : null,
        status: body.status || 'ativo',
        observacoes: body.observacoes,
      } as any),
      include: {
        certificados: true,
        equipamentos: true,
        ordensServico: true,
      },
    });

    return NextResponse.json(navio, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar navio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}