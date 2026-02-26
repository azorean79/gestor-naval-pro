// src/app/api/clientes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/clientes - Listar todos os clientes (dados offline)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 500;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { nif: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({ where, orderBy: { createdAt: 'desc' }, include: { documentos: true }, skip, take: limit }),
      prisma.cliente.count({ where }),
    ]);

    return NextResponse.json({ data: clientes, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/clientes - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    const requiredFields = ['nome', 'tipo', 'email'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        );
      }
    }

    // Verificar se o NIF já existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { nif: body.nif }
    });

    if (existingCliente) {
      return NextResponse.json(
        { error: 'Já existe um cliente com este NIF' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: body.nome,
        tipo: body.tipo,
        nif: body.nif,
        email: body.email,
        telefone: body.telefone,
        morada: body.morada,
        contactosEmergencia: body.contactosEmergencia,
        status: body.status || 'ativo',
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
        profissao: body.profissao,
        empresa: body.empresa,
        observacoes: body.observacoes,
      },
      include: {
        documentos: true,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}