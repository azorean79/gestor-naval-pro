// src/app/api/clientes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/clientes/[id] - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        documentos: true,
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/clientes/[id] - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar se o cliente existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { id }
    });

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o novo NIF já existe (se foi alterado)
    if (body.nif && body.nif !== existingCliente.nif) {
      const nifExists = await prisma.cliente.findUnique({
        where: { nif: body.nif }
      });

      if (nifExists) {
        return NextResponse.json(
          { error: 'Já existe um cliente com este NIF' },
          { status: 400 }
        );
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nome: body.nome,
        tipo: body.tipo,
        nif: body.nif,
        email: body.email,
        telefone: body.telefone,
        morada: body.morada,
        // campo portoRegisto removido
        ilha: body.ilha,
        portoEscala: body.portoEscala,
        contactosEmergencia: body.contactosEmergencia,
        status: body.status,
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
        profissao: body.profissao,
        empresa: body.empresa,
        observacoes: body.observacoes,
      },
      include: {
        documentos: true,
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/clientes/[id] - Deletar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    await prisma.cliente.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}