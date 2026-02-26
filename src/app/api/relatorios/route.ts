// src/app/api/relatorios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/relatorios - Listar todos os relatórios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const status = searchParams.get('status');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Construir filtros
    const where: {
      tipo?: string;
      status?: string;
      dataCriacao?: { gte?: Date; lte?: Date };
      OR?: Array<{
        titulo?: { contains: string; mode: string };
        descricao?: { contains: string; mode: string };
      }>;
    } = {};

    if (tipo) {
      where.tipo = tipo;
    }

    if (status) {
      where.status = status;
    }

    if (dataInicio || dataFim) {
      where.dataCriacao = {};
      if (dataInicio) {
        where.dataCriacao.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataCriacao.lte = new Date(dataFim);
      }
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calcular offset para paginação (somente se limit definido)
    const skip = limit ? (page - 1) * limit : undefined;

    // Buscar relatórios com filtros e paginação
    const [relatorios, total] = await Promise.all([
      prisma.relatorio.findMany({
        where,
        include: {
          ordemServico: {
            include: {
              cliente: true,
              navio: true,
            },
          },
        },
        orderBy: { dataGeracao: 'desc' },
        ...(skip !== undefined ? { skip } : {}),
        ...(limit !== undefined ? { take: limit } : {}),
      }),
      prisma.relatorio.count({ where }),
    ]);

    return NextResponse.json({
      data: relatorios,
      total,
      page: limit ? page : 1,
      limit: limit ?? total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    });
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/relatorios - Criar novo relatório
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    const requiredFields = ['titulo', 'tipo'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        );
      }
    }

    const relatorio = await prisma.relatorio.create({
      data: ({
        titulo: body.titulo,
        tipo: body.tipo,
        periodo: body.periodo,
        dados: body.dados,
        geradoPor: body.geradoPor,
        formato: body.formato,
        arquivo: body.arquivo,
        ordemServicoId: body.ordemServicoId,
      } as any),
      include: {
        ordemServico: {
          include: {
            cliente: true,
            navio: true,
          },
        },
      },
    });

    return NextResponse.json(relatorio, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}