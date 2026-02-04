import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};

    if (search) {
      where.OR = [
        { numeroSerie: { contains: search, mode: 'insensitive' } },
        { tipo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    const total = await prisma.cilindro.count({ where });

    const cilindros = await prisma.cilindro.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
          sistema: {
            select: {
              id: true,
              nome: true,
            },
          },
        agendamentos: {
          orderBy: { dataInicio: 'desc' },
          take: 5,
        },
        notificacoes: {
          where: { lida: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      data: cilindros,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Erro ao buscar cilindros:', error);
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
      CREATE TABLE IF NOT EXISTS "cilindros" (
        "id" TEXT PRIMARY KEY,
        "numeroSerie" TEXT NOT NULL UNIQUE,
        "tipo" TEXT NOT NULL,
        "sistemaId" TEXT,
        "tipoCilindroId" TEXT,
        "tipoValvulaId" TEXT,
        "capacidade" REAL,
        "dataFabricacao" TIMESTAMP,
        "dataTeste" TIMESTAMP,
        "dataProximoTeste" TIMESTAMP,
        "status" TEXT DEFAULT 'ativo',
        "pressaoTrabalho" REAL,
        "pressaoTeste" REAL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const cilindro = await prisma.cilindro.create({
      data: {
        numeroSerie: body.numeroSerie,
        tipo: body.tipo,
        sistemaId: body.sistemaId || null,
        tipoCilindroId: body.tipoCilindroId || null,
        tipoValvulaId: body.tipoValvulaId || null,
        capacidade: body.capacidade,
        dataFabricacao: body.dataFabricacao ? new Date(body.dataFabricacao) : null,
        dataTeste: body.dataTeste ? new Date(body.dataTeste) : null,
        dataProximoTeste: body.dataProximoTeste ? new Date(body.dataProximoTeste) : null,
        status: body.status || 'ativo',
        pressaoTrabalho: body.pressaoTrabalho,
        pressaoTeste: body.pressaoTeste,
      },
    });

    return NextResponse.json(cilindro, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar cilindro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
