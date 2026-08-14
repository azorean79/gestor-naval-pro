import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const hoje = new Date();
    const daqui = (dias: number) => new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000);

    // 1. Contas a receber (ordens concluídas, não pagas)
    const concluidas = await prisma.ordemServico.findMany({
      where: { status: "concluida" },
      select: { valorTotal: true, dataConclusao: true, metadados: true },
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

    function pagamentoStatus(meta: unknown): string {
      if (!meta || typeof meta !== "object") return "Pendente";
      const m = meta as Record<string, unknown>;
      return String(m.pagamentoStatus || "Pendente");
    }

    let totalVencido = 0;
    let totalPorReceber = 0;
    let totalRecebido30 = 0;
    let totalRecebido60 = 0;
    let totalRecebido90 = 0;

    const hojeMs = hoje.getTime();
    concluidas.forEach((o) => {
      const valor = Number(o.valorTotal || 0);
      const status = pagamentoStatus(o.metadados);
      if (status === "Pago") return;
      if (status === "Pago Parcialmente") {
        totalPorReceber += valor * 0.5;
        return;
      }
      // Vencido se passaram 30 dias desde a conclusão
      const concMs = o.dataConclusao ? new Date(o.dataConclusao).getTime() : hojeMs;
      const diasPassados = Math.floor((hojeMs - concMs) / 86400000);
      if (diasPassados > 30) totalVencido += valor;

      // Janelas de recebimento projetadas
      if (diasPassados <= 0) totalRecebido30 += valor;
      else if (diasPassados <= 30) totalRecebido60 += valor;
      else totalRecebido90 += valor;
      totalPorReceber += valor;
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
