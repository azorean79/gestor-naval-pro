import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Buscar transportes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jangadaId = searchParams.get('jangadaId');
    const origemIlha = searchParams.get('origemIlha');
    const destinoIlha = searchParams.get('destinoIlha');
    const status = searchParams.get('status');

    const where: any = {};

    if (jangadaId) where.jangadaId = jangadaId;
    if (origemIlha) where.origemIlha = origemIlha;
    if (destinoIlha) where.destinoIlha = destinoIlha;
    if (status) where.status = status;

    const transportes = await prisma.transporteJangada.findMany({
      where,
      orderBy: { dataTransporte: 'desc' }
    });

    // Parse documentacao JSON for each transporte
    const transportesParsed = transportes.map(transporte => ({
      ...transporte,
      documentacao: transporte.documentacao ? JSON.parse(transporte.documentacao) : undefined
    }));

    return NextResponse.json(transportesParsed);
  } catch (error) {
    console.error('Erro ao buscar transportes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar transporte
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jangadaId,
      jangadaNome,
      origemIlha,
      destinoIlha,
      dataTransporte,
      tipoTransporte,
      veiculoTransporte,
      motorista,
      custoTransporte,
      documentacao,
      observacoes
    } = body;

    if (!jangadaId || !jangadaNome || !origemIlha || !destinoIlha || !dataTransporte || !tipoTransporte) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    const transporte = await prisma.transporteJangada.create({
      data: ({
        jangadaId,
        jangadaNome,
        origemIlha,
        destinoIlha,
        dataTransporte: new Date(dataTransporte),
        tipoTransporte,
        veiculoTransporte,
        motorista,
        custoTransporte: custoTransporte ? parseFloat(custoTransporte) : null,
        documentacao: documentacao ? JSON.stringify(documentacao) : null,
        observacoes
      } as any)
    });

    // Parse documentacao back for response
    const transporteParsed = {
      ...transporte,
      documentacao: documentacao || undefined
    };

    return NextResponse.json(transporteParsed, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar transporte:', error);
    return NextResponse.json(
      { error: 'Erro ao criar transporte' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar transporte
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do transporte não fornecido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.status) updateData.status = body.status;
    if (body.veiculoTransporte !== undefined) updateData.veiculoTransporte = body.veiculoTransporte;
    if (body.motorista !== undefined) updateData.motorista = body.motorista;
    if (body.custoTransporte !== undefined) updateData.custoTransporte = parseFloat(body.custoTransporte);
    if (body.documentacao !== undefined) updateData.documentacao = body.documentacao ? JSON.stringify(body.documentacao) : null;
    if (body.observacoes !== undefined) updateData.observacoes = body.observacoes;

    const transporte = await prisma.transporteJangada.update({
      where: { id },
      data: updateData
    });

    // Parse documentacao back for response
    const transporteParsed = {
      ...transporte,
      documentacao: transporte.documentacao ? JSON.parse(transporte.documentacao) : undefined
    };

    return NextResponse.json(transporteParsed);
  } catch (error) {
    console.error('Erro ao atualizar transporte:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar transporte' },
      { status: 500 }
    );
  }
}