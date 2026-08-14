import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import {
  parseOrdemServicoMeta,
  toOrdemServicoMetaJson,
  type OrdemServicoMeta,
} from "@/lib/ordens-servico";
import { invalidateApiCache } from "@/lib/api-cache";

type CompletarItem = Record<string, unknown> & {
  id?: unknown;
  stockId?: unknown;
  referencia?: unknown;
  descricao?: unknown;
  quantidade?: unknown;
  quantidadeUsada?: unknown;
  quantidadePrevista?: unknown;
  consumido?: unknown;
};

type CompletarMeta = OrdemServicoMeta & {
  materiais?: Array<Record<string, unknown>>;
};

function readMaterials(meta: CompletarMeta) {
  if (Array.isArray(meta.materials)) return meta.materials as CompletarItem[];
  if (Array.isArray(meta.materiais)) return meta.materiais as CompletarItem[];
  return [] as CompletarItem[];
}

function readLinhas(meta: CompletarMeta) {
  return Array.isArray(meta.linhas) ? (meta.linhas as CompletarItem[]) : [];
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { id } = await params;
    const numericId = Number(id);
    if (!numericId) return NextResponse.json({ error: "ID invalido" }, { status: 400 });

    const ordem = await prisma.ordemServico.findUnique({
      where: { id: numericId },
      select: { id: true, status: true, numeroOrdem: true, metadados: true },
    });
    if (!ordem) return NextResponse.json({ error: "OS nao encontrada" }, { status: 404 });

    // Idempotente: já concluída
    if (String(ordem.status || "").toLowerCase() === "concluida") {
      return NextResponse.json({
        success: true,
        idempotent: true,
        consumed: 0,
        warnings: [],
      });
    }

    const meta = parseOrdemServicoMeta(ordem.metadados) as CompletarMeta;
    const materials = readMaterials(meta);
    const linhas = readLinhas(meta);

    // Unificar materiais + linhas com stockId, evitando double-consume
    const seen = new Set<string>();
    const allItems: CompletarItem[] = [];
    for (const item of [...materials, ...linhas]) {
      const stockId = Number(item?.stockId || 0);
      const key = item?.id ? `id:${item.id}` : `stock:${stockId}:${item?.referencia || ""}:${item?.descricao || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      allItems.push(item);
    }

    const consumptionLog: string[] = [];
    const warnings: string[] = [];
    let consumedCount = 0;

    const result = await prisma.$transaction(async (tx) => {
      const nextMaterials = [...materials];
      const nextLinhas = [...linhas];

      for (const item of allItems) {
        if (item?.consumido) continue;
        const stockId = Number(item.stockId || 0);
        const qty = Math.max(
          0,
          Number(item.quantidadeUsada ?? item.quantidade ?? item.quantidadePrevista ?? 0) || 0
        );
        if (!stockId || qty <= 0) continue;

        const stock = await tx.stock.findUnique({
          where: { id: stockId },
          select: { id: true, quantidade: true, quantidadeReservada: true },
        });
        if (!stock) {
          warnings.push(`Stock #${stockId} não encontrado`);
          continue;
        }
        if (stock.quantidade < qty) {
          warnings.push(`Stock insuficiente para ${item.descricao || item.referencia || "artigo"}`);
          continue;
        }

        const reserved = Math.max(0, Number(stock.quantidadeReservada || 0));
        const updated = await tx.stock.update({
          where: { id: stockId },
          data: {
            quantidade: { decrement: qty },
            ...(reserved > 0
              ? { quantidadeReservada: { decrement: Math.min(reserved, qty) } }
              : {}),
          },
        });

        await tx.movimentacaoStock.create({
          data: {
            stockId,
            tipo: "saida",
            quantidade: qty,
            quantidadeAntes: stock.quantidade,
            quantidadeDepois: updated.quantidade,
            motivo: `Consumo OT ${ordem.numeroOrdem}`,
            usuario: access.email || "sistema",
            ordemServicoId: numericId,
          },
        });

        // marcar consumido em materials/linhas
        const mark = (list: CompletarItem[]) =>
          list.map((row) => {
            const sameId = item.id && row.id === item.id;
            const sameStock =
              !item.id &&
              Number(row.stockId || 0) === stockId &&
              String(row.referencia || "") === String(item.referencia || "");
            if (sameId || sameStock) {
              return { ...row, consumido: true, quantidadeUsada: qty, reservado: false };
            }
            return row;
          });

        for (let i = 0; i < nextMaterials.length; i++) {
          nextMaterials[i] = mark([nextMaterials[i]])[0];
        }
        for (let i = 0; i < nextLinhas.length; i++) {
          nextLinhas[i] = mark([nextLinhas[i]])[0];
        }

        consumptionLog.push(`${item.descricao || item.referencia || stockId}: -${qty}`);
        consumedCount += 1;
      }

      const nextMeta = {
        ...meta,
        materials: nextMaterials,
        materiais: nextMaterials,
        linhas: nextLinhas,
        consumptionLog,
        concludedAt: new Date().toISOString(),
      };

      await tx.ordemServico.update({
        where: { id: numericId },
        data: {
          status: "concluida",
          dataConclusao: new Date(),
          metadados: toOrdemServicoMetaJson(nextMeta as OrdemServicoMeta),
        },
      });

      await tx.ordemServicoLog.create({
        data: {
          ordemServicoId: numericId,
          type: "status",
          message: `OS concluída com consumo de stock automático (${consumedCount} linha(s)).`,
          user: access.email || "sistema",
        },
      });

      return { consumedCount };
    });

    invalidateApiCache("stock:");
    invalidateApiCache("necessidades:");

    return NextResponse.json({
      success: true,
      consumed: result.consumedCount,
      warnings,
      log: consumptionLog,
    });
  } catch (err: unknown) {
    console.error("Erro ao concluir OS:", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
