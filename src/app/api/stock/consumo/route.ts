import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";

function canViewStock(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/stock") || canEditPath(access.permissions, "/stock");
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }
    if (!canViewStock(access)) {
      return NextResponse.json({ error: "Sem permissão para consultar stock." }, { status: 403 });
    }

    const url = new URL(req.url);
    const meses = Math.min(24, Math.max(1, parseInt(url.searchParams.get("meses") || "6", 10) || 6));
    const referencia = String(url.searchParams.get("referencia") || "").trim();

    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - meses);

    const where: Record<string, unknown> = {
      createdAt: { gte: dataLimite },
      tipo: "saida",
    };
    if (referencia) {
      where.stock = { referencia: { contains: referencia } };
    }

    const movimentos = await prisma.movimentacaoStock.findMany({
      where,
      select: {
        quantidade: true,
        createdAt: true,
        stock: { select: { id: true, referencia: true, descricao: true, categoria: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const consumo: Record<string, Record<string, { descricao: string; total: number; stockId?: number }>> = {};
    for (const m of movimentos) {
      if (!m.stock) continue;
      const mes = m.createdAt.toISOString().slice(0, 7);
      const ref = m.stock.referencia || "SEM-REF";
      if (!consumo[mes]) consumo[mes] = {};
      if (!consumo[mes][ref]) {
        consumo[mes][ref] = { descricao: m.stock.descricao || ref, total: 0, stockId: m.stock.id };
      }
      consumo[mes][ref].total += Math.abs(m.quantidade);
    }

    const totais: Record<string, { descricao: string; total: number; stockId?: number }> = {};
    for (const mes of Object.values(consumo)) {
      for (const [ref, data] of Object.entries(mes)) {
        if (!totais[ref]) totais[ref] = { descricao: data.descricao, total: 0, stockId: data.stockId };
        totais[ref].total += data.total;
      }
    }

    return NextResponse.json({
      meses,
      periodo: { inicio: dataLimite.toISOString().slice(0, 10), fim: new Date().toISOString().slice(0, 10) },
      consumo,
      totais: Object.entries(totais)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([ref, data]) => ({ referencia: ref, ...data })),
    });
  } catch (error) {
    console.error("[stock/consumo]", error);
    return NextResponse.json({ error: "Erro ao calcular consumo." }, { status: 500 });
  }
}
