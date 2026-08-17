import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { logAuditoria } from "@/lib/auditoria";

export const dynamic = "force-dynamic";

const FATURA_META_KEYS = [
  "faturaId",
  "faturaNumero",
  "faturaEmitidaEm",
  "faturaEmitidaPor",
  "pagamentoStatus",
] as const;

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!access.isAdmin) {
      return NextResponse.json({ error: "Sem permissão para eliminar faturas." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const rawIds = Array.isArray(body?.ids) ? (body.ids as unknown[]) : [];
    const ids: number[] = [];
    for (const value of rawIds) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0 && !ids.includes(n)) ids.push(n);
    }
    if (ids.length === 0) {
      return NextResponse.json({ error: "Indique pelo menos uma fatura." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const links = await tx.faturaOrdemServico.findMany({
        where: { faturaId: { in: ids } },
        select: { ordemServicoId: true },
      });
      const ordemIds = [...new Set(links.map((l) => l.ordemServicoId))];

      if (ordemIds.length > 0) {
        const ordens = await tx.ordemServico.findMany({
          where: { id: { in: ordemIds } },
          select: { id: true, metadados: true },
        });
        for (const ordem of ordens) {
          if (!ordem.metadados) continue;
          let meta: Record<string, unknown>;
          try {
            const parsed = JSON.parse(ordem.metadados);
            if (!parsed || typeof parsed !== "object") continue;
            meta = parsed as Record<string, unknown>;
          } catch {
            continue;
          }
          let changed = false;
          for (const key of FATURA_META_KEYS) {
            if (key in meta) {
              delete meta[key];
              changed = true;
            }
          }
          if (changed) {
            await tx.ordemServico.update({
              where: { id: ordem.id },
              data: { metadados: JSON.stringify(meta) },
            });
          }
        }
      }

      const deleted = await tx.fatura.deleteMany({ where: { id: { in: ids } } });
      return { count: deleted.count };
    });

    await logAuditoria({
      tabela: "Fatura",
      tipoOperacao: "DELETE",
      idRegisto: ids[0],
      descricao: `Eliminação definitiva em lote de ${result.count} fatura(s) (incluindo recibos e notas de crédito associadas).`,
      usuario: access.email,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("[POST /api/faturas/bulk-delete]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao eliminar faturas." },
      { status: 500 },
    );
  }
}
