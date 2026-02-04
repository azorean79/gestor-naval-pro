import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
config();

import { prisma } from '@/lib/prisma';

// GET /api/certificados/envios/[id] - Buscar envio de certificado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const envio = await prisma.envio.findUnique({
      where: {
        id: id,
        tipo: 'certificado'
      },
      include: {
        itens: {
          include: {
            certificado: true
          }
        },
        cliente: true
      }
    });

    if (!envio) {
      return NextResponse.json(
        { error: 'Envio de certificado não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(envio);
  } catch (error) {
    console.error('Erro ao buscar envio de certificado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/certificados/envios/[id] - Atualizar envio de certificado
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const envio = await prisma.envio.update({
      where: {
        id: id,
        tipo: 'certificado'
      },
      data: {
        status: body.status,
        enderecoEntrega: body.enderecoEntrega,
        metodoEnvio: body.metodoEnvio,
        responsavel: body.responsavel,
        observacoes: body.observacoes,
        dataEnvio: body.dataEnvio,
        dataEntregaReal: body.dataEntrega,
        numeroRastreio: body.trackingNumber
      },
      include: {
        itens: {
          include: {
            certificado: true
          }
        },
        cliente: true
      }
    });

    return NextResponse.json(envio);
  } catch (error) {
    console.error('Erro ao atualizar envio de certificado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/certificados/envios/[id] - Deletar envio de certificado
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.envio.delete({
      where: {
        id: id,
        tipo: 'certificado'
      }
    });

    return NextResponse.json({ message: 'Envio de certificado deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar envio de certificado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}