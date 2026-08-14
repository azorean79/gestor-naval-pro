import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { logAuditoria } from "@/lib/auditoria";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";
import { normalizeOrdemStatus } from "@/lib/ordens-servico";

const ALLOWED_BULK_ACTIONS = new Set(["delete", "status"]);
const CLOSED_STATUSES = new Set(["concluida", "cancelada"]);

function parseIds(body: Record<string, unknown>): number[] {
  const raw = body.ids;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "").trim().toLowerCase();
    const ids = parseIds(body);

    if (!ALLOWED_BULK_ACTIONS.has(action)) {
      return NextResponse.json({ error: "Ação em massa não suportada." }, { status: 400 });
    }
    if (ids.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos uma ordem de serviço." }, { status: 400 });
    }
    if (ids.length > 200) {
      return NextResponse.json({ error: "Limite máximo de 200 ordens por operação." }, { status: 400 });
    }

    // Verify ownership / access scope
    const existing = await prisma.ordemServico.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, numeroOrdem: true, serviceStationId: true },
    });

    if (existing.length !== ids.length) {
      const foundIds = new Set(existing.map((e) => e.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      return NextResponse.json({ error: `Ordens não encontradas: ${missing.join(", ")}.` }, { status: 404 });
    }

    // Admins can act on any station; non-admins are limited by active station context
    const allowedStationIds = access.isAdmin
      ? null
      : access.allowedStationIds.length > 0
        ? access.allowedStationIds
        : access.stationId
          ? [access.stationId]
          : [];

    if (allowedStationIds && allowedStationIds.length > 0) {
      const unauthorized = existing.filter((e) => e.serviceStationId && !allowedStationIds.includes(e.serviceStationId));
      if (unauthorized.length > 0) {
        return NextResponse.json({ error: "Sem permissão para algumas ordens selecionadas." }, { status: 403 });
      }
    }

    if (action === "delete") {
      const blocked = existing.filter((e) => !CLOSED_STATUSES.has(e.status));
      if (blocked.length > 0 && !access.isAdmin) {
        return NextResponse.json(
          { error: `Não é possível eliminar ordens abertas: ${blocked.map((b) => b.numeroOrdem).join(", ")}.` },
          { status: 400 }
        );
      }

      await prisma.ordemServico.deleteMany({ where: { id: { in: ids } } });

      for (const order of existing) {
        await logAuditoria({
          tabela: "OrdemServico",
          tipoOperacao: "DELETE",
          idRegisto: order.id,
          descricao: `Eliminação em massa: ordem ${order.numeroOrdem} (ids: ${ids.join(", ")})`,
        });
      }

      return NextResponse.json({ success: true, action, deletedCount: existing.length });
    }

    if (action === "status") {
      const newStatus = normalizeOrdemStatus(body.status);
      if (!newStatus) {
        return NextResponse.json({ error: "Novo estado inválido." }, { status: 400 });
      }

      const blocked = existing.filter((e) => CLOSED_STATUSES.has(e.status));
      if (blocked.length > 0) {
        return NextResponse.json(
          { error: `Não é possível alterar ordens concluídas/canceladas: ${blocked.map((b) => b.numeroOrdem).join(", ")}.` },
          { status: 400 }
        );
      }

      await prisma.ordemServico.updateMany({
        where: { id: { in: ids } },
        data: { status: newStatus },
      });

      for (const order of existing) {
        await logAuditoria({
          tabela: "OrdemServico",
          tipoOperacao: "UPDATE",
          idRegisto: order.id,
          descricao: `Alteração de estado em massa: ordem ${order.numeroOrdem} → ${newStatus}`,
        });
      }

      return NextResponse.json({ success: true, action, updatedCount: existing.length, newStatus });
    }

    return NextResponse.json({ error: "Ação em massa não implementada." }, { status: 400 });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro na operação em massa.");
  }
}
