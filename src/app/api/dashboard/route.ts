import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import pLimit from "p-limit";

async function internalFetch<T>(origin: string, path: string, cookie: string): Promise<T | null> {
  const res = await fetch(new URL(path, origin), {
    headers: { cookie },
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const origin = req.nextUrl.origin;
    const cookie = req.headers.get("cookie") || "";

    // Limitar concorrencia para nao sobrecarregar o motor Prisma no arranque.
    const limit = pLimit(3);

    const [
      stats,
      needs,
      auditoria,
      ordensKpis,
      otAlerts,
      alerts,
      agendaMetrics,
      dataQuality,
      tecnicos,
      expiring,
      jangadas,
    ] = await Promise.all([
      limit(() => internalFetch(origin, "/api/stats", cookie)),
      limit(() => internalFetch(origin, "/api/stock/necessidades?stockScope=jangadas-ocean", cookie)),
      limit(() => internalFetch(origin, "/api/auditorias/planeamento", cookie)),
      limit(() => internalFetch(origin, "/api/ordens-servico/kpis", cookie)),
      limit(() => internalFetch(origin, "/api/ordens-servico/alertas", cookie)),
      limit(() => internalFetch(origin, "/api/alertas", cookie)),
      limit(() => internalFetch(origin, "/api/agenda/metrics", cookie)),
      limit(() => internalFetch(origin, "/api/data-quality", cookie)),
      limit(() => internalFetch(origin, "/api/tecnicos", cookie)),
      limit(() => internalFetch(origin, "/api/stock/expiring", cookie)),
      limit(() => internalFetch(origin, "/api/jangadas?scope=all", cookie)),
    ]);

    return NextResponse.json({
      stats,
      needs,
      auditoria,
      ordensKpis,
      otAlerts,
      alerts,
      agendaMetrics,
      dataQuality,
      tecnicos,
      expiring,
      jangadas,
    });
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar dashboard." },
      { status: 500 }
    );
  }
}
