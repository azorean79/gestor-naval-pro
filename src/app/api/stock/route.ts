// src/app/api/stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function sanitizeString(value?: string) {
  if (!value) return value;
  try {
    return value.normalize('NFKC').replace(/\u2026/g, '...');
  } catch (e) {
    return value.replace(/\u2026/g, '...');
  }
}

// GET /api/stock - Listar todos os itens de stock
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = sanitizeString(searchParams.get('categoria') || undefined);
    const status = sanitizeString(searchParams.get('status') || undefined);
    const search = sanitizeString(searchParams.get('search') || undefined);
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 500; // default limit set to 500

    // Construir filtros
    const where: {
      categoria?: string;
      status?: string;
      OR?: Array<{
        nome?: { contains: string; mode: string };
        descricao?: { contains: string; mode: string };
        codigo?: { contains: string; mode: string };
      }>;
    } = {};

    if (categoria) where.categoria = categoria;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calcular offset para paginação
    const skip = (page - 1) * limit;

    // Buscar itens de stock com filtros e paginação
    const [itens, total] = await Promise.all([
      prisma.itemStock.findMany({
        where,
        include: {
          movimentacoes: true,
          itensOrdemServico: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.itemStock.count({ where }),
    ]);

    return NextResponse.json({
      data: itens,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar itens de stock:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/stock - Criar novo item de stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // sanitize incoming string fields to avoid byte conversion issues in remote engines
    body.nome = sanitizeString(body.nome);
    body.categoria = sanitizeString(body.categoria);
    body.descricao = sanitizeString(body.descricao);
    body.codigo = sanitizeString(body.codigo);
    body.codigoFabricante = sanitizeString(body.codigoFabricante);
    body.localizacao = sanitizeString(body.localizacao);
    body.observacoes = sanitizeString(body.observacoes);

    // Validação básica
    const requiredFields = ['nome', 'categoria'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        );
      }
    }

    // Verificar se o nome já existe
    const existingItem = await prisma.itemStock.findFirst({
      where: { nome: body.nome }
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Já existe um item com este nome' },
        { status: 400 }
      );
    }

    // handle base64 image upload (optional)
    let imagemPath: string | undefined = undefined;
    if (body.imagemBase64) {
      try {
        const matches = body.imagemBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const buffer = Buffer.from(matches[2], 'base64');
          const fs = await import('fs');
          const path = await import('path');
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          await fs.promises.mkdir(uploadDir, { recursive: true });
          const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.png`;
          const filepath = path.join(uploadDir, filename);
          await fs.promises.writeFile(filepath, buffer);
          imagemPath = `/uploads/${filename}`;
        }
      } catch (e) {
        console.error('Erro ao salvar imagem:', e);
      }
    }

    // parse dataValidade if provided
    let dataValidadeDate: Date | undefined = undefined;
    if (body.dataValidade) {
      dataValidadeDate = new Date(body.dataValidade);
    }

    // numeroReferencia é obrigatório no modelo Prisma; gere um se não for fornecido
    const numeroReferencia = body.numeroReferencia || `NR-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

    const item = await prisma.itemStock.create({
      data: ({
        numeroReferencia,
        nome: body.nome,
        descricao: body.descricao,
        categoria: body.categoria,
        quantidadeAtual: body.quantidadeAtual || 0,
        quantidadeMinima: body.quantidadeMinima || 0,
        unidade: body.unidade,
        precoUnitario: body.precoUnitario,
        precoCompra: body.precoCompra,
        precoVenda: body.precoVenda,
        codigo: body.codigo,
        codigoFabricante: body.codigoFabricante,
        lote: body.lote,
        dataValidade: dataValidadeDate,
        imagem: imagemPath,
        localizacao: body.localizacao,
        status: body.status || 'disponivel',
        observacoes: body.observacoes,
        fornecedor: body.fornecedor,
      } as any),
      include: {
        movimentacoes: true,
        itensOrdemServico: true,
      },
    });

    // If this is a cilindro, attempt to persist cilindro details as well
    try {
      if (String(body.categoria).toLowerCase() === 'cilindros') {
        // build sanitized cilindro payload using available fields
        const possible = [
          'numeroSerie',
          'pesoBruto',
          'tara',
          'quantidadeCO2',
          'quantidadeN2',
          'testeHidraulico',
          'proximoTesteHidraulico',
          'tipoSistemaInsuflacao',
          'status',
          'localizacao',
          'proprietario',
          'observacoes',
        ];

        // prefer serial from lote/codigo/numeroSerieJangada
        const serial = body.lote || body.codigo || body.numeroSerie || body.numeroSerieJangada;
        if (serial) {
          const data: any = { numeroSerie: String(serial) };
          for (const k of possible) {
            if (body[k] !== undefined && body[k] !== null) {
              if (k === 'testeHidraulico' || k === 'proximoTesteHidraulico') {
                data[k] = body[k] ? new Date(body[k]) : null;
              } else {
                data[k] = sanitizeString(body[k]);
              }
            }
          }

          // derive localizacao/status from item if not provided
          if (!data.localizacao && item.localizacao) data.localizacao = item.localizacao;
          if (!data.status && item.status) data.status = item.status;

          // Attempt upsert with progressive unknown-arg stripping (robust against schema drift)
          const maxAttempts = 6;
          let attempt = 0;
          const createData = { ...data };
          const updateData: any = { ...data };
          delete updateData.id;
          delete updateData.createdAt;
          delete updateData.updatedAt;
          let cilindro: any = null;
          while (attempt < maxAttempts) {
            try {
              cilindro = await prisma.cilindro.upsert({
                where: { numeroSerie: createData.numeroSerie },
                create: createData,
                update: updateData,
              });
              break;
            } catch (err: any) {
              const msg = String(err?.message || err || '');
              const unknownMatch = msg.match(/Unknown argument `([^`]+)`/);
              if (unknownMatch && unknownMatch[1]) {
                const unknownKey = unknownMatch[1];
                delete createData[unknownKey];
                delete updateData[unknownKey];
                attempt++;
                continue;
              }
              console.error('Falha ao upsert cilindro:', err);
              break;
            }
          }
          if (cilindro) {
            // If item lacked codigo, set it to cilindro serial to keep parity
            try {
              if (!item.codigo) {
                await prisma.itemStock.update({ where: { id: item.id }, data: { codigo: String(cilindro.numeroSerie) } });
              }
            } catch (e) {
              // non-fatal
              console.warn('Não foi possível actualizar codigo do item após criar cilindro:', e);
            }
          }
        }
      }
    } catch (e) {
      console.error('Erro ao persistir dados de cilindro durante POST /api/stock:', e);
      // do not fail item creation for cilindro persistence errors
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar item de stock:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}