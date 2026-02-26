import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Buscar inspeção específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inspecao = await prisma.inspecao.findUnique({
      where: { id }
    });

    if (!inspecao) {
      return NextResponse.json(
        { error: 'Inspeção não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(inspecao);
  } catch (error) {
    console.error('Erro ao buscar inspeção:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar inspeção' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir inspeção
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.inspecao.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Inspeção excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir inspeção:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir inspeção' },
      { status: 500 }
    );
  }
}