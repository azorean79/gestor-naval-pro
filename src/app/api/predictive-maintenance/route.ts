import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const tipoEquipamento = searchParams.get('tipoEquipamento');
    const status = searchParams.get('status');
    const severidade = searchParams.get('severidade');
    const sortBy = searchParams.get('sortBy') || 'dataPrevista';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');

    const where: any = {};

    if (search) {
      where.OR = [
        { tipoManutencao: { contains: search, mode: 'insensitive' } },
        { recomendacao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tipoEquipamento) {
      where.tipoEquipamento = tipoEquipamento;
    }

    if (status) {
      where.status = status;
    }

    if (severidade) {
      where.severidade = severidade;
    }

    const total = await prisma.predictiveMaintenance.count({ where });

    const predictiveMaintenances = await prisma.predictiveMaintenance.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: predictiveMaintenances,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Erro ao buscar manutenções preditivas:', error);
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
      CREATE TABLE IF NOT EXISTS "predictive_maintenance" (
        "id" TEXT PRIMARY KEY,
        "equipamentoId" TEXT NOT NULL,
        "tipoEquipamento" TEXT NOT NULL,
        "tipoManutencao" TEXT NOT NULL,
        "probabilidade" REAL NOT NULL,
        "severidade" TEXT NOT NULL,
        "dataPrevista" TIMESTAMP NOT NULL,
        "recomendacao" TEXT NOT NULL,
        "status" TEXT DEFAULT 'pendente',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const predictiveMaintenance = await prisma.predictiveMaintenance.create({
      data: {
        equipamentoId: body.equipamentoId,
        tipoEquipamento: body.tipoEquipamento,
        tipoManutencao: body.tipoManutencao,
        probabilidade: body.probabilidade,
        severidade: body.severidade,
        dataPrevista: new Date(body.dataPrevista),
        recomendacao: body.recomendacao,
        status: body.status || 'pendente',
      },
    });

    return NextResponse.json(predictiveMaintenance, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar manutenção preditiva:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
