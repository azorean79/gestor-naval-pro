import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeStockValidityValue, stockItemSupportsValidity } from "@/lib/stock-validity";
import { normalizeStockReferenceByRule } from "@/lib/stock-reference-rules";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";
import { normalizeStockCategory } from "@/lib/stock-categories";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";
import { beginApiRequest, captureApiError, finishApiRequest, withRequestId } from '@/lib/observability';
import fs from "node:fs";
import path from "node:path";

type ManualPart = {
  part_number?: string;
  source_page?: number;
};

let manualPartToPhotoUrlCache: Map<string, string> | null = null;

function canViewStock(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/stock") || canEditPath(access.permissions, "/stock");
}

function canEditStock(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canEditPath(access.permissions, "/stock");
}

function slugifyPhotoSegment(value?: string | null): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildUploadedPhotoUrl(item: { referencia?: string | null; codigoFabricante?: string | null }): string | null {
  const referencia = String(item.referencia || "").trim();
  const brandSlug = slugifyPhotoSegment(item.codigoFabricante);
  if (!referencia || !brandSlug) return null;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", brandSlug);
  if (!fs.existsSync(uploadsDir)) return null;

  const extensions = [".jpg", ".jpeg", ".png", ".webp"];
  const namesToTry = Array.from(
    new Set([
      referencia,
      referencia.toLowerCase(),
      referencia.toUpperCase(),
      slugifyPhotoSegment(referencia),
    ].filter(Boolean))
  );

  for (const baseName of namesToTry) {
    for (const extension of extensions) {
      const absolutePath = path.join(uploadsDir, `${baseName}${extension}`);
      if (fs.existsSync(absolutePath)) {
        return `/uploads/${brandSlug}/${baseName}${extension}`;
      }
    }
  }

  return null;
}

function buildManualPhotoUrlFromPartNumber(partNumber?: string | null): string | null {
  const normalized = String(partNumber || "").trim();
  if (!normalized) return null;

  if (!manualPartToPhotoUrlCache) {
    manualPartToPhotoUrlCache = new Map<string, string>();
    
    // Processar manual MK IV
    try {
      const jsonPath = path.join(process.cwd(), "tmp_mkiv_parts.json");
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const parts = JSON.parse(raw) as ManualPart[];
        for (const part of parts) {
          const pn = String(part?.part_number || "").trim();
          const page = Number(part?.source_page || 0);
          if (!pn || !Number.isFinite(page) || page <= 0) continue;
          if (manualPartToPhotoUrlCache.has(pn)) continue;
          
          // Tentar foto individual MK IV
          const individualImgPath = path.join(process.cwd(), "public", "manual-parts", `${pn}.jpg`);
          if (fs.existsSync(individualImgPath)) {
            manualPartToPhotoUrlCache.set(pn, `/manual-parts/${pn}.jpg`);
            continue;
          }
          
          // Fallback para página MK IV
          const imgName = `page_${String(page).padStart(4, "0")}.jpg`;
          manualPartToPhotoUrlCache.set(
            pn,
            `/api/manuais-assets/Service_Manual_Marine_MK_IV_PT_HTML/assets/${imgName}`
          );
        }
      }
    } catch {
      // Ignorar erros no MK IV
    }
    
    // Processar manual LR97
    try {
      const jsonPathLR97 = path.join(process.cwd(), "tmp_lr97_parts.json");
      if (fs.existsSync(jsonPathLR97)) {
        const raw = fs.readFileSync(jsonPathLR97, "utf-8");
        const parts = JSON.parse(raw) as ManualPart[];
        for (const part of parts) {
          const pn = String(part?.part_number || "").trim();
          const page = Number(part?.source_page || 0);
          if (!pn || !Number.isFinite(page) || page <= 0) continue;
          if (manualPartToPhotoUrlCache.has(pn)) continue;
          
          // Tentar foto individual LR97
          const individualImgPathLR97 = path.join(process.cwd(), "public", "manual-parts-lr97", `${pn}.jpg`);
          if (fs.existsSync(individualImgPathLR97)) {
            manualPartToPhotoUrlCache.set(pn, `/manual-parts-lr97/${pn}.jpg`);
          }
        }
      }
    } catch {
      // Ignorar erros no LR97
    }
  }

  return manualPartToPhotoUrlCache.get(normalized) || null;
}

