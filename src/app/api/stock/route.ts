import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const categoria = searchParams.get('categoria');
    const status = searchParams.get('status');
    const fornecedor = searchParams.get('fornecedor');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (status) {
      where.status = status;
    }

    if (fornecedor) {
      where.fornecedor = fornecedor;
    }

    const total = await prisma.stock.count({ where });

    const stock = await prisma.stock.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        movimentacoes: {
          orderBy: {
            data: 'desc',
          },
          take: 5, // últimas 5 movimentações
        },
      },
    });

    return NextResponse.json({
      data: stock,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Erro ao buscar itens do stock:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      nome, 
      categoria, 
      descricao, 
      quantidade, 
      quantidadeMinima, 
      precoUnitario,
      precoCompra,
      precoVenda,
      fornecedor, 
      localizacao,
      referenciaOrey,
      referenciaFabricante,
      lote,
      validade,
      imagem
    } = body

    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!categoria || typeof categoria !== 'string' || categoria.trim().length === 0) {
      return NextResponse.json(
        { error: 'Categoria é obrigatória' },
        { status: 400 }
      )
    }

    // Verificar se já existe
    const existing = await prisma.stock.findFirst({
      where: {
        nome: nome.trim(),
        categoria: categoria.trim(),
        status: 'ativo'
      }
    })

    // Criar tabela se não existir
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS "stock" (
        "id" TEXT PRIMARY KEY,
        "nome" TEXT NOT NULL,
        "descricao" TEXT,
        "categoria" TEXT NOT NULL,
        "quantidade" INTEGER DEFAULT 0,
        "quantidadeMinima" INTEGER DEFAULT 0,
        "precoUnitario" REAL,
        "fornecedor" TEXT,
        "localizacao" TEXT,
        "refOrey" TEXT,
        "refFabricante" TEXT,
        "lote" TEXT,
        "dataValidade" TIMESTAMP,
        "imagem" TEXT,
        "status" TEXT DEFAULT 'ativo',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const item = await prisma.stock.create({
      data: {
        nome: nome.trim(),
        categoria: categoria.trim(),
        descricao: descricao?.trim(),
        quantidade: quantidade || 0,
        quantidadeMinima: quantidadeMinima || 0,
        precoUnitario: precoUnitario || precoCompra,
        fornecedor: fornecedor?.trim(),
        localizacao: localizacao?.trim(),
        refOrey: referenciaOrey?.trim(),
        refFabricante: referenciaFabricante?.trim(),
        lote: lote?.trim(),
        dataValidade: validade ? new Date(validade) : null,
        imagem: imagem?.trim()
      }
    })

    return NextResponse.json({
      data: item,
      success: true
    })
  } catch (error) {
    console.error('Erro ao criar item no stock:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
