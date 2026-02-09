import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');
    const prioridade = searchParams.get('prioridade');
    const responsavel = searchParams.get('responsavel');
    const sortBy = searchParams.get('sortBy') || 'dataInicio';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: Prisma.AgendamentoWhereInput = {};

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (prioridade) {
      where.prioridade = prioridade;
    }

    if (responsavel) {
      where.responsavel = responsavel;
    }

    const total = await prisma.agendamento.count({ where });

    const agendamentos = await prisma.agendamento.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        navio: {
          select: { id: true, nome: true, matricula: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        cilindro: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        pessoa: {
          select: { id: true, nome: true, cargo: true },
        },
      },
    });

    return NextResponse.json({
      data: agendamentos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Creating agendamento with data:', body);

    const agendamento = await prisma.agendamento.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        dataInicio: new Date(body.dataInicio),
        dataFim: new Date(body.dataFim),
        tipo: body.tipo,
        status: body.status || 'agendado',
        prioridade: body.prioridade || 'normal',
        navioId: body.navioId || null,
        jangadaId: body.jangadaId || null,
        cilindroId: body.cilindroId || null,
        pessoaId: body.pessoaId || null,
        responsavel: body.responsavel || null,
      },
      include: {
        navio: {
          select: { id: true, nome: true, matricula: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        cilindro: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        pessoa: {
          select: { id: true, nome: true, cargo: true },
        },
      },
    });

    console.log('Agendamento created successfully:', agendamento.id);
    return NextResponse.json(agendamento, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
