import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  FOOD_RATIONS_REFERENCE_CANDIDATES,
  FOOD_RATIONS_STOCK_REFERENCE,
} from "../src/lib/stock-reference-rules";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

type StockLike = {
  id: number;
  referencia: string;
  descricao: string;
  quantidade: number;
  precoVenda: number;
  codigoFabricante: string | null;
  categoria: string | null;
  foto: string | null;
  localizacao: string | null;
  observacoes: string | null;
  referenciaSubstituta: string | null;
  inventario: string | null;
  lote: string | null;
  validade: string | null;
  quantidadeMinima: number | null;
  associavelJangada: boolean;
  aplicavelMarcaJangada: string | null;
  aplicavelModeloJangada: string | null;
};

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function buildReplacementReferenceValue(values: Array<string | null | undefined>) {
  const joined = uniqueValues(values).filter((value) => value !== FOOD_RATIONS_STOCK_REFERENCE).join(" | ");
  return joined || null;
}

async function main() {
  const dryRun = new Set(process.argv.slice(2)).has("--dry-run");
  const db = prisma as any;
  const delegates = {
    stock: db.stock,
    artigo: db.artigo,
    artigoJangada: db.artigoJangada,
    inspecaoArtigo: db.inspecaoArtigo ?? db.InspecaoArtigo ?? null,
    movimentacaoStock: db.movimentacaoStock ?? null,
  };

  const stockRows = (await delegates.stock.findMany({
    where: {
      referencia: {
        in: [...FOOD_RATIONS_REFERENCE_CANDIDATES],
      },
    },
    orderBy: [{ referencia: "asc" }, { id: "asc" }],
  })) as StockLike[];

  if (stockRows.length === 0) {
    console.log("Nenhum registo de stock de rações encontrado para normalizar.");
    return;
  }

  const canonicalRow =
    stockRows.find((row) => row.referencia === FOOD_RATIONS_STOCK_REFERENCE) ?? stockRows[0];
  const legacyRows = stockRows.filter((row) => row.id !== canonicalRow.id);
  const legacyReferences = legacyRows.map((row) => row.referencia);
  const allKnownReferences = uniqueValues([
    ...FOOD_RATIONS_REFERENCE_CANDIDATES,
    canonicalRow.referencia,
    canonicalRow.referenciaSubstituta,
    ...legacyReferences,
  ]);

  const mergedQuantity = stockRows.reduce((acc, row) => acc + Number(row.quantidade || 0), 0);
  const mergedMinQuantity = Math.max(...stockRows.map((row) => Number(row.quantidadeMinima || 0)), 0) || null;
  const mergedReferenciaSubstituta = buildReplacementReferenceValue([
    canonicalRow.referenciaSubstituta,
    ...legacyReferences,
    ...FOOD_RATIONS_REFERENCE_CANDIDATES.filter((reference) => reference !== FOOD_RATIONS_STOCK_REFERENCE),
  ]);

  const primaryData = {
    referencia: FOOD_RATIONS_STOCK_REFERENCE,
    descricao: canonicalRow.descricao,
    categoria: canonicalRow.categoria,
    codigoFabricante: canonicalRow.codigoFabricante,
    foto: canonicalRow.foto,
    localizacao: canonicalRow.localizacao,
    observacoes: canonicalRow.observacoes,
    inventario: canonicalRow.inventario,
    lote: canonicalRow.lote,
    validade: canonicalRow.validade,
    precoVenda: canonicalRow.precoVenda,
    quantidade: mergedQuantity,
    quantidadeMinima: mergedMinQuantity,
    associavelJangada: canonicalRow.associavelJangada,
    aplicavelMarcaJangada: canonicalRow.aplicavelMarcaJangada,
    aplicavelModeloJangada: canonicalRow.aplicavelModeloJangada,
    referenciaSubstituta: mergedReferenciaSubstituta,
  };

  const articleRowsToMove = delegates.inspecaoArtigo && legacyRows.length > 0
    ? await delegates.inspecaoArtigo.findMany({
        where: {
          stockId: { in: legacyRows.map((row) => row.id) },
        },
        orderBy: [{ inspecaoId: "asc" }, { id: "asc" }],
      })
    : [];

  const summary = {
    canonicalStockId: canonicalRow.id,
    touchedStockReferences: allKnownReferences,
    legacyStockIds: legacyRows.map((row) => row.id),
    articleRowsToMove: articleRowsToMove.length,
  };

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, summary, primaryData }, null, 2));
    return;
  }

  await prisma.$transaction(async (tx) => {
    const txAny = tx as any;

    await txAny.stock.update({
      where: { id: canonicalRow.id },
      data: primaryData,
    });

    await txAny.stock.updateMany({
      where: {
        referenciaSubstituta: {
          in: allKnownReferences.filter((reference) => reference !== FOOD_RATIONS_STOCK_REFERENCE),
        },
      },
      data: {
        referenciaSubstituta: FOOD_RATIONS_STOCK_REFERENCE,
      },
    });

    await txAny.artigo.updateMany({
      where: {
        referencia: {
          in: allKnownReferences.filter((reference) => reference !== FOOD_RATIONS_STOCK_REFERENCE),
        },
      },
      data: {
        referencia: FOOD_RATIONS_STOCK_REFERENCE,
      },
    });

    await txAny.artigoJangada.updateMany({
      where: {
        referencia: {
          in: allKnownReferences.filter((reference) => reference !== FOOD_RATIONS_STOCK_REFERENCE),
        },
      },
      data: {
        referencia: FOOD_RATIONS_STOCK_REFERENCE,
      },
    });

    if (txAny.inspecaoArtigo) {
      await txAny.inspecaoArtigo.updateMany({
        where: {
          referencia: {
            in: allKnownReferences.filter((reference) => reference !== FOOD_RATIONS_STOCK_REFERENCE),
          },
        },
        data: {
          referencia: FOOD_RATIONS_STOCK_REFERENCE,
        },
      });

      for (const row of articleRowsToMove) {
        const duplicate = await txAny.inspecaoArtigo.findFirst({
          where: {
            inspecaoId: row.inspecaoId,
            stockId: canonicalRow.id,
          },
        });

        if (duplicate) {
          await txAny.inspecaoArtigo.update({
            where: { id: duplicate.id },
            data: {
              referencia: FOOD_RATIONS_STOCK_REFERENCE,
              descricao: duplicate.descricao || row.descricao,
              quantidadePlaneada: Number(duplicate.quantidadePlaneada || 0) + Number(row.quantidadePlaneada || 0),
              quantidadeUsada: Number(duplicate.quantidadeUsada || 0) + Number(row.quantidadeUsada || 0),
              observacoes: [duplicate.observacoes, row.observacoes].filter(Boolean).join(" | ") || null,
            },
          });

          await txAny.inspecaoArtigo.delete({ where: { id: row.id } });
        } else {
          await txAny.inspecaoArtigo.update({
            where: { id: row.id },
            data: {
              stockId: canonicalRow.id,
              referencia: FOOD_RATIONS_STOCK_REFERENCE,
            },
          });
        }
      }
    }

    if (txAny.movimentacaoStock && legacyRows.length > 0) {
      await txAny.movimentacaoStock.updateMany({
        where: {
          stockId: { in: legacyRows.map((row) => row.id) },
        },
        data: {
          stockId: canonicalRow.id,
        },
      });
    }

    if (legacyRows.length > 0) {
      await txAny.stock.deleteMany({
        where: {
          id: { in: legacyRows.map((row) => row.id) },
        },
      });
    }
  });

  console.log(JSON.stringify({ dryRun: false, summary, canonicalReference: FOOD_RATIONS_STOCK_REFERENCE }, null, 2));
}

main()
  .catch((error) => {
    console.error("Erro ao normalizar referências de rações no stock:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });