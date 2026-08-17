import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { logAuditoria } from "@/lib/auditoria";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!access.isAdmin) {
      return NextResponse.json({ error: "Sem permissão para eliminar ordens de serviço." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const rawIds = Array.isArray(body?.ids) ? (body.ids as unknown[]) : [];
    const ids: number[] = [];
    for (const value of rawIds) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0 && !ids.includes(n)) ids.push(n);
    }
    if (ids.length === 0) {
      return NextResponse.json({ error: "Indique pelo menos uma ordem de serviço." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const links = await tx.faturaOrdemServico.findMany({
        where: { ordemServicoId: { in: ids } },
        select: { faturaId: true },
      });
      const faturaIds = [...new Set(links.map((l) => l.faturaId))];

      await tx.faturaOrdemServico.deleteMany({ where: { ordemServicoId: { in: ids } } });
      await tx.serviceStationQueue.updateMany({
        where: { ordemServicoId: { in: ids } },
        data: { ordemServicoId: null },
      });

      const deleted = await tx.ordemServico.deleteMany({ where: { id: { in: ids } } });

      const orphaned = faturaIds.length
        ? await tx.fatura.findMany({
            where: { id: { in: faturaIds }, ordemServicos: { none: {} } },
            select: { id: true, numeroFatura: true },
          })
        : [];
      if (orphaned.length > 0) {
        await tx.fatura.deleteMany({ where: { id: { in: orphaned.map((f) => f.id) } } });
      }

      return { count: deleted.count, faturasOrfas: orphaned.map((f) => f.numeroFatura) };
    });

    await logAuditoria({
      tabela: "OrdemServico",
      tipoOperacao: "DELETE",
      idRegisto: ids[0],
      descricao: `Eliminação em lote de ${result.count} ordem(ns) de serviço${result.faturasOrfas.length ? `; faturas órfãs também removidas: ${result.faturasOrfas.join(", ")}` : ""}.`,
      usuario: access.email,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      faturasOrfasEliminadas: result.faturasOrfas,
    });
  } catch (error) {
    console.error("[POST /api/ordens-servico/bulk-delete]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao eliminar ordens de serviço." },
      { status: 500 },
    );
  }
}
