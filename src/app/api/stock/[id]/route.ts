import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeStockValidityValue, stockItemSupportsValidity } from "@/lib/stock-validity";
import { isFoodRationsLike, normalizeStockReferenceByRule } from "@/lib/stock-reference-rules";
import { normalizeStockCategory } from "@/lib/stock-categories";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";
import {
  getStockApplicabilityTypes,
  getStockValidityManualMode,
  parseStockValidityManualInput,
  upsertStockMetadataInObservacoes,
} from "@/lib/stock-metadata";

type StockOperationCacheEntry = {
  expiresAt: number;
  response: unknown;
};

const globalWithStockOperationCache = globalThis as typeof globalThis & {
  __stockOperationCache?: Map<string, StockOperationCacheEntry>;
};

const stockOperationCache =
  globalWithStockOperationCache.__stockOperationCache ?? new Map<string, StockOperationCacheEntry>();

if (!globalWithStockOperationCache.__stockOperationCache) {
  globalWithStockOperationCache.__stockOperationCache = stockOperationCache;
}

function canViewStock(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/stock") || canEditPath(access.permissions, "/stock");
}

function canEditStock(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canEditPath(access.permissions, "/stock");
}

function cleanupExpiredStockOperationCache(now: number) {
  for (const [key, entry] of stockOperationCache.entries()) {
    if (entry.expiresAt <= now) {
      stockOperationCache.delete(key);
    }
  }
}

function parseIdParam(value: unknown): number {
  const id = Number(value);
  return Number.isFinite(id) ? id : NaN;
}

function normalizeStockPayload(input: any) {
  const nome = String(input?.nome || input?.descricao || "").trim();
  const referenciaBase = String(input?.referencia || "").trim();
  const categoriaOriginal = input?.categoria;
  const categoria = normalizeStockCategory(categoriaOriginal, nome || input?.descricao);
  const referencia = normalizeStockReferenceByRule(
    referenciaBase,
    nome,
    input?.descricao,
    categoriaOriginal,
    input?.observacoes
  );
  const validadeManualInput = parseStockValidityManualInput(input?.validadeAplicavelManual ?? input?.validadeAplicavel);
  const observacoesComMeta = upsertStockMetadataInObservacoes(input?.observacoes, {
    validadeAplicavel: validadeManualInput,
    aplicavelTipos: input?.aplicavelTipos,
  });
  const validadeManual = parseStockValidityManualInput(input?.validadeAplicavelManual ?? input?.validadeAplicavel);
  const supportsValidity = stockItemSupportsValidity({
    nome,
    descricao: input?.descricao,
    categoria: categoriaOriginal,
    codigoFabricante: input?.codigoFabricante,
    referencia,
    observacoes: observacoesComMeta,
  });
  const supportsValidityFinal = validadeManual == null ? supportsValidity : validadeManual;

  return {
    referencia,
    descricao: nome || "Item sem descrição",
    estadoArtigo: input?.estadoArtigo ? String(input.estadoArtigo) : "ATIVO",
    referenciaSubstituta: input?.referenciaSubstituta ? String(input.referenciaSubstituta) : null,
    categoria,
    associavelJangada: Boolean(input?.associavelJangada),
    aplicavelMarcaJangada: input?.aplicavelMarcaJangada ? String(input.aplicavelMarcaJangada) : null,
    aplicavelModeloJangada: input?.aplicavelModeloJangada ? String(input.aplicavelModeloJangada) : null,
    precoCompra: input?.precoCompra === "" || input?.precoCompra == null ? null : Number(input.precoCompra),
    codigoFabricante: input?.codigoFabricante ? String(input.codigoFabricante) : null,
    inventario: input?.inventario ? String(input.inventario) : null,
    lote: input?.lote ? String(input.lote) : null,
    validade: supportsValidityFinal ? normalizeStockValidityValue(input?.validade) : null,
    testeHidraulico: input?.testeHidraulico ? String(input.testeHidraulico) : null,
    estadoCargaCilindro: input?.estadoCargaCilindro ? String(input.estadoCargaCilindro).toUpperCase() : null,
    precoVenda: Number(input?.precoVenda ?? 0),
    quantidade: Number(input?.quantidade ?? 0),
    observacoes: observacoesComMeta,
  };
}

function hasOwn(input: any, key: string) {
  return Object.prototype.hasOwnProperty.call(input || {}, key);
}

