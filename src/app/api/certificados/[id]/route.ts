// src/app/api/certificados/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/certificados/[id] - Buscar certificado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const certificado = await prisma.certificado.findUnique({
      where: { id },
      include: {
        navio: true,
      },
    });

    if (!certificado) {
      return NextResponse.json(
        { error: 'Certificado não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(certificado);
  } catch (error) {
    console.error('Erro ao buscar certificado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/certificados/[id] - Atualizar certificado
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const certificado = await prisma.certificado.update({
      where: { id },
      data: {
        numero: body.numero,
        tipo: body.tipo,
        navioId: body.navioId,
        dataEmissao: body.dataEmissao ? new Date(body.dataEmissao) : null,
        dataValidade: body.dataValidade ? new Date(body.dataValidade) : null,
        arquivoUrl: body.arquivoUrl,
        tipoEquipamento: body.tipoEquipamento,
        marca: body.marca,
        modelos: body.modelos,
        observacoes: body.observacoes,
      },
      include: {
        navio: true,
      },
    });

    return NextResponse.json(certificado);
  } catch (error) {
    console.error('Erro ao atualizar certificado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/certificados/[id] - Deletar certificado
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.certificado.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Certificado deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar certificado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}