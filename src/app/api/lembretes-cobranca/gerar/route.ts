import { NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { gerarRascunhosLembretesCobranca } from "@/lib/lembretes-cobranca";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/lembretes-cobranca/gerar — gera (ou atualiza) rascunhos pendentes.
// Apenas escreve rascunhos; nunca envia SMS/e-mail.
export async function POST() {
  const access = await getAccessContext();
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Apenas administradores podem gerar rascunhos." }, { status: 403 });
  }

  try {
    const resultado = await gerarRascunhosLembretesCobranca();
    return NextResponse.json(resultado);
  } catch (error) {
    console.error("[POST /api/lembretes-cobranca/gerar]", error);
    return NextResponse.json({ error: "Erro ao gerar rascunhos de lembretes." }, { status: 500 });
  }
}
