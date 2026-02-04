import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
config();

import { prisma } from '@/lib/prisma';

// GET /api/correspondencias/[id] - Buscar correspondência por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const correspondencia = await prisma.correspondencia.findUnique({
      where: {
        id: id
      }
    });

    if (!correspondencia) {
      return NextResponse.json(
        { error: 'Correspondência não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(correspondencia);
  } catch (error) {
    console.error('Erro ao buscar correspondência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/correspondencias/[id] - Atualizar correspondência
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const correspondencia = await prisma.correspondencia.update({
      where: {
        id: id
      },
      data: {
        tipo: body.tipo,
        assunto: body.assunto,
        descricao: body.descricao,
        prioridade: body.prioridade,
        status: body.status,
        remetenteNome: body.remetenteNome,
        remetenteEmail: body.remetenteEmail,
        remetenteTelefone: body.remetenteTelefone,
        destinatarioNome: body.destinatarioNome,
        destinatarioEmail: body.destinatarioEmail,
        destinatarioTelefone: body.destinatarioTelefone,
        enderecoEntrega: body.enderecoEntrega,
        conteudo: body.conteudo,
        metodoEnvio: body.metodoEnvio,
        responsavel: body.responsavel,
        dataEnvio: body.dataEnvio,
        dataRecebimento: body.dataEntrega
      }
    });

    return NextResponse.json(correspondencia);
  } catch (error) {
    console.error('Erro ao atualizar correspondência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/correspondencias/[id] - Deletar correspondência
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.correspondencia.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json({ message: 'Correspondência deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar correspondência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}