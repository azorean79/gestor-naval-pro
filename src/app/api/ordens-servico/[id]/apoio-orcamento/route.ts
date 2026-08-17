import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

function parseIdFromRequest(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const rawId = segments[segments.length - 2];
  const id = Number(rawId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

type ArtigoSelect = {
  id: number;
  name: string;
  quantidade: number;
  referencia: string | null;
  codigoFabricante: string | null;
  validade: Date | null;
  stock: { referencia: string; descricao: string | null } | null;
};

function artigoToDto(a: ArtigoSelect) {
  return {
    id: a.id,
    name: a.name,
    quantidade: a.quantidade,
    referencia: a.referencia,
    referenciaExibida: a.stock?.referencia || a.referencia || "",
    descricao: a.stock?.descricao || a.name,
    codigoFabricante: a.codigoFabricante,
    validade: a.validade ? a.validade.toISOString().slice(0, 10) : null,
  };
}

type StockItemSelect = {
  id: number;
  referencia: string;
  descricao: string;
  precoVenda: number;
};

function stockItemToDto(s: StockItemSelect) {
  return {
    id: s.id,
    referencia: s.referencia,
    descricao: s.descricao,
    precoVenda: s.precoVenda,
  };
}

function parseYearMonth(dataProxInspecao: string | null): { year: number; month: number } | null {
  if (!dataProxInspecao) return null;
  const [y, m] = dataProxInspecao.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  return { year: y, month: m };
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const id = parseIdFromRequest(req);
    if (!id) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const ordem = await prisma.ordemServico.findUnique({
      where: { id },
      select: { jangadaId: true, ordemJangadas: { select: { jangada: { select: { id: true } } } } },
    });

    if (!ordem) {
      return NextResponse.json({ error: "Ordem não encontrada." }, { status: 404 });
    }

    // Resolve jangadaId: prefer direct FK, fallback to junction table
    const resolvedJangadaId = ordem.jangadaId || ordem.ordemJangadas?.[0]?.jangada?.id || null;

    if (!resolvedJangadaId) {
      const stock = await prisma.stock.findMany({
        orderBy: [{ descricao: "asc" }, { referencia: "asc" }],
        select: { id: true, referencia: true, descricao: true, precoVenda: true },
      });
      return NextResponse.json({
        artigosJangada: [],
        ultimaInspecao: null,
        dataProxInspecao: null,
        stock: stock.map(stockItemToDto),
      });
    }

    // Fetch all articles on the jangada (active or archived) — the budget editor needs to see them all
    const [jangada, ultimaInspecao, stock] = await Promise.all([
      prisma.jangada.findUnique({
        where: { id: resolvedJangadaId },
        select: {
          id: true,
          serial: true,
          dataProxInspecao: true,
          artigos: {
            orderBy: [{ inspecaoId: "desc" }, { name: "asc" }, { id: "asc" }],
            select: {
              id: true,
              name: true,
              quantidade: true,
              referencia: true,
              codigoFabricante: true,
              validade: true,
              inspecaoId: true,
              stock: { select: { referencia: true, descricao: true } },
            },
          },
        },
      }),
      prisma.inspecao.findFirst({
        where: { jangadaId: resolvedJangadaId },
        orderBy: [{ dataInspecao: "desc" }, { id: "desc" }],
        select: {
          id: true,
          certificadoNumero: true,
          dataInspecao: true,
          dataProxInspecao: true,
          artigos: {
            orderBy: [{ name: "asc" }, { id: "asc" }],
            select: {
              id: true,
              name: true,
              quantidade: true,
              referencia: true,
              codigoFabricante: true,
              validade: true,
              stock: { select: { referencia: true, descricao: true } },
            },
          },
        },
      }),
      prisma.stock.findMany({
        orderBy: [{ descricao: "asc" }, { referencia: "asc" }],
        select: {
          id: true,
          referencia: true,
          descricao: true,
          precoVenda: true,
        },
      }),
    ]);

    if (!jangada) {
      return NextResponse.json({
        artigosJangada: [],
        ultimaInspecao: null,
        dataProxInspecao: null,
        stock: stock.map(stockItemToDto),
      });
    }

    const dataProxInspecao = jangada.dataProxInspecao || ultimaInspecao?.dataProxInspecao || null;
    const proxRef = parseYearMonth(dataProxInspecao);

    // Deduplicate articles: prefer active (inspecaoId: null), then latest archived
    const seenByName = new Map<string, typeof jangada.artigos[0]>();
    for (const a of jangada.artigos) {
      const key = `${a.name.trim().toUpperCase()}|${(a.referencia || "").trim().toUpperCase()}`;
      const existing = seenByName.get(key);
      if (!existing) {
        seenByName.set(key, a);
      } else if (existing.inspecaoId !== null && a.inspecaoId === null) {
        // Active article wins over archived
        seenByName.set(key, a);
      }
    }
    const uniqueArtigos = Array.from(seenByName.values());

    const artigosJangada = uniqueArtigos.map((a) => {
      let previstoSubstituir = false;
      if (proxRef && a.validade) {
        const v = new Date(a.validade);
        const valKey = v.getFullYear() * 12 + v.getMonth();
        const proxKey = proxRef.year * 12 + (proxRef.month - 1);
        previstoSubstituir = valKey < proxKey;
      }
      return { ...artigoToDto(a), previstoSubstituir };
    });

    return NextResponse.json({
      artigosJangada,
      ultimaInspecao: ultimaInspecao
        ? {
            id: ultimaInspecao.id,
            certificadoNumero: ultimaInspecao.certificadoNumero,
            dataInspecao: ultimaInspecao.dataInspecao,
            dataProxInspecao: ultimaInspecao.dataProxInspecao,
            artigos: ultimaInspecao.artigos.map(artigoToDto),
          }
        : null,
      dataProxInspecao,
      stock: stock.map(stockItemToDto),
    });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao carregar apoio do orçamento.");
  }
}
