// src/app/api/certificados/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/certificados - Listar todos os certificados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const navioId = searchParams.get('navioId');
    const tipo = searchParams.get('tipo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    const skip = limit ? (page - 1) * limit : undefined;

    // Construir filtros
    const where: {
      navioId?: string;
      tipo?: string;
      OR?: Array<{
        numero?: { contains: string; mode: string };
        tipo?: { contains: string; mode: string };
        navio?: { nome?: { contains: string; mode: string } };
      }>;
    } = {};
    if (navioId) {
      where.navioId = navioId;
    }
    if (tipo) {
      where.tipo = tipo;
    }
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { tipo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [certificados, total] = await Promise.all([
      prisma.certificado.findMany({
        where,
        include: {
          navio: true,
        },
        orderBy: { dataEmissao: 'desc' },
        ...(skip !== undefined ? { skip } : {}),
        ...(limit !== undefined ? { take: limit } : {}),
      }),
      prisma.certificado.count({ where })
    ]);

    return NextResponse.json({
      data: certificados,
      total,
      page: limit ? page : 1,
      limit: limit ?? total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    });
  } catch (error) {
    console.error('Erro ao buscar certificados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/certificados - Criar novo certificado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    const requiredFields = ['numero', 'tipo', 'emissor'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        );
      }
    }

    const certificado = await prisma.certificado.create({
      data: {
        numero: body.numero,
        tipo: body.tipo,
        emissor: body.emissor,
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

    return NextResponse.json(certificado, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar certificado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