function normalizeStockPayload(input: any) {
  const nome = String(input?.nome || input?.descricao || "").trim();
  const referenciaBase = String(input?.referencia || "").trim();
  const categoriaOriginal = input?.categoria;
  const categoria = normalizeStockCategory(categoriaOriginal, nome || input?.descricao);
  const referenciaNormalizada = normalizeStockReferenceByRule(
    referenciaBase,
    nome,
    input?.descricao,
    categoriaOriginal,
    input?.observacoes
  );
  const referencia = referenciaNormalizada || `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const supportsValidity = stockItemSupportsValidity({
    nome,
    descricao: input?.descricao,
    categoria: categoriaOriginal,
    codigoFabricante: input?.codigoFabricante,
    referencia,
    observacoes: input?.observacoes,
  });

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
    validade: supportsValidity ? normalizeStockValidityValue(input?.validade) : null,
    testeHidraulico: input?.testeHidraulico ? String(input.testeHidraulico) : null,
    estadoCargaCilindro: input?.estadoCargaCilindro ? String(input.estadoCargaCilindro).toUpperCase() : null,
    precoVenda: Number(input?.precoVenda ?? 0),
    quantidade: Number(input?.quantidade ?? 0),
    quantidadeMinima: input?.quantidadeMinima == null || input?.quantidadeMinima === "" ? null : Number(input.quantidadeMinima),
    codigoBarras: input?.codigoBarras ? String(input.codigoBarras).trim() : null,
  };
}

function normalizeCylinderSerialKey(value: unknown): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

async function findDuplicateCylinderStock(payload: ReturnType<typeof normalizeStockPayload>) {
  if (normalizeStockCategory(payload.categoria, payload.descricao) !== "CILINDROS") return null;

  const refKey = normalizeCylinderSerialKey(payload.referencia);
  const manufacturerKey = normalizeCylinderSerialKey(payload.codigoFabricante);
  if (!refKey && !manufacturerKey) return null;

  const candidates = await prisma.stock.findMany({
    where: {
      categoria: { equals: "CILINDROS", mode: "insensitive" },
    },
    select: {
      id: true,
      referencia: true,
      codigoFabricante: true,
    },
    take: 5000,
  });

  return (
    candidates.find((item) => {
      const itemRefKey = normalizeCylinderSerialKey(item.referencia);
      const itemManufacturerKey = normalizeCylinderSerialKey(item.codigoFabricante);
      if (!itemRefKey && !itemManufacturerKey) return false;

      if (refKey && (itemRefKey === refKey || itemManufacturerKey === refKey)) return true;
      if (manufacturerKey && (itemRefKey === manufacturerKey || itemManufacturerKey === manufacturerKey)) return true;
      return false;
    }) || null
  );
}

export async function GET(req: NextRequest) {
  const context = beginApiRequest(req, 'stock');
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init);
    finishApiRequest(context, response.status, extra);
    return withRequestId(response, context);
  };

  try {
    const access = await getAccessContext();
    if (!access) {
      return respond({ error: "Sessão obrigatória." }, { status: 401 });
    }
    if (!canViewStock(access)) {
      return respond({ error: "Sem permissão para consultar stock." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const where: any = {};
    const stockScope = String(searchParams.get("stockScope") || "").trim().toLowerCase();
    const includeInactive = searchParams.get("includeInactive") === "true";
    const busca = String(searchParams.get("busca") || "").trim();
    const includeFoto = searchParams.get("includeFoto") === "true";
    const requestedTake = Number(searchParams.get("take") || 0);
    const take = Number.isFinite(requestedTake) && requestedTake > 0 ? Math.min(requestedTake, 5000) : 5000;
    const idsRaw = String(searchParams.get("ids") || "").trim();
    const refsRaw = String(searchParams.get("refs") || "").trim();

    if (idsRaw) {
      const ids = idsRaw
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0)
        .slice(0, 100);
      if (ids.length > 0) {
        where.id = { in: ids };
      }
    }

    if (refsRaw) {
      const refs = refsRaw
        .split(",")
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .slice(0, 100);
      if (refs.length > 0) {
        where.referencia = { in: refs };
      }
    }

    if (busca) {
      where.OR = [
        { referencia: { contains: busca, mode: "insensitive" } },
        { descricao: { contains: busca, mode: "insensitive" } },
        { codigoFabricante: { contains: busca, mode: "insensitive" } },
        { codigoBarras: { contains: busca, mode: "insensitive" } },
      ];
    }

    if (searchParams.get("referencia")) where.referencia = { contains: searchParams.get("referencia"), mode: "insensitive" };
    if (searchParams.get("descricao")) where.descricao = { contains: searchParams.get("descricao"), mode: "insensitive" };
    if (searchParams.get("nome")) where.descricao = { contains: searchParams.get("nome"), mode: "insensitive" };
    if (searchParams.get("categoria")) where.categoria = { contains: searchParams.get("categoria"), mode: "insensitive" };
    if (searchParams.get("validade")) where.validade = { contains: searchParams.get("validade"), mode: "insensitive" };
    if (searchParams.get("associavelJangada")) where.associavelJangada = searchParams.get("associavelJangada") === "true";
    if (searchParams.get("estadoArtigo")) {
      where.estadoArtigo = String(searchParams.get("estadoArtigo"));
    } else if (!includeInactive) {
      where.estadoArtigo = { not: "INATIVO" };
    }

    if (stockScope === "jangadas-ocean") {
      where.AND = [
        {
          OR: [
            { associavelJangada: true },
            {
              AND: [
                { aplicavelMarcaJangada: { contains: "ocean safety", mode: "insensitive" } },
                { codigoFabricante: { not: null } },
                { codigoFabricante: { not: "" } },
              ],
            },
          ],
        },
      ];
    }

    const stock = await prisma.stock.findMany({
      where,
      orderBy: { id: "desc" },
      take: (idsRaw || refsRaw) ? 100 : take,
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
        foto: includeFoto,
        codigoBarras: true,
      },
    });
    return respond(
      stock.map((item) => ({
        ...item,
        nome: item.descricao,
        categoria: normalizeStockCategory(item.categoria, item.descricao),
        foto:
          item.foto ||
          buildUploadedPhotoUrl(item) ||
          buildManualPhotoUrlFromPartNumber(item.codigoFabricante) ||
          buildManualPhotoUrlFromPartNumber(item.referencia) ||
          null,
      })),
      undefined,
      { count: stock.length }
    );
  } catch (error) {
    captureApiError(context, error);
    const response = buildDatabaseErrorResponse(error, 'Erro ao buscar stock');
    finishApiRequest(context, response.status);
    return withRequestId(response, context);
  }
}

// Permite criar stock individual ou em massa via POST
export async function POST(req: NextRequest) {
  const context = beginApiRequest(req, 'stock');
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init);
    finishApiRequest(context, response.status, extra);
    return withRequestId(response, context);
  };

  try {
    const access = await getAccessContext();
    if (!access) {
      return respond({ error: "Sessão obrigatória." }, { status: 401 });
    }
    if (!canEditStock(access)) {
      return respond({ error: "Sem permissão para editar stock." }, { status: 403 });
    }

    const body = await req.json();
    if (Array.isArray(body)) {
      // Criação em massa
      const data = body.map(normalizeStockPayload);

      for (const item of data) {
        const duplicate = await findDuplicateCylinderStock(item);
        if (duplicate) {
          return respond(
            {
              error: `Já existe um cilindro com essa referência/número de série no stock (ID ${duplicate.id}).`,
              duplicateId: duplicate.id,
            },
            { status: 409 },
          );
        }
      }

      const created = await prisma.stock.createMany({ data, skipDuplicates: true });
      return respond({ count: created.count }, undefined, { batch: true });
    } else {
      // Criação individual
      const payload = normalizeStockPayload(body);
      const duplicate = await findDuplicateCylinderStock(payload);
      if (duplicate) {
        return respond(
          {
            error: `Já existe um cilindro com essa referência/número de série no stock (ID ${duplicate.id}).`,
            duplicateId: duplicate.id,
          },
          { status: 409 },
        );
      }

      const created = await prisma.stock.create({ data: payload });
      return respond(created, undefined, { batch: false, stockId: created.id });
    }
  } catch (error) {
    captureApiError(context, error);
    const response = buildDatabaseErrorResponse(error, 'Erro ao criar stock');
    finishApiRequest(context, response.status);
    return withRequestId(response, context);
  }
}

// DELETE /api/stock - Elimina artigos em lote
export async function DELETE(req: NextRequest) {
  const context = beginApiRequest(req, 'stock');
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init);
    finishApiRequest(context, response.status, extra);
    return withRequestId(response, context);
  };

  try {
    const access = await getAccessContext();
    if (!access) {
      return respond({ error: "Sessão obrigatória." }, { status: 401 });
    }
    if (!canEditStock(access)) {
      return respond({ error: "Sem permissão para editar stock." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((value: unknown) => Number(value)).filter((value: number) => Number.isFinite(value) && value > 0)
      : [];

    if (ids.length === 0) {
      return respond({ error: "Forneça uma lista válida de IDs para eliminar." }, { status: 400 });
    }

    const result = await prisma.stock.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return respond({ success: true, count: result.count }, undefined, { deletedIds: ids.length });
  } catch (error) {
    captureApiError(context, error);
    const response = buildDatabaseErrorResponse(error, "Erro ao eliminar stock em lote");
    finishApiRequest(context, response.status);
    return withRequestId(response, context);
  }
}
