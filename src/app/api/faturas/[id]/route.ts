import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";
import { atualizarPagamentoStatusFatura, FaturamentoError } from "@/lib/faturamento";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const faturaId = Number(rawId);
    if (!Number.isFinite(faturaId) || faturaId <= 0) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const pagamentoStatus = body && typeof body.pagamentoStatus === "string" ? body.pagamentoStatus.trim() : null;
    if (!pagamentoStatus) {
      return NextResponse.json({ error: "Estado de pagamento em falta." }, { status: 400 });
    }
    const valorPago = typeof body?.valorPago === "number" ? body.valorPago : Number(body?.valorPago);

    const fatura = await atualizarPagamentoStatusFatura({
      faturaId,
      pagamentoStatus,
      valorPago,
      emitidaPor: access.email || "sistema",
    });

    return NextResponse.json({ fatura, numeroRecibo: null });
  } catch (error) {
    if (error instanceof FaturamentoError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[PATCH /api/faturas/[id]]", error);
    return buildDatabaseErrorResponse(error, "Erro ao atualizar estado de pagamento.");
  }
}
