// src/app/api/jangadas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { Client } from 'pg';

function sanitizeString(value: any) {
  try {
    if (typeof value !== 'string') return value;
    return value.normalize('NFKC').replace(/\u2026/g, '...');
  } catch (e) {
    return value;
  }
}

// GET /api/jangadas - Listar todas as jangadas (dados offline)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 500;
    const skip = (page - 1) * limit;

    const [jangadas, total] = await Promise.all([
      prisma.jangada.findMany({
        orderBy: { createdAt: 'desc' },
        include: { documentos: true },
        skip,
        take: limit,
      }),
      prisma.jangada.count(),
    ]);

    return NextResponse.json({
      data: jangadas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar jangadas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/jangadas - Criar nova jangada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
  
    // Verificar se o número já existe
    const existingJangada = await prisma.jangada.findUnique({
      where: { numero: body.numero }
    });

    if (existingJangada) {
      return NextResponse.json(
        { error: 'Já existe uma jangada com este número' },
        { status: 400 }
      );
    }

    const jangada = await prisma.jangada.create({
      data: ({
        numero: body.numero,
        nome: body.nome,
        proprietario: body.proprietario,
        numeroSerie: body.numeroSerie,
        marca: body.marca,
        modelo: body.modelo,
        lotacao: body.lotacao,
        dataFabricacao: body.dataFabricacao ? new Date(body.dataFabricacao) : null,
        cilindro: body.cilindro,
        tipoPack: body.tipoPack,
        tipoPesca: body.tipoPesca,
        zonaPesca: body.zonaPesca,
        status: body.status || 'ativo',
        ultimaInspecao: body.ultimaInspecao ? new Date(body.ultimaInspecao) : null,
        proximaInspecao: body.proximaInspecao ? new Date(body.proximaInspecao) : null,
        observacoes: body.observacoes,
      } as any),
      include: {
        documentos: true,
      },
    });

    // Gerir stock: criar/atualizar item de produto (por Marca+Modelo+Lotacao)
    try {
      const productCode = `${String(body.marca || 'UNK')}-${String(body.modelo || 'UNK')}-${String(body.lotacao || '0')}`.replace(/\s+/g, '-');

      // criar ou incrementar produto agregado
        const produto = await prisma.itemStock.findUnique({ where: { codigo: productCode } });
      if (!produto) {
        await prisma.itemStock.create({
          data: ({
            nome: `Jangada ${body.marca || ''} ${body.modelo || ''}`.trim() || 'Jangada',
            categoria: 'Jangadas',
            unidade: 'unidade',
            quantidadeAtual: 1,
            quantidadeMinima: 0,
            codigo: productCode,
            descricao: `Produto agregado para jangadas ${body.marca || ''} ${body.modelo || ''} lotação ${body.lotacao || ''}`,
          } as any)
        });
      } else {
        await prisma.itemStock.update({ where: { id: produto.id }, data: { quantidadeAtual: (produto.quantidadeAtual || 0) + 1 } });
      }

      // criar item serializado para a jangada (unidade fisica)
      if (body.numeroSerie) {
        const serialCode = String(body.numeroSerie);
        const existsSerial = await prisma.itemStock.findUnique({ where: { codigo: serialCode } });
        if (!existsSerial) {
          await prisma.itemStock.create({
            data: ({
              nome: `Jangada ${body.numero} ${serialCode}`,
              categoria: 'Jangadas',
              unidade: 'unidade',
              quantidadeAtual: 1,
              quantidadeMinima: 0,
              codigo: serialCode,
              descricao: `Jangada serial ${serialCode} (produto ${productCode})`,
              observacoes: body.observacoes || null,
            } as any)
          });
        }
      }
    } catch (stockErr) {
      console.error('Falha ao sincronizar stock para jangada:', stockErr);
    }

    return NextResponse.json(jangada, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar jangada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
