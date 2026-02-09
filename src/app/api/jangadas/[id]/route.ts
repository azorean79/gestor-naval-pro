import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar por numeroSerie em vez de id
    const jangada = await prisma.jangada.findUnique({
      where: { numeroSerie: id },
      include: {
        cliente: true,
        proprietario: true,
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
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const jangada = await prisma.jangada.update({
      where: { id },
      data: {
        numeroSerie: data.numeroSerie,
        marcaId: data.marcaId,
        modeloId: data.modeloId,
        tipo: data.tipo,
        lotacaoId: data.lotacaoId,
        tipoPackId: data.tipoPackId,
        itensTipoPack: data.itensTipoPack,
        dataFabricacao: data.dataFabricacao ? new Date(data.dataFabricacao) : null,
        dataInspecao: data.dataInspecao ? new Date(data.dataInspecao) : null,
        dataProximaInspecao: data.dataProximaInspecao ? new Date(data.dataProximaInspecao) : null,
        status: data.status,
        estado: data.estado,
        clienteId: data.clienteId,
        proprietarioId: data.proprietarioId,
        tecnico: data.tecnicoResponsavel || data.tecnico,
        // HRU fields
        hruNumeroSerie: data.hruNumeroSerie,
        hruDataInstalacao: data.hruDataInstalacao ? new Date(data.hruDataInstalacao) : null,
        hruDataValidade: data.hruDataValidade ? new Date(data.hruDataValidade) : null,
      },
      include: {
        cliente: true,
        proprietario: true,
        marca: true,
        modelo: true,
      },
    });

    return NextResponse.json(jangada);

  } catch (error) {
    console.error('Erro ao atualizar jangada:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar jangada' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updateData: any = {};
    
    if (data.numeroSerie !== undefined) updateData.numeroSerie = data.numeroSerie;
    if (data.dataFabricacao) updateData.dataFabricacao = new Date(data.dataFabricacao);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dataUltimaInspecao) updateData.dataInspecao = new Date(data.dataUltimaInspecao);
    if (data.dataProximaInspecao) updateData.dataProximaInspecao = new Date(data.dataProximaInspecao);
    
    // HRU fields
    if (data.hruAplicavel !== undefined) updateData.hruAplicavel = data.hruAplicavel;
    if (data.hruNumeroSerie !== undefined) updateData.hruNumeroSerie = data.hruNumeroSerie;
    if (data.hruModelo !== undefined) updateData.hruModelo = data.hruModelo;
    if (data.hruDataInstalacao) updateData.hruDataInstalacao = new Date(data.hruDataInstalacao);
    if (data.hruDataValidade) updateData.hruDataValidade = new Date(data.hruDataValidade);

    const jangada = await prisma.jangada.update({
      where: { id },
      data: updateData,
      include: {
        cliente: true,
        proprietario: true,
        marca: true,
        modelo: true,
      },
    });

    return NextResponse.json(jangada);

  } catch (error) {
    console.error('Erro ao atualizar jangada:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar jangada' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.jangada.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao deletar jangada:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar jangada' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}