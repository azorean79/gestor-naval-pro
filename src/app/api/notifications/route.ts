import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  obterResumoAlertas,
  executarTodasAsVerificacoes
} from '@/lib/notification-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const action = searchParams.get('action');
    const search = searchParams.get('search');
    const tipo = searchParams.get('tipo');
    const lida = searchParams.get('lida');
    const clienteId = searchParams.get('clienteId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');

    // Ação: obter resumo de alertas
    if (action === 'resumo') {
      const resumo = await obterResumoAlertas();
      return NextResponse.json(resumo);
    }

    // Ação: gerar alertas agora
    if (action === 'gerar') {
      const resultado = await executarTodasAsVerificacoes();
      return NextResponse.json(resultado);
    }

    const where: any = {};

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { mensagem: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (lida !== null) {
      where.lida = lida === 'true';
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    const total = await prisma.notificacao.count({ where });

    const notificacoes = await prisma.notificacao.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        cliente: {
          select: { id: true, nome: true },
        },
        navio: {
          select: { id: true, nome: true, matricula: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        cilindro: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
      },
    });

    return NextResponse.json({
      data: notificacoes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Criar tabela se não existir
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS "notificacoes" (
        "id" TEXT PRIMARY KEY,
        "titulo" TEXT NOT NULL,
        "mensagem" TEXT NOT NULL,
        "tipo" TEXT DEFAULT 'info',
        "lida" BOOLEAN DEFAULT false,
        "clienteId" TEXT,
        "navioId" TEXT,
        "jangadaId" TEXT,
        "cilindroId" TEXT,
        "dataEnvio" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const notificacao = await prisma.notificacao.create({
      data: {
        titulo: body.titulo,
        mensagem: body.mensagem,
        tipo: body.tipo || 'info',
        lida: body.lida || false,
        clienteId: body.clienteId,
        navioId: body.navioId,
        jangadaId: body.jangadaId,
        cilindroId: body.cilindroId,
        dataEnvio: body.dataEnvio ? new Date(body.dataEnvio) : new Date(),
      },
      include: {
        cliente: {
          select: { id: true, nome: true },
        },
        navio: {
          select: { id: true, nome: true, matricula: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        cilindro: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
      },
    });

    return NextResponse.json(notificacao, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
