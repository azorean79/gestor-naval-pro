import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { enviarLembreteCobranca, listarLembretesCobrancaPendentes } from "@/lib/lembretes-cobranca";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/lembretes-cobranca — lista rascunhos pendentes (nunca envia nada)
export async function GET() {
  const access = await getAccessContext();
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const dados = await listarLembretesCobrancaPendentes();
    return NextResponse.json(dados);
  } catch (error) {
    console.error("[GET /api/lembretes-cobranca]", error);
    return NextResponse.json({ error: "Erro ao listar lembretes pendentes." }, { status: 500 });
  }
}

// POST /api/lembretes-cobranca — envia um rascunho previamente editado/confirmado
// pelo operador. Corpo: { faturaId, tipo, mensagem, canais: ["sms","email"] }
export async function POST(req: NextRequest) {
  const access = await getAccessContext();
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Apenas administradores podem enviar lembretes de cobrança." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }
    const faturaId = Number((body as Record<string, unknown>).faturaId);
    const tipo = (body as Record<string, unknown>).tipo;
    const mensagem = String((body as Record<string, unknown>).mensagem || "").trim();
    const canaisRaw = (body as Record<string, unknown>).canais;

    if (!Number.isInteger(faturaId) || faturaId <= 0) {
      return NextResponse.json({ error: "faturaId inválido." }, { status: 400 });
    }
    if (tipo !== "primeiro" && tipo !== "segundo") {
      return NextResponse.json({ error: "Tipo de lembrete inválido." }, { status: 400 });
    }
    if (!mensagem) {
      return NextResponse.json({ error: "A mensagem não pode estar vazia." }, { status: 400 });
    }
    const canais = Array.isArray(canaisRaw)
      ? canaisRaw.filter((c: unknown): c is "sms" | "email" => c === "sms" || c === "email")
      : [];
    if (canais.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos um canal de envio." }, { status: 400 });
    }

    const resultado = await enviarLembreteCobranca({
      faturaId,
      tipo: tipo as "primeiro" | "segundo",
      mensagem,
      canais,
      usuario: access.email,
    });
    return NextResponse.json(resultado, { status: resultado.ok ? 200 : 422 });
  } catch (error) {
    console.error("[POST /api/lembretes-cobranca]", error);
    return NextResponse.json({ error: "Erro ao enviar lembrete de cobrança." }, { status: 500 });
  }
}
