import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";
import {
  STOCK_SHELVES,
  buildShelfSummary,
  resolveShelfCode,
  suggestShelfForCategory,
} from "@/lib/stock-shelves";

function canViewStock(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/stock") || canEditPath(access.permissions, "/stock");
}

function canEditStock(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canEditPath(access.permissions, "/stock");
}

export async function GET() {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!canViewStock(access)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

    const items = await prisma.stock.findMany({
      select: {
        id: true,
        referencia: true,
        descricao: true,
        quantidade: true,
        localizacao: true,
        categoria: true,
      },
    });

    const mapped = items.map((i) => ({
      id: i.id,
      nome: i.descricao,
      referencia: i.referencia,
      quantidade: i.quantidade,
      localizacao: i.localizacao,
      categoria: i.categoria,
      shelfCode: resolveShelfCode(i.localizacao),
    }));

    const summary = buildShelfSummary(mapped);

    return NextResponse.json({
      shelfCount: STOCK_SHELVES.length,
      shelves: summary.shelves,
      unassignedCount: summary.unassignedCount,
      unassignedQuantity: summary.unassignedQuantity,
      totalItems: items.length,
    });
  } catch (error) {
    console.error("[GET /api/stock/prateleiras]", error);
    return NextResponse.json({ error: "Erro ao carregar prateleiras." }, { status: 500 });
  }
}

/** Normaliza localizações para P01–P20 e opcionalmente atribui prateleira a artigos sem localização. */
export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!canEditStock(access)) return NextResponse.json({ error: "Sem permissão para editar stock." }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) as {
      mode?: "normalize" | "auto-assign" | "both";
      dryRun?: boolean;
    };
    const mode = body.mode || "both";
    const dryRun = Boolean(body.dryRun);

    const items = await prisma.stock.findMany({
      select: { id: true, localizacao: true, categoria: true, descricao: true, referencia: true },
    });

    const changes: Array<{ id: number; from: string | null; to: string; reason: string }> = [];

    for (const item of items) {
      const current = String(item.localizacao || "").trim() || null;
      const resolved = resolveShelfCode(current);

      if (resolved && current !== resolved && (mode === "normalize" || mode === "both")) {
        changes.push({ id: item.id, from: current, to: resolved, reason: "normalize" });
        continue;
      }

      if (!resolved && (mode === "auto-assign" || mode === "both")) {
        const suggested = suggestShelfForCategory(item.categoria || item.descricao);
        changes.push({ id: item.id, from: current, to: suggested, reason: "auto-assign" });
      }
    }

    if (!dryRun && changes.length > 0) {
      await prisma.$transaction(
        changes.map((c) =>
          prisma.stock.update({
            where: { id: c.id },
            data: { localizacao: c.to },
          })
        )
      );
    }

    return NextResponse.json({
      dryRun,
      mode,
      changed: changes.length,
      sample: changes.slice(0, 30),
      shelves: STOCK_SHELVES.map((s) => s.code),
    });
  } catch (error) {
    console.error("[POST /api/stock/prateleiras]", error);
    return NextResponse.json({ error: "Erro ao organizar prateleiras." }, { status: 500 });
  }
}
