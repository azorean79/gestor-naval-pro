import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const clienteId = searchParams.get('clienteId');
    const responsavel = searchParams.get('responsavel');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');

    const where: any = {};

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (responsavel) {
      where.responsavel = responsavel;
    }

    const total = await prisma.obra.count({ where });

    const obras = await prisma.obra.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        cliente: {
          select: { id: true, nome: true, nif: true },
        },
        navio: {
          select: { id: true, nome: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true },
          include: {
            marca: { select: { nome: true } },
            modelo: { select: { nome: true } },
          },
        },
      },
    });

    return NextResponse.json({
      data: obras,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Erro ao buscar obras:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const obra = await prisma.obra.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        status: body.status || 'planeada',
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : null,
        dataFim: body.dataFim ? new Date(body.dataFim) : null,
        orcamento: body.orcamento,
        clienteId: body.clienteId,
        responsavel: body.responsavel,
        navioId: body.navioId,
        jangadaId: body.jangadaId,
      },
      include: {
        cliente: {
          select: { id: true, nome: true, nif: true, endereco: true },
        },
        navio: {
          include: {
            cliente: true,
          },
        },
        jangada: {
          include: {
            marca: true,
            modelo: true,
          },
        },
      },
    });

    // Geração automática da declaração de isenção de IVA
    try {
      const { gerarDeclaracaoIVA } = await import('@/lib/gerarDeclaracaoIVA');
      await gerarDeclaracaoIVA({
        cliente: obra.cliente?.nome || '',
        nif: obra.cliente?.nif || '',
        morada: obra.cliente?.endereco || '',
        navio: obra.navio?.nome || '',
        matricula: obra.navio?.matricula || '',
        portoRegisto: obra.navio?.bandeira || '',
        numeroSerie: '',
        data: new Date(),
      });
    } catch (err) {
      console.error('Erro ao gerar declaração de IVA:', err);
    }
    return NextResponse.json(obra, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar obra:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
