import { NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";
import { computeStockNeeds } from "@/lib/stock-needs-engine";

export const runtime = "nodejs";

function canViewStock(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/stock") || canEditPath(access.permissions, "/stock");
}

export async function GET() {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }
    if (!canViewStock(access)) {
      return NextResponse.json({ error: "Sem permissão para consultar stock." }, { status: 403 });
    }

    const result = await computeStockNeeds({ stockScope: "all" });

    return NextResponse.json({
      generatedAt: result.generatedAt,
      summary: {
        totalRaftsAnalyzed: result.summary.totalRaftsAnalyzed,
        expiringRafts90d: result.summary.expiringRafts90d,
        expiringRafts60d: result.summary.expiringRafts60d,
        expiringRafts30d: result.summary.expiringRafts30d,
        totalItemsTracked: result.summary.totalItemsTracked,
        itemsInAlert: result.summary.itemsInAlert,
        totalReorderCost: result.summary.totalReorderCost,
        coveragePercent: result.summary.coveragePercent,
      },
      suggestions: result.suggestions,
      expiringRafts90d: result.upcomingRafts30d,
    });
  } catch (error) {
    console.error("[GET /api/stock/forecast]", error);
    return NextResponse.json({ error: "Erro ao calcular previsão de stock." }, { status: 500 });
  }
}
