// src/app/api/navios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/navios/[id] - Buscar navio por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const navio = await prisma.navio.findUnique({
      where: { id },
      include: {
        certificados: true,
        equipamentos: true,
        ordensServico: true,
      },
    });

    if (!navio) {
      return NextResponse.json(
        { error: 'Navio não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(navio);
  } catch (error) {
    console.error('Erro ao buscar navio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/navios/[id] - Atualizar navio
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar se o navio existe
    const existingNavio = await prisma.navio.findUnique({
      where: { id }
    });

    if (!existingNavio) {
      return NextResponse.json(
        { error: 'Navio não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o novo IMO já existe (se foi alterado)
    if (body.imo && body.imo !== existingNavio.imo) {
      const imoExists = await prisma.navio.findUnique({
        where: { imo: body.imo }
      });

      if (imoExists) {
        return NextResponse.json(
          { error: 'Já existe um navio com este IMO' },
          { status: 400 }
        );
      }
    }

    const navio = await prisma.navio.update({
      where: { id },
      data: {
        nome: body.nome,
        imo: body.imo,
        mmsi: body.mmsi,
        matricula: body.matricula,
        bandeira: body.bandeira,
        // campo portoRegisto removido
        ilha: body.ilha,
        portoEscala: body.portoEscala,
        tipo: body.tipo,
        comprimento: body.comprimento,
        largura: body.largura,
        calado: body.calado,
        capacidade: body.capacidade,
        proprietario: body.proprietario,
        armador: body.armador,
        ultimaInspecao: body.ultimaInspecao ? new Date(body.ultimaInspecao) : null,
        proximaInspecao: body.proximaInspecao ? new Date(body.proximaInspecao) : null,
        status: body.status,
        observacoes: body.observacoes,
      },
      include: {
        certificados: true,
        equipamentos: true,
        ordensServico: true,
      },
    });

    return NextResponse.json(navio);
  } catch (error) {
    console.error('Erro ao atualizar navio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/navios/[id] - Deletar navio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o navio existe
    const navio = await prisma.navio.findUnique({
      where: { id }
    });

    if (!navio) {
      return NextResponse.json(
        { error: 'Navio não encontrado' },
        { status: 404 }
      );
    }

    await prisma.navio.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Navio deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar navio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}