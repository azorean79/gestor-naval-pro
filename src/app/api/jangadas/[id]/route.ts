// src/app/api/jangadas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/jangadas/[id] - Buscar jangada por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const jangada = await prisma.jangada.findUnique({
      where: { id },
      include: {
        documentos: true,
      },
    });

    if (!jangada) {
      return NextResponse.json(
        { error: 'Jangada não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(jangada);
  } catch (error) {
    console.error('Erro ao buscar jangada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/jangadas/[id] - Atualizar jangada
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar se a jangada existe
    const existingJangada = await prisma.jangada.findUnique({
      where: { id }
    });

    if (!existingJangada) {
      return NextResponse.json(
        { error: 'Jangada não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o novo número já existe (se foi alterado)
    if (body.numero && body.numero !== existingJangada.numero) {
      const numeroExists = await prisma.jangada.findUnique({
        where: { numero: body.numero }
      });

      if (numeroExists) {
        return NextResponse.json(
          { error: 'Já existe uma jangada com este número' },
          { status: 400 }
        );
      }
    }

    const jangada = await prisma.jangada.update({
      where: { id },
      data: {
        numero: body.numero,
        nome: body.nome,
        proprietario: body.proprietario,
        numeroSerie: body.numeroSerie,
        marca: body.marca,
        modelo: body.modelo,
        // campo portoRegisto removido
        ilha: body.ilha,
        portoEscala: body.portoEscala,
        lotacao: body.lotacao,
        dataFabricacao: body.dataFabricacao ? new Date(body.dataFabricacao) : null,
        cilindro: body.cilindro,
        tipoPack: body.tipoPack,
        tipoPesca: body.tipoPesca,
        zonaPesca: body.zonaPesca,
        status: body.status,
        ultimaInspecao: body.ultimaInspecao ? new Date(body.ultimaInspecao) : null,
        proximaInspecao: body.proximaInspecao ? new Date(body.proximaInspecao) : null,
        observacoes: body.observacoes,
      },
      include: {
        documentos: true,
      },
    });

    return NextResponse.json(jangada);
  } catch (error) {
    console.error('Erro ao atualizar jangada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/jangadas/[id] - Deletar jangada
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se a jangada existe
    const jangada = await prisma.jangada.findUnique({
      where: { id }
    });

    if (!jangada) {
      return NextResponse.json(
        { error: 'Jangada não encontrada' },
        { status: 404 }
      );
    }

    await prisma.jangada.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Jangada deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar jangada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}