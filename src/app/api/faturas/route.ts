import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const clienteId = searchParams.get('clienteId');
    const sortBy = searchParams.get('sortBy') || 'dataEmissao';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');

    const where: any = {};

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    const total = await prisma.fatura.count({ where });

    const faturas = await prisma.fatura.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        cliente: {
          select: { id: true, nome: true, nif: true, endereco: true },
        },
        navio: {
          select: { id: true, nome: true, matricula: true, bandeira: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
      },
    });

    return NextResponse.json({
      data: faturas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const fatura = await prisma.fatura.create({
      data: {
        numero: body.numero,
        dataEmissao: new Date(body.dataEmissao),
        dataVencimento: new Date(body.dataVencimento),
        valor: body.valor,
        status: body.status || 'pendente',
        descricao: body.descricao,
        clienteId: body.clienteId,
        navioId: body.navioId,
        jangadaId: body.jangadaId,
      },
      include: {
        cliente: {
          select: { id: true, nome: true, nif: true, endereco: true },
        },
        navio: {
          select: { id: true, nome: true, matricula: true, bandeira: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
      },
    });

    // Geração automática da declaração de isenção de IVA
    try {
      const { gerarDeclaracaoIVA } = await import('@/lib/gerarDeclaracaoIVA');
      await gerarDeclaracaoIVA({
        cliente: fatura.cliente?.nome || '',
        nif: fatura.cliente?.nif || '',
        morada: fatura.cliente?.endereco || '',
        navio: fatura.navio?.nome || '',
        matricula: fatura.navio?.matricula || '',
        portoRegisto: fatura.navio?.bandeira || '',
        numeroSerie: fatura.jangada?.numeroSerie || '',
        data: new Date(),
      });
    } catch (err) {
      console.error('Erro ao gerar declaração de IVA:', err);
    }
    return NextResponse.json(fatura, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar fatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
