import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";
import { invalidateApiCache } from "@/lib/api-cache";

function canView(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/stock") || canEditPath(access.permissions, "/stock");
}
function canEdit(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canEditPath(access.permissions, "/stock");
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!canView(access)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

    const id = Number((await ctx.params).id);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const pedido = await prisma.pedidoReposicao.findUnique({
      where: { id },
      include: {
        linhas: {
          include: { stock: { select: { id: true, referencia: true, quantidade: true, localizacao: true } } },
        },
      },
    });
    if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    return NextResponse.json(pedido);
  } catch (error) {
    console.error("[GET pedido]", error);
    return NextResponse.json({ error: "Erro ao obter pedido." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!canEdit(access)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

    const id = Number((await ctx.params).id);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = (await req.json()) as {
      action?: "encomendar" | "receber" | "cancelar";
      status?: string;
      notas?: string;
      linhas?: Array<{ id: number; quantidadeRecebida?: number }>;
    };

    const pedido = await prisma.pedidoReposicao.findUnique({
      where: { id },
      include: { linhas: true },
    });
    if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    if (body.action === "cancelar" || body.status === "cancelado") {
      const updated = await prisma.pedidoReposicao.update({
        where: { id },
        data: { status: "cancelado", notas: body.notas ?? pedido.notas },
        include: { linhas: true },
      });
      return NextResponse.json(updated);
    }

    if (body.action === "encomendar" || body.status === "encomendado") {
      const updated = await prisma.pedidoReposicao.update({
        where: { id },
        data: {
          status: "encomendado",
          encomendadoEm: new Date(),
          notas: body.notas ?? pedido.notas,
        },
        include: { linhas: true },
      });
      return NextResponse.json(updated);
    }

    if (body.action === "receber") {
      const receives = Array.isArray(body.linhas) ? body.linhas : [];
      const byId = new Map(receives.map((l) => [Number(l.id), Math.max(0, Number(l.quantidadeRecebida) || 0)]));

      await prisma.$transaction(async (tx) => {
        let allDone = true;
        let anyReceived = false;

        for (const linha of pedido.linhas) {
          const add = byId.has(linha.id)
            ? Number(byId.get(linha.id) || 0)
            : Math.max(0, linha.quantidadePedida - linha.quantidadeRecebida);
          if (add <= 0) {
            if (linha.quantidadeRecebida < linha.quantidadePedida) allDone = false;
            continue;
          }

          const newReceived = linha.quantidadeRecebida + add;
          const lineStatus =
            newReceived >= linha.quantidadePedida ? "recebido" : newReceived > 0 ? "parcial" : "pendente";
          if (lineStatus !== "recebido") allDone = false;
          if (newReceived > 0) anyReceived = true;

          await tx.pedidoReposicaoLinha.update({
            where: { id: linha.id },
            data: { quantidadeRecebida: newReceived, status: lineStatus },
          });

          if (linha.stockId) {
            const stock = await tx.stock.findUnique({
              where: { id: linha.stockId },
              select: { quantidade: true },
            });
            if (stock) {
              const updatedStock = await tx.stock.update({
                where: { id: linha.stockId },
                data: { quantidade: { increment: add } },
              });
              await tx.movimentacaoStock.create({
                data: {
                  stockId: linha.stockId,
                  tipo: "entrada",
                  quantidade: add,
                  quantidadeAntes: stock.quantidade,
                  quantidadeDepois: updatedStock.quantidade,
                  motivo: `Receção pedido ${pedido.numero}`,
                  usuario: access.email,
                  pedidoReposicaoId: pedido.id,
                },
              });
            }
          }
        }

        await tx.pedidoReposicao.update({
          where: { id },
          data: {
            status: allDone ? "recebido" : anyReceived ? "parcial" : pedido.status,
            recebidoEm: allDone ? new Date() : pedido.recebidoEm,
            notas: body.notas ?? pedido.notas,
          },
        });
      });

      invalidateApiCache("stock:");
      invalidateApiCache("necessidades:");

      const updated = await prisma.pedidoReposicao.findUnique({
        where: { id },
        include: { linhas: true },
      });
      return NextResponse.json(updated);
    }

    if (body.notas != null || body.status) {
      const updated = await prisma.pedidoReposicao.update({
        where: { id },
        data: {
          ...(body.notas != null ? { notas: body.notas } : {}),
          ...(body.status ? { status: body.status } : {}),
        },
        include: { linhas: true },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    console.error("[PATCH pedido]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar pedido.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
