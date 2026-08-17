import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const hoje = new Date();
    const daqui = (dias: number) => new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000);

    // 1. Contas a receber (faturas emitidas, não canceladas)
    const faturas = await prisma.fatura.findMany({
      where: { cancelada: false },
      select: {
        id: true,
        numeroFatura: true,
        valorTotal: true,
        pagamentoStatus: true,
        dataEmissao: true,
        recibos: { select: { valorPago: true } },
      },
    });

    // 2. Orçamentos aprovados (receita futura, ainda não faturada)
    const aprovados = await prisma.ordemServico.findMany({
      where: { orcamentoStatus: "Aprovado", status: { not: "concluida" } },
      select: { valorTotal: true },
    });

    // 3. Encomendas/ordens de compra pendentes (saída futura)
    const ocsPendentes = await prisma.ordemCompra.findMany({
      where: { status: { in: ["rascunho", "pendente", "enviada", "aprovada"] } },
      include: {
        linhas: { select: { quantidadeEncomendada: true, precoUnitario: true, quantidadeRecebida: true } },
      },
    });

    let totalVencido = 0;
    let totalPorReceber = 0;
    let totalRecebido30 = 0;
    let totalRecebido60 = 0;
    let totalRecebido90 = 0;

    const hojeMs = hoje.getTime();
    faturas.forEach((f) => {
      const valor = Number(f.valorTotal || 0);
      const status = f.pagamentoStatus;
      if (status === "Pago") return;
      const pago = (f.recibos || []).reduce((acc, r) => acc + Number(r.valorPago || 0), 0);
      const emDivida = Math.max(0, valor - pago);
      if (emDivida <= 0) return;
      // Vencido se passaram 30 dias desde a emissão
      const emissaoMs = f.dataEmissao ? new Date(f.dataEmissao).getTime() : hojeMs;
      const diasPassados = Math.floor((hojeMs - emissaoMs) / 86400000);
      if (diasPassados > 30) totalVencido += emDivida;

      // Janelas de recebimento projetadas
      if (diasPassados <= 0) totalRecebido30 += emDivida;
      else if (diasPassados <= 30) totalRecebido60 += emDivida;
      else totalRecebido90 += emDivida;
      totalPorReceber += emDivida;
    });

    const totalAprovadosNaoFaturados = aprovados.reduce((acc, o) => acc + Number(o.valorTotal || 0), 0);

    const saidasCompraPendentes = ocsPendentes.reduce((acc, oc) => {
      const linhas = oc.linhas || [];
      return acc + linhas.reduce((s, l) => {
        const pend = Math.max(0, Number(l.quantidadeEncomendada || 0) - Number(l.quantidadeRecebida || 0));
        return s + pend * Number(l.precoUnitario || 0);
      }, 0);
    }, 0);

    return NextResponse.json({
      data: hoje.toISOString(),
      contasReceber: {
        totalVencido,
        totalPorReceber,
        aCobrar30Dias: totalRecebido30,
        aCobrar60Dias: totalRecebido60,
        aCobrar90Dias: totalRecebido90,
      },
      receitaFutura: {
        orcamentosAprovadosNaoFaturados: totalAprovadosNaoFaturados,
        projecao30Dias: totalAprovadosNaoFaturados + totalRecebido30,
        projecao60Dias: totalAprovadosNaoFaturados + totalRecebido30 + totalRecebido60,
        projecao90Dias: totalAprovadosNaoFaturados + totalRecebido30 + totalRecebido60 + totalRecebido90,
      },
      saidasFuturas: {
        comprasPendentes: saidasCompraPendentes,
      },
      fluxoProjetado: {
        net30Dias: totalRecebido30 + totalAprovadosNaoFaturados - saidasCompraPendentes,
        net60Dias: totalRecebido30 + totalRecebido60 + totalAprovadosNaoFaturados - saidasCompraPendentes,
        net90Dias: totalRecebido30 + totalRecebido60 + totalRecebido90 + totalAprovadosNaoFaturados - saidasCompraPendentes,
      },
    });
  } catch (error) {
    console.error("[GET /api/stats/fluxo-caixa]", error);
    return NextResponse.json({ error: "Erro ao calcular projeção de caixa." }, { status: 500 });
  }
}
