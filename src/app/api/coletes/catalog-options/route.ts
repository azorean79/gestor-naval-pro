import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { lifejacketModelData } from "@/modules/lifejackets/lifejacketModelData";

type CatalogSource = "catalogo" | "departamentoTecnico" | "baseDados";

type CatalogOption = {
  marca: string;
  modelo: string;
  fabricante: string;
  origem: string | null;
  source: CatalogSource;
};

function normalizeCatalogKey(value: unknown): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "")
    .trim()
    .toUpperCase();
}

function normalizeLabel(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isMissingCatalogTableError(error: unknown): boolean {
  const err = error as { code?: string; meta?: { code?: string }; message?: string } | null;
  const sqlCode = err?.meta?.code || err?.code;
  const msg = String(err?.message || "").toLowerCase();

  return (
    sqlCode === "42P01" ||
    (msg.includes('relation "catalogmarcamodelo" does not exist') ||
      (msg.includes("catalogmarcamodelo") && msg.includes("does not exist")))
  );
}

function pushUniqueOption(
  target: Map<string, CatalogOption>,
  source: CatalogSource,
  marcaRaw: unknown,
  modeloRaw: unknown,
  fabricanteRaw?: unknown,
  origemRaw?: unknown
) {
  const marca = normalizeLabel(marcaRaw);
  const modelo = normalizeLabel(modeloRaw);
  if (!marca || !modelo) return;

  const fabricante = normalizeLabel(fabricanteRaw) || marca;
  const origem = normalizeLabel(origemRaw) || null;

  const marcaKey = normalizeCatalogKey(marca);
  const modeloKey = normalizeCatalogKey(modelo);
  if (!marcaKey || !modeloKey) return;

  const key = `${marcaKey}::${modeloKey}`;
  if (target.has(key)) return;

  target.set(key, {
    marca,
    modelo,
    fabricante,
    origem,
    source,
  });
}

export async function GET() {
  try {
    const optionsMap = new Map<string, CatalogOption>();

    for (const brand of lifejacketModelData) {
      for (const model of brand.models || []) {
        pushUniqueOption(
          optionsMap,
          "departamentoTecnico",
          brand.brand,
          model.model,
          brand.brand,
          model.manufacturingCountry || brand.manufacturingCountry || null
        );
      }
    }

    const loadCatalogRows = async (): Promise<Array<{ marca: string | null; modelo: string | null; fabricante: string | null; origem: string | null }>> => {
      try {
        return await prisma.$queryRaw<Array<{ marca: string | null; modelo: string | null; fabricante: string | null; origem: string | null }>>`
          SELECT "marca", "modelo", COALESCE("fabricante", "marca") AS "fabricante", "origem"
          FROM "CatalogMarcaModelo"
          WHERE "tipo" = 'COLETE'
        `;
      } catch (error) {
        if (isMissingCatalogTableError(error)) {
          return [];
        }

        const err = error as { code?: string; message?: string } | null;
        const sqlCode = err?.code;
        const message = String(err?.message || "").toLowerCase();
        const missingColumns = sqlCode === "42703" || message.includes("fabricante") || message.includes("origem");

        if (!missingColumns) {
          throw error;
        }

        return prisma
          .$queryRaw<Array<{ marca: string | null; modelo: string | null }>>`
            SELECT "marca", "modelo"
            FROM "CatalogMarcaModelo"
            WHERE "tipo" = 'COLETE'
          `
          .then((rows) => rows.map((row) => ({ ...row, fabricante: row.marca || null, origem: null })))
          .catch((fallbackError) => {
            if (isMissingCatalogTableError(fallbackError)) {
              return [] as Array<{ marca: string | null; modelo: string | null; fabricante: string | null; origem: string | null }>;
            }
            throw fallbackError;
          });
      }
    };

    const [catalogRows, dbRows] = await Promise.all([
      loadCatalogRows(),
      prisma.colete.findMany({ select: { marca: true, modelo: true } }),
    ]);

    for (const row of catalogRows) {
      pushUniqueOption(optionsMap, "catalogo", row?.marca, row?.modelo, row?.fabricante, row?.origem);
    }

    for (const row of dbRows) {
      pushUniqueOption(optionsMap, "baseDados", row?.marca, row?.modelo, row?.marca, null);
    }

    const options = Array.from(optionsMap.values()).sort((a, b) => {
      const brandOrder = a.marca.localeCompare(b.marca, "pt-PT");
      if (brandOrder !== 0) return brandOrder;
      return a.modelo.localeCompare(b.modelo, "pt-PT");
    });

    return NextResponse.json({
      options,
      sources: {
        catalogo: catalogRows.length,
        departamentoTecnico: lifejacketModelData.reduce((acc, brand) => acc + (brand.models?.length || 0), 0),
        baseDados: dbRows.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error)?.message || "Erro ao carregar opções de catálogo de coletes." }, { status: 500 });
  }
}
