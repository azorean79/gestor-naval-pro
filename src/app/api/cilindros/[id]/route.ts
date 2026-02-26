// src/app/api/cilindros/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Client } from 'pg';

function sanitizeString(value: any) {
  try {
    if (typeof value !== 'string') return value;
    return value.normalize('NFKC').replace(/\u2026/g, '...');
  } catch (e) {
    return value;
  }
}

// GET /api/cilindros/[id] - Buscar cilindro por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const safeId = sanitizeString(id);
    const attemptedCols: string[] = [];
    const attemptedSql: string[] = [];

    let cilindro = null;
    try {
      // try by id first
      cilindro = await prisma.cilindro.findUnique({
        where: { id: safeId },
        include: { certificados: true, historicoInspecoes: true },
      });
    } catch (err: any) {
      console.error('Erro ao buscar cilindro por id (Prisma):', err);
      // continue to try by numeroSerie below
    }

    if (!cilindro) {
      try {
        cilindro = await prisma.cilindro.findUnique({
          where: { numeroSerie: safeId },
          include: { certificados: true, historicoInspecoes: true },
        });
      } catch (err: any) {
        console.error('Erro ao buscar cilindro por numeroSerie (Prisma):', err);
        // If the error is caused by a missing column in DB, attempt a raw SQL fallback via Prisma (no schema mapping)
        const msg = String(err?.message || err);
        if (/column .* does not exist/i.test(msg) || /does not exist in the current database/i.test(msg)) {
          try {
            // 1) Try a simple id-based raw query (doesn't reference potential camelCase columns)
            attemptedCols.push('id');
            const sqlId = `SELECT row_to_json(c) as data FROM (SELECT * FROM cilindros WHERE id = $1 LIMIT 1) c`;
            attemptedSql.push(sqlId);
            const byId: any = await prisma.$queryRawUnsafe
              ? await (prisma as any).$queryRawUnsafe(sqlId, safeId)
              : await prisma.$queryRaw`
                  SELECT row_to_json(c) as data
                  FROM (SELECT * FROM cilindros WHERE id = ${safeId} LIMIT 1) c`;
            if (byId && byId.length > 0 && byId[0]?.data) {
              console.info('[cilindros] raw fallback: found by id');
              return NextResponse.json(byId[0].data, { headers: { 'X-Fallback-Column': 'id' } });
            }

            // 2) If not found by id, try to discover a serial/numero column dynamically
            const possibleCols: any = await prisma.$queryRaw`
              SELECT column_name
              FROM information_schema.columns
              WHERE table_name = 'cilindros'
                AND (column_name ILIKE '%serie%' OR column_name ILIKE '%numero%')
              ORDER BY column_name
              LIMIT 1`;

            if (possibleCols && possibleCols.length > 0 && possibleCols[0]?.column_name) {
              const col = possibleCols[0].column_name as string;
              attemptedCols.push(col);
              // build safe SQL using the discovered column name (from information_schema)
              const sql = `SELECT row_to_json(c) as data FROM (SELECT * FROM cilindros WHERE "${col}" = $1 LIMIT 1) c`;
              attemptedSql.push(sql);
              const rowsByCol: any = await (prisma as any).$queryRawUnsafe
                ? await (prisma as any).$queryRawUnsafe(sql, safeId)
                : await prisma.$queryRawUnsafe(sql, safeId);
              if (rowsByCol && rowsByCol.length > 0 && rowsByCol[0]?.data) {
                console.info(`[cilindros] raw fallback: found by discovered column "${col}"`);
                return NextResponse.json(rowsByCol[0].data, { headers: { 'X-Fallback-Column': col } });
              }
            }

            // 3) As a last-ditch attempt, search any text-like column for the given value
            const textCols: any = await prisma.$queryRaw`
              SELECT column_name
              FROM information_schema.columns
              WHERE table_name = 'cilindros'
                AND data_type IN ('character varying','text')
              ORDER BY ordinal_position
              LIMIT 1`;

            if (textCols && textCols.length > 0 && textCols[0]?.column_name) {
              const col = textCols[0].column_name as string;
              attemptedCols.push(col);
              const sql = `SELECT row_to_json(c) as data FROM (SELECT * FROM cilindros WHERE "${col}" = $1 LIMIT 1) c`;
              attemptedSql.push(sql);
              const rowsAny: any = await (prisma as any).$queryRawUnsafe
                ? await (prisma as any).$queryRawUnsafe(sql, safeId)
                : await prisma.$queryRawUnsafe(sql, safeId);
              if (rowsAny && rowsAny.length > 0 && rowsAny[0]?.data) {
                console.info(`[cilindros] raw fallback: found by text column "${col}"`);
                return NextResponse.json(rowsAny[0].data, { headers: { 'X-Fallback-Column': col } });
              }
            }

            return NextResponse.json(
              { error: 'Cilindro não encontrado (raw fallback)', debug: { triedColumns: attemptedCols, triedSql: attemptedSql } },
              { status: 404, headers: { 'X-Tried-Columns': attemptedCols.join(',') } }
            );
          } catch (rawErr: any) {
            console.error('Prisma $queryRaw fallback falhou:', rawErr);
            return NextResponse.json({ error: 'Erro ao consultar DB via raw fallback: ' + (rawErr?.message || String(rawErr)) }, { status: 500 });
          }
        }
        return NextResponse.json({ error: 'Erro ao consultar DB: ' + (err?.message || String(err)) }, { status: 500 });
      }
    }

    if (!cilindro) {
      return NextResponse.json({ error: 'Cilindro não encontrado' }, { status: 404 });
    }

    return NextResponse.json(cilindro);
  } catch (error: any) {
    console.error('Erro ao buscar cilindro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor: ' + (error?.message || String(error)) }, { status: 500 });
  }
}

