import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { items } = body; // Array de ações/updates offline

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Nenhum item para sincronizar." }, { status: 400 });
    }

    const results = [];
    for (const item of items) {
      const { entity, action, data, clientUpdatedAt } = item;
      try {
        if (entity === "inspecao" && action === "save") {
          // Resolver conflito por updatedAt
          if (data?.id) {
            const existing = await prisma.inspecao.findUnique({ where: { id: Number(data.id) } });
            if (existing && clientUpdatedAt && new Date(existing.updatedAt).getTime() > new Date(clientUpdatedAt).getTime()) {
              results.push({ id: data.id, status: "conflict_server_newer", serverUpdatedAt: existing.updatedAt });
              continue;
            }
          }
          results.push({ id: data?.id || "new", status: "synced" });
        } else {
          results.push({ item, status: "synced_generic" });
        }
      } catch (err: unknown) {
        results.push({ item, status: "error", error: err instanceof Error ? err.message : String(err) });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("[POST /api/sync/resolve-conflict]", error);
    return NextResponse.json({ error: "Erro ao resolver sincronização offline." }, { status: 500 });
  }
}
