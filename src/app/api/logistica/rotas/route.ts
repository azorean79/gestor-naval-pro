import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Buscar rotas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origemIlha = searchParams.get('origemIlha');
    const destinoIlha = searchParams.get('destinoIlha');
    const status = searchParams.get('status');

    const where: any = {};

    if (origemIlha) where.origemIlha = origemIlha;
    if (destinoIlha) where.destinoIlha = destinoIlha;
    if (status) where.status = status;

    const rotas = await prisma.rotaTransporte.findMany({
      where,
      orderBy: { origemIlha: 'asc' }
    });

    // Parse transportadoras JSON for each rota
    const rotasParsed = rotas.map(rota => ({
      ...rota,
      transportadoras: rota.transportadoras ? JSON.parse(rota.transportadoras) : undefined
    }));

    return NextResponse.json(rotasParsed);
  } catch (error) {
    console.error('Erro ao buscar rotas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar rota
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      origemIlha,
      destinoIlha,
      distanciaKm,
      tempoEstimadoHoras,
      custoBase,
      frequencia,
      transportadoras,
      observacoes
    } = body;

    if (!origemIlha || !destinoIlha || !distanciaKm || !tempoEstimadoHoras || !custoBase) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    const rota = await prisma.rotaTransporte.create({
      data: ({
        origemIlha,
        destinoIlha,
        distanciaKm: parseFloat(distanciaKm),
        tempoEstimadoHoras: parseFloat(tempoEstimadoHoras),
        custoBase: parseFloat(custoBase),
        frequencia,
        transportadoras: transportadoras ? JSON.stringify(transportadoras) : null,
        observacoes
      } as any)
    });

    // Parse transportadoras back for response
    const rotaParsed = {
      ...rota,
      transportadoras: transportadoras || undefined
    };

    return NextResponse.json(rotaParsed, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar rota:', error);
    return NextResponse.json(
      { error: 'Erro ao criar rota' },
      { status: 500 }
    );
  }
}