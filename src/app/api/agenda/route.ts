// src/app/api/agenda/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/agenda - Listar todos os agendamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Construir filtros
    const where: {
      status?: string;
      tipo?: string;
      dataInicio?: { gte?: Date; lte?: Date };
      OR?: Array<{
        titulo?: { contains: string; mode: string };
        responsavel?: { contains: string; mode: string };
        entidadeRelacionada?: { contains: string; mode: string };
      }>;
    } = {};

    if (status) {
      where.status = status;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (dataInicio || dataFim) {
      where.dataInicio = {};
      if (dataInicio) {
        where.dataInicio.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataInicio.lte = new Date(dataFim);
      }
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { responsavel: { contains: search, mode: 'insensitive' } },
        { entidadeRelacionada: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calcular offset para paginação (somente se limit definido)
    const skip = limit ? (page - 1) * limit : undefined;

    // Buscar agendamentos com filtros e paginação
    const [agendamentos, total] = await Promise.all([
      prisma.agendamento.findMany({
        where,
        orderBy: { dataInicio: 'asc' },
        ...(skip !== undefined ? { skip } : {}),
        ...(limit !== undefined ? { take: limit } : {}),
      }),
      prisma.agendamento.count({ where }),
    ]);

    return NextResponse.json({
      data: agendamentos,
      total,
      page: limit ? page : 1,
      limit: limit ?? total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/agenda - Criar novo agendamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    const requiredFields = ['titulo', 'tipo', 'dataInicio', 'dataFim', 'responsavel', 'status', 'prioridade'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório: ${field}` },
          { status: 400 }
        );
      }
    }

    // Criar agendamento
    const agendamento = await prisma.agendamento.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        tipo: body.tipo,
        dataInicio: new Date(body.dataInicio),
        dataFim: new Date(body.dataFim),
        local: body.local,
        responsavel: body.responsavel,
        participantes: body.participantes,
        status: body.status,
        prioridade: body.prioridade,
        entidadeRelacionada: body.entidadeRelacionada,
        observacoes: body.observacoes,
      },
    });

    return NextResponse.json(agendamento, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}