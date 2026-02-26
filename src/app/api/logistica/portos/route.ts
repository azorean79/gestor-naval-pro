import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Buscar portos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ilha = searchParams.get('ilha');
    const tipo = searchParams.get('tipo');
    const status = searchParams.get('status');

    const where: any = {};

    if (ilha) where.ilha = ilha;
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;

    const portos = await prisma.porto.findMany({
      where,
      orderBy: { nome: 'asc' }
    });

    // Parse servicos JSON for each porto
    const portosParsed = portos.map(porto => ({
      ...porto,
      servicos: porto.servicos ? JSON.parse(porto.servicos) : undefined
    }));

    return NextResponse.json(portosParsed);
  } catch (error) {
    console.error('Erro ao buscar portos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar porto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome,
      ilha,
      tipo,
      coordenadas,
      capacidade,
      servicos,
      contacto
    } = body;

    if (!nome || !ilha || !tipo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    const porto = await prisma.porto.create({
      data: ({
        nome,
        ilha,
        tipo,
        coordenadas,
        capacidade: capacidade ? parseInt(capacidade) : null,
        servicos: servicos ? JSON.stringify(servicos) : null,
        contacto
      } as any)
    });

    // Parse servicos back for response
    const portoParsed = {
      ...porto,
      servicos: servicos || undefined
    };

    return NextResponse.json(portoParsed, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar porto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar porto' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar porto
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do porto não fornecido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.status) updateData.status = body.status;
    if (body.capacidade !== undefined) updateData.capacidade = parseInt(body.capacidade);
    if (body.servicos !== undefined) updateData.servicos = body.servicos ? JSON.stringify(body.servicos) : null;
    if (body.contacto !== undefined) updateData.contacto = body.contacto;

    const porto = await prisma.porto.update({
      where: { id },
      data: updateData
    });

    // Parse servicos back for response
    const portoParsed = {
      ...porto,
      servicos: porto.servicos ? JSON.parse(porto.servicos) : undefined
    };

    return NextResponse.json(portoParsed);
  } catch (error) {
    console.error('Erro ao atualizar porto:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar porto' },
      { status: 500 }
    );
  }
}