function normalizePartialStockPayload(input: any, currentObservacoes?: string | null) {
  const data: Record<string, unknown> = {};
  const nome = hasOwn(input, "nome") || hasOwn(input, "descricao")
    ? String(input?.nome || input?.descricao || "").trim()
    : undefined;
  const categoriaOriginal = hasOwn(input, "categoria") ? input?.categoria : undefined;
  const categoriaNormalizada = hasOwn(input, "categoria") ? normalizeStockCategory(input?.categoria, nome || input?.descricao) : undefined;
  const referenciaNormalizada = normalizeStockReferenceByRule(
    hasOwn(input, "referencia") ? input?.referencia : undefined,
    nome,
    hasOwn(input, "descricao") ? input?.descricao : undefined,
    categoriaOriginal,
    hasOwn(input, "observacoes") ? input?.observacoes : undefined
  );
  const observacoesForMeta = hasOwn(input, "observacoes") ? input?.observacoes : currentObservacoes;
  const validadeManualInput = parseStockValidityManualInput(input?.validadeAplicavelManual ?? input?.validadeAplicavel);
  const observacoesComMeta = upsertStockMetadataInObservacoes(observacoesForMeta, {
    validadeAplicavel: validadeManualInput,
    aplicavelTipos: hasOwn(input, "aplicavelTipos") ? input?.aplicavelTipos : undefined,
  });
  const validadeManual = parseStockValidityManualInput(input?.validadeAplicavelManual ?? input?.validadeAplicavel);
  const supportsValidity = stockItemSupportsValidity({
    nome,
    descricao: hasOwn(input, "descricao") ? input?.descricao : undefined,
    categoria: categoriaOriginal,
    codigoFabricante: hasOwn(input, "codigoFabricante") ? input?.codigoFabricante : undefined,
    referencia: referenciaNormalizada,
    observacoes: observacoesComMeta,
  });
  const supportsValidityFinal = validadeManual == null ? supportsValidity : validadeManual;

  if (hasOwn(input, "nome") || hasOwn(input, "descricao")) {
    data.descricao = nome || "Item sem descrição";
  }
  if (
    hasOwn(input, "referencia") ||
    isFoodRationsLike(
      nome,
      hasOwn(input, "descricao") ? input?.descricao : undefined,
      hasOwn(input, "categoria") ? input?.categoria : undefined,
      hasOwn(input, "observacoes") ? input?.observacoes : undefined,
      hasOwn(input, "referencia") ? input?.referencia : undefined
    )
  ) {
    data.referencia = referenciaNormalizada;
  }
  if (hasOwn(input, "estadoArtigo")) data.estadoArtigo = input?.estadoArtigo ? String(input.estadoArtigo) : "ATIVO";
  if (hasOwn(input, "referenciaSubstituta")) data.referenciaSubstituta = input?.referenciaSubstituta ? String(input.referenciaSubstituta) : null;
  if (hasOwn(input, "categoria")) data.categoria = categoriaNormalizada;
  if (hasOwn(input, "associavelJangada")) data.associavelJangada = Boolean(input?.associavelJangada);
  if (hasOwn(input, "aplicavelMarcaJangada")) data.aplicavelMarcaJangada = input?.aplicavelMarcaJangada ? String(input.aplicavelMarcaJangada) : null;
  if (hasOwn(input, "aplicavelModeloJangada")) data.aplicavelModeloJangada = input?.aplicavelModeloJangada ? String(input.aplicavelModeloJangada) : null;
  if (hasOwn(input, "precoCompra")) data.precoCompra = input?.precoCompra === "" || input?.precoCompra == null ? null : Number(input.precoCompra);
  if (hasOwn(input, "codigoFabricante")) data.codigoFabricante = input?.codigoFabricante ? String(input.codigoFabricante) : null;
  if (hasOwn(input, "inventario")) data.inventario = input?.inventario ? String(input.inventario) : null;
  if (hasOwn(input, "lote")) data.lote = input?.lote ? String(input.lote) : null;
  if (hasOwn(input, "validade")) data.validade = supportsValidityFinal ? normalizeStockValidityValue(input?.validade) : null;
  if (hasOwn(input, "testeHidraulico")) data.testeHidraulico = input?.testeHidraulico ? String(input.testeHidraulico) : null;
  if (hasOwn(input, "estadoCargaCilindro")) data.estadoCargaCilindro = input?.estadoCargaCilindro ? String(input.estadoCargaCilindro).toUpperCase() : null;
  if (hasOwn(input, "precoVenda")) data.precoVenda = Number(input?.precoVenda ?? 0);
  if (hasOwn(input, "quantidade")) data.quantidade = Number(input?.quantidade ?? 0);
  if (hasOwn(input, "quantidadeMinima")) data.quantidadeMinima = input?.quantidadeMinima != null ? Number(input.quantidadeMinima) : null;
  if (hasOwn(input, "localizacao")) data.localizacao = input?.localizacao ? String(input.localizacao) : null;
  if (hasOwn(input, "observacoes") || hasOwn(input, "validadeAplicavelManual") || hasOwn(input, "validadeAplicavel") || hasOwn(input, "aplicavelTipos")) {
    data.observacoes = observacoesComMeta;
  }
  if (hasOwn(input, "foto")) data.foto = input?.foto ? String(input.foto) : null;

  return data;
}

