import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";
import { invalidateApiCache } from "@/lib/api-cache";

function canView(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/stock") || canEditPath(access.permissions, "/stock");
}
function canEdit(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canEditPath(access.permissions, "/stock");
}

async function nextPedidoNumero() {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;
  const existing = await prisma.pedidoReposicao.findMany({
    where: { numero: { startsWith: prefix } },
    select: { numero: true },
  });
  let max = 0;
  for (const row of existing) {
    const suffix = String(row.numero || "").slice(prefix.length);
    const n = Number(suffix);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!canView(access)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

    const status = String(new URL(req.url).searchParams.get("status") || "").trim();
    const pedidos = await prisma.pedidoReposicao.findMany({
      where: status ? { status } : undefined,
      include: {
        linhas: {
          include: { stock: { select: { id: true, referencia: true, quantidade: true, localizacao: true } } },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ pedidos });
  } catch (error) {
    console.error("[GET pedidos-reposicao]", error);
    return NextResponse.json({ error: "Erro ao listar pedidos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!canEdit(access)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

    const body = (await req.json()) as {
      fornecedor?: string;
      notas?: string;
      linhas?: Array<{
        stockId?: number;
        referencia?: string;
        descricao?: string;
        fornecedor?: string;
        quantidadePedida?: number;
        precoUnitario?: number;
      }>;
    };

    const linhasIn = Array.isArray(body.linhas) ? body.linhas : [];
    const linhas = linhasIn
      .map((l) => ({
        stockId: Number(l.stockId || 0) || null,
        referencia: String(l.referencia || "").trim() || null,
        descricao: String(l.descricao || l.referencia || "Artigo").trim() || "Artigo",
        fornecedor: String(l.fornecedor || body.fornecedor || "").trim() || null,
        quantidadePedida: Math.max(1, Math.floor(Number(l.quantidadePedida) || 1)),
        precoUnitario: Math.max(0, Number(l.precoUnitario) || 0),
      }))
      .filter((l) => l.quantidadePedida > 0);

    if (!linhas.length) {
      return NextResponse.json({ error: "Adicione pelo menos uma linha." }, { status: 400 });
    }

    const totalEstimado = linhas.reduce((acc, l) => acc + l.quantidadePedida * l.precoUnitario, 0);
    const numero = await nextPedidoNumero();

    const pedido = await prisma.pedidoReposicao.create({
      data: {
        numero,
        status: "rascunho",
        fornecedor: String(body.fornecedor || "").trim() || null,
        notas: String(body.notas || "").trim() || null,
        criadoPor: access.email,
        totalEstimado,
        linhas: {
          create: linhas.map((l) => ({
            stockId: l.stockId,
            referencia: l.referencia,
            descricao: l.descricao,
            fornecedor: l.fornecedor,
            quantidadePedida: l.quantidadePedida,
            precoUnitario: l.precoUnitario,
            status: "pendente",
          })),
        },
      },
      include: { linhas: true },
    });

    invalidateApiCache("stock:");
    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    console.error("[POST pedidos-reposicao]", error);
    return NextResponse.json(
      { error: "Erro ao criar pedido.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
