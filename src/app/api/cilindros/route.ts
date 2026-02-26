// src/app/api/cilindros/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Client } from 'pg';

function sanitizeString(value: any) {
  try {
    if (typeof value !== 'string') return value;
    return value.normalize('NFKC').replace(/\u2026/g, '...');
  } catch (e) {
    return value;
  }
}
// GET /api/cilindros - Listar todos os cilindros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let tipo = searchParams.get('tipo');
    let status = searchParams.get('status');
    let search = searchParams.get('search');
    // sanitize query inputs to avoid passing problematic unicode to Prisma engine
    tipo = sanitizeString(tipo);
    status = sanitizeString(status);
    search = sanitizeString(search);
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Construir filtros
    const where: {
      tipo?: string;
      status?: string;
      OR?: Array<{
        numeroSerie?: { contains: string; mode: string };
        fabricante?: { contains: string; mode: string };
        modelo?: { contains: string; mode: string };
        jangada?: { nome?: { contains: string; mode: string } };
      }>;
    } = {};

    if (tipo) {
      where.tipo = tipo;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { numeroSerie: { contains: search } },
        { fabricante: { contains: search } },
        { modelo: { contains: search } },
      ];
    }

    // Calcular offset para paginação (somente se limit definido)
    const skip = limit ? (page - 1) * limit : undefined;

    // Do not expose request details in production responses; keep server-side logs minimal
    // Detect table columns to build safe WHERE clauses
    let tableColumns: string[] | null = null;
    try {
      const cols: any = await prisma.$queryRawUnsafe(`PRAGMA table_info('cilindros')`);
      if (Array.isArray(cols) && cols.length > 0) tableColumns = cols.map((c: any) => c.name).filter(Boolean);
    } catch (e) {
      tableColumns = null;
    }

    // Buscar cilindros com filtros e paginação using raw SQL (works across providers)
    try {
      const whereParts: Prisma.Sql[] = [];
      if (tipo && (!tableColumns || tableColumns.includes('tipo'))) whereParts.push(Prisma.sql`"tipo" = ${tipo}`);
      if (status && (!tableColumns || tableColumns.includes('status'))) whereParts.push(Prisma.sql`"status" = ${status}`);
      if (search) {
        const s = `%${search}%`;
        // Search across available text columns safely (only include columns that exist)
        if (!tableColumns || tableColumns.includes('numeroSerie')) whereParts.push(Prisma.sql`"numeroSerie" LIKE ${s}`);
        if (!tableColumns || tableColumns.includes('fabricante')) whereParts.push(Prisma.sql`"fabricante" LIKE ${s}`);
        if (!tableColumns || tableColumns.includes('modelo')) whereParts.push(Prisma.sql`"modelo" LIKE ${s}`);
      }
      const whereSql = whereParts.length ? Prisma.sql`WHERE ${Prisma.join(whereParts, Prisma.sql` AND `)}` : Prisma.sql``;

      // build SQL with optional LIMIT/OFFSET when limit provided
      const q = limit ? Prisma.sql`SELECT * FROM cilindros ${whereSql} ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${skip}` : Prisma.sql`SELECT * FROM cilindros ${whereSql} ORDER BY "createdAt" DESC`;
      const countQ = Prisma.sql`SELECT count(1) as cnt FROM cilindros ${whereSql}`;

      const rows: any = await prisma.$queryRaw(q);
      const countRes: any = await prisma.$queryRaw(countQ);
      const total = Array.isArray(countRes) && countRes[0] ? Number(countRes[0].cnt || countRes[0].count || 0) : 0;

      return NextResponse.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
      } catch (rawErr) {
      console.error('Raw SQL listing failed:', rawErr?.message || rawErr);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao buscar cilindros:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/cilindros - Criar novo cilindro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Try to discover table columns so we only enforce required fields that exist
    let tableColumns: string[] | null = null;
    try {
      const cols: any = await prisma.$queryRawUnsafe(`PRAGMA table_info('cilindros')`);
      if (Array.isArray(cols) && cols.length > 0) {
        tableColumns = cols.map((c: any) => c.name).filter(Boolean);
      }
    } catch (e) {
      // ignore
    }

    if (!tableColumns) {
      try {
        const cols: any = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'cilindros'`;
        if (Array.isArray(cols) && cols.length > 0) {
          tableColumns = cols.map((c: any) => c.column_name).filter(Boolean);
        }
      } catch (e) {
        // ignore
      }
    }

    // Validação básica (fabricante não é obrigatório)
    const requiredFields = ['numeroSerie', 'tipo'];
    for (const field of requiredFields) {
      // only enforce if the column exists or we couldn't detect columns
      if (tableColumns && !tableColumns.includes(field)) continue;
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        );
      }
    }

    // sanitize incoming string fields to avoid passing problematic characters to Prisma
    const sanitizedBody: any = {};
    for (const k of Object.keys(body || {})) {
      sanitizedBody[k] = sanitizeString(body[k]);
    }

    // Verificar se o número de série já existe (use raw query selecting only minimal columns to avoid schema-mismatch errors)
    let existingCilindro: any = null;
    let alreadyExisted = false;
    try {
      const r: any = await prisma.$queryRaw`SELECT id, numeroSerie FROM cilindros WHERE numeroSerie = ${sanitizedBody.numeroSerie} LIMIT 1`;
      if (Array.isArray(r) && r.length > 0) existingCilindro = r[0];
    } catch (rawErr) {
      // Fallback to Prisma (may fail if DB schema mismatched)
      try {
        existingCilindro = await prisma.cilindro.findUnique({ where: { numeroSerie: sanitizedBody.numeroSerie } });
      } catch (e) {
        console.warn('Could not verify existing cilindro using Prisma, proceeding optimistically:', e);
      }
    }

    if (existingCilindro) {
      alreadyExisted = true;
    }

    // Build create data only with fields that exist in the actual DB table
    const possibleFields = [
      'numeroSerie',
      'tipo',
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

    // tableColumns already determined above

    const data: any = {};
    for (const key of possibleFields) {
      if (key in sanitizedBody) {
        if (!tableColumns || tableColumns.includes(key)) {
          // convert date-like fields
          if (key === 'testeHidraulico' || key === 'proximoTesteHidraulico') {
            data[key] = sanitizedBody[key] ? new Date(sanitizedBody[key]) : null;
          } else {
            data[key] = sanitizedBody[key];
          }
        }
      }
    }

    let cilindro;
    // Attempt upsert with progressive retries removing unknown args reported by Prisma
    const maxAttempts = 6;
    let attempt = 0;
    // Prepare update payload (do not include id/createdAt)
    const updateData = { ...data };
    delete (updateData as any).id;
    delete (updateData as any).createdAt;
    delete (updateData as any).updatedAt;
    while (attempt < maxAttempts) {
      try {
        cilindro = await prisma.cilindro.upsert({
          where: { numeroSerie: sanitizedBody.numeroSerie },
          create: data,
          update: updateData,
          include: {
            certificados: true,
            historicoInspecoes: true,
          },
        });
        break;
      } catch (createErr: any) {
        const msg = String(createErr?.message || createErr || '');
        console.error('Erro ao upsert cilindro (Prisma):', msg);
        const unknownMatch = msg.match(/Unknown argument `([^`]+)`/);
        if (unknownMatch && unknownMatch[1]) {
          const unknownKey = unknownMatch[1];
          console.warn('Removing unknown key and retrying upsert:', unknownKey);
          delete data[unknownKey];
          delete (updateData as any)[unknownKey];
          attempt++;
          continue;
        }
        console.warn('Prisma.upsert failed with non-unknown-argument error, will attempt raw insert fallback');
        break;
      }
    }
    // If prisma.create failed to produce a cilindro, try a safe raw INSERT using detected table columns
    if (!cilindro) {
      try {
        if (!tableColumns) {
          console.warn('Table columns not detected; cannot perform raw insert safely.');
          return NextResponse.json({ error: 'Erro ao criar cilindro' }, { status: 500 });
        }
        let insertCols = tableColumns.filter((c) => c in sanitizedBody);
        // Ensure required/PK columns are included and not null
        if (tableColumns.includes('id') && !insertCols.includes('id')) {
          insertCols.unshift('id');
        }
        if (tableColumns.includes('numeroSerie') && !insertCols.includes('numeroSerie')) {
          insertCols.push('numeroSerie');
        }
        if (tableColumns.includes('updatedAt') && !insertCols.includes('updatedAt')) {
          insertCols.push('updatedAt');
        }
        // exclude auto-managed columns that should not be set explicitly
        const excluded = new Set(['numeroReferencia']);
        insertCols = insertCols.filter((c) => !excluded.has(c));

        // Build a safely escaped VALUES list for the insert (dev fallback)
        const escapeVal = (v: any) => {
          if (v === null || v === undefined) return 'NULL';
          if (v instanceof Date) return `'${v.toISOString().replace(/'/g, "''")}'`;
          return `'${String(v).replace(/'/g, "''")}'`;
        };

        const valuesForCol = (col: string) => {
          if (sanitizedBody[col] !== undefined && sanitizedBody[col] !== null) return sanitizedBody[col];
          if (col === 'id') return randomUUID();
          if (col === 'updatedAt' || col === 'createdAt') return new Date();
          return null;
        };

        const quotedCols = insertCols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(', ');
        const valsList = insertCols.map((c) => escapeVal(valuesForCol(c))).join(', ');
        const sql = `INSERT INTO cilindros (${quotedCols}) VALUES (${valsList})`;
        const res: any = await prisma.$executeRawUnsafe(sql);
        // Fetch back the inserted row by numeroSerie using a parameterized tagged template
        const fetched: any = await prisma.$queryRaw`SELECT * FROM cilindros WHERE "numeroSerie" = ${sanitizedBody.numeroSerie} LIMIT 1`;
        cilindro = Array.isArray(fetched) && fetched.length > 0 ? fetched[0] : null;
      } catch (rawInsertErr: any) {
        console.error('Raw insert failed:', rawInsertErr);
        const msg = String(rawInsertErr?.message || rawInsertErr || '');
        // If uniqueness violation on numeroSerie, return the existing record instead of failing
        if (msg.includes('already exists') || msg.includes('UNIQUE') || rawInsertErr?.code === '23505' || rawInsertErr?.code === 'P2002') {
          try {
            const existing: any = await prisma.$queryRaw`SELECT * FROM cilindros WHERE "numeroSerie" = ${sanitizedBody.numeroSerie} LIMIT 1`;
            const row = Array.isArray(existing) && existing.length > 0 ? existing[0] : null;
            if (row) return NextResponse.json(row, { status: 200 });
          } catch (e) {
            console.warn('Failed to fetch existing cilindro after duplicate error:', e);
          }
          return NextResponse.json({ error: 'Já existe um cilindro com este número de série' }, { status: 400 });
        }
        // Try to fetch table info to help debugging
        let info: any = null;
        try {
          info = await prisma.$queryRawUnsafe(`PRAGMA table_info('cilindros')`);
        } catch (e) {
          info = null;
        }
        return NextResponse.json({ error: 'Erro ao criar cilindro' }, { status: 500 });
      }
    }

    // Criar item de stock correspondente ao cilindro (se não existir)
    try {
      const codigoStock = String(sanitizedBody.numeroSerie);
      const existingItem = await prisma.itemStock.findUnique({ where: { codigo: codigoStock } });
      if (!existingItem) {
        await prisma.itemStock.create({
          data: {
            nome: `Cilindro ${codigoStock}`,
            categoria: 'Cilindros',
            unidade: 'unidade',
            quantidadeAtual: 1,
            quantidadeMinima: 0,
            codigo: codigoStock,
            descricao: `Cilindro criado a partir do módulo Cilindros. Série: ${codigoStock}`,
            observacoes: body.observacoes || null,
          }
        });
      }
    } catch (stockErr) {
      console.error('Falha ao criar item de stock para o cilindro:', stockErr);
      // Não falhar a criação do cilindro por causa de stock — apenas logamos
    }

    const statusCode = alreadyExisted ? 200 : 201;
    return NextResponse.json(cilindro, { status: statusCode });
  } catch (error) {
    console.error('Erro ao criar cilindro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}