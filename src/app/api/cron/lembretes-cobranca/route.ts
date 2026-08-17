import { NextRequest, NextResponse } from "next/server";
import { encontrarCandidatosLembreteCobranca, gerarRascunhosLembretesCobranca } from "@/lib/lembretes-cobranca";

export const runtime = "nodejs";

// GET /api/cron/lembretes-cobranca
// - Sem ?enviar=1: apenas preview (não escreve nada).
// - Com ?enviar=1&secret=<CRON_SECRET> (ou Authorization: Bearer): gera rascunhos
//   pendentes em Fatura.metadados. NUNCA envia SMS/e-mail automaticamente —
//   o operador revê e confirma o envio na página de Cobranças.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const enviar = searchParams.get("enviar") === "1";
    const secret = searchParams.get("secret") || "";
    const authHeader = req.headers.get("authorization") || "";
    const envSecret = process.env.CRON_SECRET?.trim();

    if (enviar && envSecret) {
      const secretOk = secret === envSecret || authHeader === `Bearer ${envSecret}`;
      if (!secretOk) {
        return NextResponse.json({ error: "Secret inválido." }, { status: 403 });
      }
    }

    if (!enviar) {
      const { config, candidatos } = await encontrarCandidatosLembreteCobranca();
      return NextResponse.json({
        success: true,
        verificadoEm: new Date().toISOString(),
        preview: true,
        config: {
          enabled: config.enabled,
          diasPrimeiroLembrete: config.diasPrimeiroLembrete,
          diasSegundoLembrete: config.diasSegundoLembrete,
          diasVencimento: config.diasVencimento,
        },
        totalCandidatos: candidatos.length,
        candidatos,
      });
    }

    const resultado = await gerarRascunhosLembretesCobranca();
    return NextResponse.json({
      success: true,
      verificadoEm: new Date().toISOString(),
      config: {
        enabled: resultado.config.enabled,
        diasPrimeiroLembrete: resultado.config.diasPrimeiroLembrete,
        diasSegundoLembrete: resultado.config.diasSegundoLembrete,
        diasVencimento: resultado.config.diasVencimento,
      },
      totalGerados: resultado.gerados,
      totalJaExistentes: resultado.jaExistentes,
      rascunhos: resultado.rascunhos,
      aviso: "Rascunhos gerados. Nenhuma SMS/e-mail foi enviado — a confirmação é sempre manual.",
    });
  } catch (error) {
    console.error("[GET /api/cron/lembretes-cobranca]", error);
    return NextResponse.json({ error: "Erro ao verificar lembretes de cobrança." }, { status: 500 });
  }
}
