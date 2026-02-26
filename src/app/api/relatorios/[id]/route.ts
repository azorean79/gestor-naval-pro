// src/app/api/relatorios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/relatorios/[id] - Buscar relatório por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const relatorio = await prisma.relatorio.findUnique({
      where: { id },
      include: {
        ordemServico: {
          include: {
            cliente: true,
            navio: true,
          },
        },
      },
    });

    if (!relatorio) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(relatorio);
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/relatorios/[id] - Atualizar relatório
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar se o relatório existe
    const existingRelatorio = await prisma.relatorio.findUnique({
      where: { id }
    });

    if (!existingRelatorio) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }

    const relatorio = await prisma.relatorio.update({
      where: { id },
      data: {
        titulo: body.titulo,
        tipo: body.tipo,
        dados: body.dados,
        formato: body.formato,
        arquivo: body.arquivo,
        ordemServicoId: body.ordemServicoId,
      },
      include: {
        ordemServico: {
          include: {
            cliente: true,
            navio: true,
          },
        },
      },
    });

    return NextResponse.json(relatorio);
  } catch (error) {
    console.error('Erro ao atualizar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/relatorios/[id] - Deletar relatório
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o relatório existe
    const relatorio = await prisma.relatorio.findUnique({
      where: { id }
    });

    if (!relatorio) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }

    await prisma.relatorio.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Relatório deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}