// PUT /api/cilindros/[id] - Atualizar cilindro
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const safeId = sanitizeString(id);
    const body = await request.json();
    // sanitize string fields in body to avoid passing problematic characters to Prisma
    const sanitizedBody: any = {};
    for (const k of Object.keys(body || {})) {
      sanitizedBody[k] = sanitizeString(body[k]);
    }

    // Verificar se o cilindro existe
    let existingCilindro;
    try {
      existingCilindro = await prisma.cilindro.findUnique({ where: { id: safeId } });
    } catch (err: any) {
      console.error('Erro ao buscar cilindro (Prisma):', err);
      if (err && err.code === 'P5010') {
        return NextResponse.json(
          { error: 'Erro na conversão de bytes no DB (caractere inválido detectado). Execute sanitização do banco.' },
          { status: 500 }
        );
      }
      throw err;
    }

    if (!existingCilindro) {
      return NextResponse.json(
        { error: 'Cilindro não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o novo número de série já existe (se foi alterado)
    if (sanitizedBody.numeroSerie && sanitizedBody.numeroSerie !== existingCilindro.numeroSerie) {
      const numeroSerieExists = await prisma.cilindro.findUnique({
        where: { numeroSerie: sanitizedBody.numeroSerie }
      });

      if (numeroSerieExists) {
        return NextResponse.json(
          { error: 'Já existe um cilindro com este número de série' },
          { status: 400 }
        );
      }
    }

    const cilindro = await prisma.cilindro.update({
      where: { id: safeId },
      data: {
        numeroSerie: sanitizedBody.numeroSerie,
        pesoBruto: sanitizedBody.pesoBruto,
        tara: sanitizedBody.tara,
        quantidadeCO2: sanitizedBody.quantidadeCO2,
        quantidadeN2: sanitizedBody.quantidadeN2,
        testeHidraulico: sanitizedBody.testeHidraulico ? new Date(sanitizedBody.testeHidraulico) : null,
        proximoTesteHidraulico: sanitizedBody.proximoTesteHidraulico ? new Date(sanitizedBody.proximoTesteHidraulico) : null,
        tipoSistemaInsuflacao: sanitizedBody.tipoSistemaInsuflacao,
        status: sanitizedBody.status,
        localizacao: sanitizedBody.localizacao,
        proprietario: sanitizedBody.proprietario,
        observacoes: sanitizedBody.observacoes,
      },
      include: {
        certificados: true,
        historicoInspecoes: true,
      },
    });

    // Sincronizar com stock: criar ou atualizar item stock correspondente ao cilindro
    try {
      const codigoStock = String(cilindro.numeroSerie || cilindro.id);
      await prisma.itemStock.upsert({
        where: { codigo: codigoStock },
        update: {
          nome: `Cilindro ${codigoStock}`,
          descricao: sanitizedBody.observacoes || cilindro.observacoes || `Cilindro série ${codigoStock}`,
          categoria: 'Cilindros',
          localizacao: sanitizedBody.localizacao || cilindro.localizacao || undefined,
          observacoes: sanitizedBody.observacoes || cilindro.observacoes || undefined,
        },
        create: {
          nome: `Cilindro ${codigoStock}`,
          categoria: 'Cilindros',
          unidade: 'unidade',
          quantidadeAtual: 1,
          quantidadeMinima: 0,
          codigo: codigoStock,
          descricao: sanitizedBody.observacoes || cilindro.observacoes || `Cilindro série ${codigoStock}`,
          localizacao: sanitizedBody.localizacao || cilindro.localizacao || null,
          observacoes: sanitizedBody.observacoes || cilindro.observacoes || null,
        }
      });
    } catch (stockErr) {
      console.error('Falha ao sincronizar stock para cilindro (PUT):', stockErr);
    }

    return NextResponse.json(cilindro);
  } catch (error) {
    console.error('Erro ao atualizar cilindro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/cilindros/[id] - Deletar cilindro
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const safeId = sanitizeString(id);

    // Verificar se o cilindro existe
    let cilindro;
    try {
      cilindro = await prisma.cilindro.findUnique({ where: { id: safeId } });
    } catch (err: any) {
      console.error('Erro ao buscar cilindro (Prisma):', err);
      if (err && err.code === 'P5010') {
        return NextResponse.json(
          { error: 'Erro na conversão de bytes no DB (caractere inválido detectado). Execute sanitização do banco.' },
          { status: 500 }
        );
      }
      throw err;
    }

    if (!cilindro) {
      return NextResponse.json(
        { error: 'Cilindro não encontrado' },
        { status: 404 }
      );
    }

    await prisma.cilindro.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Cilindro deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cilindro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}