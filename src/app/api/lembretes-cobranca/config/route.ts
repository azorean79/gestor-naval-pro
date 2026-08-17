import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import {
  getLembreteCobrancaConfig,
  saveLembreteCobrancaConfig,
  type LembreteCobrancaConfig,
} from "@/lib/lembretes-cobranca";

export const runtime = "nodejs";

// GET /api/lembretes-cobranca/config
export async function GET() {
  const access = await getAccessContext();
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Apenas administradores podem ver a configuração." }, { status: 403 });
  }

  const config = await getLembreteCobrancaConfig();
  return NextResponse.json({ config });
}

// PUT /api/lembretes-cobranca/config
export async function PUT(req: NextRequest) {
  const access = await getAccessContext();
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Apenas administradores podem alterar a configuração." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }
    const config = await saveLembreteCobrancaConfig(body as Partial<LembreteCobrancaConfig>);
    return NextResponse.json({ config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao guardar configuração.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