function mapStockItemResponse(item: any) {
  return {
    ...item,
    nome: item.descricao,
    categoria: normalizeStockCategory(item.categoria, item.descricao),
    validadeAplicavelManual: getStockValidityManualMode(item.observacoes),
    aplicavelTipos: getStockApplicabilityTypes(item.observacoes),
  };
}

// GET /api/stock/[id] - Buscar artigo individual do stock
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 });
    }
    if (!canViewStock(access)) {
      return NextResponse.json({ error: 'Sem permissão para consultar stock.' }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const id = parseIdParam(rawId);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'ID inválido para consultar stock' }, { status: 400 });
    }

    const item = await prisma.stock.findUnique({
      where: { id },
      select: {
        id: true,
        referencia: true,
        descricao: true,
        estadoArtigo: true,
        referenciaSubstituta: true,
        categoria: true,
        associavelJangada: true,
        aplicavelMarcaJangada: true,
        aplicavelModeloJangada: true,
        precoCompra: true,
        codigoFabricante: true,
        inventario: true,
        lote: true,
        validade: true,
        testeHidraulico: true,
        estadoCargaCilindro: true,
        precoVenda: true,
        quantidade: true,
        quantidadeMinima: true,
        localizacao: true,
        observacoes: true,
        foto: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
    }

    return NextResponse.json(mapStockItemResponse(item));
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar artigo de stock', details: error }, { status: 500 });
  }
}

// PUT /api/stock/[id] - Atualiza artigo do stock
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 });
    }
    if (!canEditStock(access)) {
      return NextResponse.json({ error: 'Sem permissão para editar stock.' }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const id = parseIdParam(rawId);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'ID inválido para atualizar stock' }, { status: 400 });
    }

    const body = await req.json();

    if (body?.operacao === "entrada" || body?.operacao === "saida") {
      const valor = Math.max(1, Number(body?.valor ?? 1));
      const idemHeader = String(req.headers.get("idempotency-key") || "").trim();
      const idemBody = String(body?.idempotencyKey || body?.requestId || "").trim();
      const idempotencyKey = (idemHeader || idemBody).slice(0, 120);
      const fallbackFingerprint = [
        "stock-op",
        id,
        body.operacao,
        valor,
        String(body?.usuario || "").trim().toLowerCase(),
        String(body?.motivo || "").trim().toLowerCase(),
      ].join(":");
      const operationCacheKey = idempotencyKey
        ? `stock-idem:${id}:${idempotencyKey}`
        : `stock-fallback:${fallbackFingerprint}`;
      const now = Date.now();
      cleanupExpiredStockOperationCache(now);
      const cachedEntry = stockOperationCache.get(operationCacheKey);
      if (cachedEntry && cachedEntry.expiresAt > now) {
        return NextResponse.json(cachedEntry.response);
      }
      
      // Buscar quantidade atual
      const stockAtual = await prisma.stock.findUnique({
        where: { id },
        select: { quantidade: true, referencia: true, estadoCargaCilindro: true },
      });
      
      if (!stockAtual) {
        return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
      }

      const quantidadeAntes = stockAtual.quantidade;
      const quantidadeDepois = body.operacao === "entrada"
        ? quantidadeAntes + valor
        : Math.max(0, quantidadeAntes - valor);

      // Atualizar stock e criar movimentação em transação
      const [updatedByOperation] = await prisma.$transaction([
        prisma.stock.update({
          where: { id },
          data: {
            quantidade: body.operacao === "entrada"
              ? { increment: valor }
              : { decrement: valor },
            ...(hasOwn(body, "estadoCargaCilindro")
              ? { estadoCargaCilindro: body?.estadoCargaCilindro ? String(body.estadoCargaCilindro).toUpperCase() : null }
              : {}),
          },
        }),
        prisma.movimentacaoStock.create({
          data: {
            stockId: id,
            tipo: body.operacao,
            quantidade: valor,
            quantidadeAntes,
            quantidadeDepois,
            motivo: body.motivo || null,
            usuario: body.usuario || null,
          },
        }),
      ]);

      stockOperationCache.set(operationCacheKey, {
        response: updatedByOperation,
        expiresAt: now + 15_000,
      });
      
      return NextResponse.json(updatedByOperation);
    }

    const current = await prisma.stock.findUnique({ where: { id }, select: { observacoes: true } });
    const data = normalizePartialStockPayload(body, current?.observacoes ?? null);
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar stock' }, { status: 400 });
    }

    const updated = await prisma.stock.update({
      where: { id },
      data,
    });
    return NextResponse.json(mapStockItemResponse(updated));
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar stock', details: error }, { status: 500 });
  }
}

// DELETE /api/stock/[id] - Remove artigo do stock
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 });
    }
    if (!canEditStock(access)) {
      return NextResponse.json({ error: 'Sem permissão para editar stock.' }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const id = parseIdParam(rawId);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'ID inválido para eliminar stock' }, { status: 400 });
    }

    await prisma.stock.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Item de stock não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao eliminar stock', details: error }, { status: 500 });
  }
}
