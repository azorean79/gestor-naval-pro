import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";
import { computeStockNeeds } from "@/lib/stock-needs-engine";
import { cachedJson } from "@/lib/api-cache";

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

    const stockScope = String(new URL(req.url).searchParams.get("stockScope") || "").trim().toLowerCase();
    const cacheKey = `necessidades:${stockScope || "all"}:u${access.userId}`;

    const result = await cachedJson(cacheKey, 90, () => computeStockNeeds({ stockScope }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/stock/necessidades]", error);
    return NextResponse.json({ error: "Erro ao calcular análise de necessidades." }, { status: 500 });
  }
}
