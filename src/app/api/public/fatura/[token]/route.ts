import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLembreteCobrancaConfig, resolvePublicFaturaToken, adicionarDias } from "@/lib/lembretes-cobranca";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/fatura/[token] — página pública de estado da fatura.
// Sem autenticação: expõe apenas informação mínima (sem contactos/metadados).
export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const faturaId = resolvePublicFaturaToken(token);
    if (!faturaId) {
      return NextResponse.json({ error: "Link inválido." }, { status: 404 });
    }

    const fatura = await prisma.fatura.findUnique({
      where: { id: faturaId },
      select: {
        numeroFatura: true,
        valorTotal: true,
        pagamentoStatus: true,
        dataEmissao: true,
        cancelada: true,
        cliente: { select: { nome: true } },
        ordemServicos: {
          select: { ordemServico: { select: { numeroOrdem: true } } },
          take: 1,
          orderBy: { id: "desc" },
        },
      },
    });

    if (!fatura || fatura.cancelada) {
      return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });
    }

    const config = await getLembreteCobrancaConfig();
    return NextResponse.json({
      numeroFatura: fatura.numeroFatura,
      numeroOrdem: fatura.ordemServicos?.[0]?.ordemServico?.numeroOrdem ?? null,
      clienteNome: fatura.cliente?.nome || null,
      valorTotal: Number(fatura.valorTotal || 0),
      pagamentoStatus: fatura.pagamentoStatus,
      dataEmissao: fatura.dataEmissao,
      dataVencimento: adicionarDias(fatura.dataEmissao, config.diasVencimento),
    });
  } catch (error) {
    console.error("[GET /api/public/fatura/[token]]", error);
    return NextResponse.json({ error: "Erro ao carregar fatura." }, { status: 500 });
  }
}
