import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Buscar transporte específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transporte = await prisma.transporteJangada.findUnique({
      where: { id }
    });

    if (!transporte) {
      return NextResponse.json(
        { error: 'Transporte não encontrado' },
        { status: 404 }
      );
    }

    // Parse documentacao JSON
    const transporteParsed = {
      ...transporte,
      documentacao: transporte.documentacao ? JSON.parse(transporte.documentacao) : undefined
    };

    return NextResponse.json(transporteParsed);
  } catch (error) {
    console.error('Erro ao buscar transporte:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir transporte
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transporte = await prisma.transporteJangada.findUnique({
      where: { id }
    });

    if (!transporte) {
      return NextResponse.json(
        { error: 'Transporte não encontrado' },
        { status: 404 }
      );
    }

    // Só permite excluir transportes agendados ou cancelados
    if (transporte.status === 'em_transito' || transporte.status === 'concluido') {
      return NextResponse.json(
        { error: 'Não é possível excluir transportes em andamento ou concluídos' },
        { status: 400 }
      );
    }

    await prisma.transporteJangada.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Transporte excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir transporte:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir transporte' },
      { status: 500 }
    );
  }
}