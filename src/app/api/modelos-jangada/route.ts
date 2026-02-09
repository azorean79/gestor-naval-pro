import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { withErrorMonitoring } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const marcaId = searchParams.get('marcaId');
    const status = searchParams.get('status') || 'ativo';
    const sortBy = searchParams.get('sortBy') || 'nome';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      ativo: status === 'ativo' ? true : status === 'inativo' ? false : undefined,
    };

    if (search) {
      where.nome = { contains: search, mode: 'insensitive' };
    }

    if (marcaId) {
      where.marcaId = marcaId;
    }

    const modelos = await prisma.modeloJangada.findMany({
      where,
      include: {
        marca: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.modeloJangada.count({ where });

    return NextResponse.json({
      data: modelos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching modelos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modelos' },
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
      const marcaId = body.marcaId?.trim();

      if (!nome) {
        return NextResponse.json(
          { error: 'Nome do modelo é obrigatório' },
          { status: 400 }
        );
      }

      if (!marcaId) {
        return NextResponse.json(
          { error: 'Marca é obrigatória' },
          { status: 400 }
        );
      }

      // Verificar se a marca existe
      const marca = await prisma.marcaJangada.findUnique({
        where: { id: marcaId },
      });

      if (!marca) {
        return NextResponse.json(
          { error: 'Marca não encontrada' },
          { status: 400 }
        );
      }

      // Verificar se já existe
      const modeloExistente = await prisma.modeloJangada.findUnique({
        where: {
          nome_marcaId: {
            nome: nome,
            marcaId: marcaId,
          },
        },
      });

      if (modeloExistente) {
        return NextResponse.json(
          { error: 'Já existe um modelo com este nome para esta marca' },
          { status: 400 }
        );
      }

      const modelo = await prisma.modeloJangada.create({
        data: {
          nome,
          marcaId,
          sistemaInsuflacao: body.sistemaInsuflacao,
          valvulasPadrao: body.valvulasPadrao,
          ativo: body.status !== 'inativo',
        },
        include: {
          marca: true,
        },
      });

      return NextResponse.json(modelo, { status: 201 });
    } catch (error) {
      console.error('Error creating modelo:', error);
      return NextResponse.json(
        { error: 'Failed to create modelo' },
        { status: 500 }
      );
    }
  }, request);
}