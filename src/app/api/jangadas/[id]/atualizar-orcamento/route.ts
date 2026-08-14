import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { logAuditoria } from "@/lib/auditoria";
import { getIvaRate, calcTotal, round2 } from "@/lib/iva";
import { parseOrdemServicoMeta, toOrdemServicoMetaJson } from "@/lib/ordens-servico";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const jangadaId = Number(rawId);
    if (!Number.isFinite(jangadaId) || jangadaId <= 0) {
      return NextResponse.json({ error: "ID de jangada inválido." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const linhas = Array.isArray(body?.linhas) ? body.linhas : [];
    const valorDesconto = Number(body?.valorDesconto || 0);
    const isIsentoIva = Boolean(body?.isIsentoIva);

    const ordem = await prisma.ordemServico.findFirst({
      where: {
        jangadaId,
        status: { notIn: ["concluida", "cancelada"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!ordem) {
      return NextResponse.json({ error: "Nenhuma Ordem de Serviço ativa encontrada para esta jangada." }, { status: 404 });
    }

    const orderMeta = parseOrdemServicoMeta(ordem.metadados);

    const nextMaterials = linhas.map((linha: any, index: number) => {
      const stockIdNum = linha.stockId != null && linha.stockId !== "" ? Number(linha.stockId) : null;
      const qty = Number(linha.quantidade ?? linha.quantidadeUsada ?? 1) || 0;
      const preco = Number(linha.precoUnitario ?? linha.unitPrice ?? 0) || 0;
      return {
        id: linha.id || `orcamento-edit-${index}`,
        stockId: Number.isFinite(stockIdNum) ? stockIdNum : null,
        referencia: linha.referencia || "SEM-REF",
        descricao: linha.descricao || "Artigo",
        quantidadePrevista: qty,
        quantidadeUsada: qty,
        precoUnitario: preco,
        disponibilidade: 0,
        reservado: false,
        consumido: true,
        origem: "orcamento",
      };
    });

    const valorPecas = nextMaterials.reduce(
      (acc: number, item: any) => acc + Math.max(0, Number(item.quantidadeUsada || 0)) * Math.max(0, Number(item.precoUnitario || 0)),
      0
    );

    const valorTotal = calcTotal(valorPecas, 0, valorDesconto, isIsentoIva);
    const subtotal = Math.max(0, valorPecas - valorDesconto);
    const iva = isIsentoIva ? 0 : round2(subtotal * getIvaRate());

    const updated = await prisma.ordemServico.update({
      where: { id: ordem.id },
      data: {
        valorPecas: round2(valorPecas),
        valorDesconto: round2(valorDesconto),
        isIsentoIva,
        valorTotal,
        metadados: toOrdemServicoMetaJson({
          ...orderMeta,
          materials: nextMaterials,
        }),
        updatedAt: new Date(),
      },
    });

    await logAuditoria({
      tabela: "OrdemServico",
      tipoOperacao: "UPDATE",
      idRegisto: ordem.id,
      descricao: `Orçamento da OT ${ordem.numeroOrdem} atualizado manualmente na ficha da jangada.`,
      usuario: access.email || "sistema",
    });

    return NextResponse.json({ success: true, ordemServicoId: updated.id, valorTotal, valorPecas });
  } catch (error: unknown) {
    console.error("Erro ao atualizar orçamento:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno ao atualizar orçamento." }, { status: 500 });
  }
}
