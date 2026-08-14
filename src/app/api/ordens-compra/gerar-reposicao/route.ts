import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fornecedorId = body?.fornecedorId ? Number(body.fornecedorId) : null;
    const margemSeguranca = Number(body?.margemSeguranca || 0);

    // Fornecedor preferencial por defeito (primeiro registado) se não for indicado
    let fornecedor = null;
    if (fornecedorId) {
      fornecedor = await prisma.fornecedor.findUnique({ where: { id: fornecedorId } });
    } else {
      fornecedor = await prisma.fornecedor.findFirst({ orderBy: { createdAt: "asc" } });
    }

    if (!fornecedor) {
      return NextResponse.json(
        { error: "Não existe nenhum fornecedor registado. Crie primeiro um fornecedor para gerar ordens de compra." },
        { status: 400 },
      );
    }

    // Artigos de stock abaixo do mínimo (com necessidade real de reposição)
    const items = await prisma.stock.findMany({
      select: {
        id: true,
        referencia: true,
        descricao: true,
        quantidade: true,
        quantidadeMinima: true,
        precoVenda: true,
      },
      orderBy: [{ quantidade: "asc" }],
    });

    const itensParaRepor = items.filter((i) => {
      const qty = Number(i.quantidade || 0);
      const min = Number(i.quantidadeMinima || 0);
      return min > 0 && qty <= min;
    });

    if (itensParaRepor.length === 0) {
      return NextResponse.json({ message: "Nenhum artigo de stock abaixo do mínimo. Nada a repor." });
    }

    // Criar OrdemCompra com as linhas de reposição
    const ano = new Date().getFullYear();
    const count = await prisma.ordemCompra.count({
      where: { numero: { startsWith: `OC-${ano}-` } },
    });
    const numero = `OC-${ano}-${String(count + 1).padStart(3, "0")}`;

    const linhas = itensParaRepor.map((i) => {
      const qtyAtual = Number(i.quantidade || 0);
      const min = Number(i.quantidadeMinima || 0);
      const faltam = Math.max(0, min - qtyAtual);
      const quantidade = faltam + margemSeguranca;
      const precoUnitario = Number(i.precoVenda || 0);
      return {
        stockId: i.id,
        referencia: i.referencia,
        descricao: i.descricao || i.referencia || "Artigo",
        quantidadeEncomendada: quantidade,
        precoUnitario,
        total: quantidade * precoUnitario,
      };
    });

    const valorTotal = linhas.reduce((acc, l) => acc + l.total, 0);

    const ordemCompra = await prisma.ordemCompra.create({
      data: {
        numero,
        fornecedorId: fornecedor.id,
        status: "Rascunho",
        valorTotal,
        observacoes: `Gerada automaticamente por stock crítico (${itensParaRepor.length} artigos abaixo do mínimo).`,
        linhas: { create: linhas },
      },
      include: { linhas: true },
    });

    return NextResponse.json({
      success: true,
      ordemCompra,
      itensRepostos: linhas.length,
      valorTotal,
    });
  } catch (error) {
    console.error("[POST /api/ordens-compra/gerar-reposicao]", error);
    return NextResponse.json({ error: "Erro ao gerar ordem de compra de reposição." }, { status: 500 });
  }
}
