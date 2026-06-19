import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

type CapacityCatalogResponse = {
  capacitiesByModel: Record<string, number[]>;
};

function normalizeModelKey(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function parseCapacityCatalog(raw: string): Record<string, number[]> {
  const lines = raw.split(/\r?\n/);
  const result: Record<string, number[]> = {};
  let inMainSection = false;
  let currentModelKey: string | null = null;

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) continue;

    if (line === "### TODOS OS MODELOS") {
      inMainSection = true;
      currentModelKey = null;
      continue;
    }

    if (line === "### MODELOS COM SOLAS") {
      break;
    }

    if (!inMainSection) continue;

    const modelMatch = line.match(/^\[(.+?)\]/);
    if (modelMatch) {
      currentModelKey = normalizeModelKey(modelMatch[1]);
      if (currentModelKey && !result[currentModelKey]) {
        result[currentModelKey] = [];
      }
      continue;
    }

    if (!currentModelKey) continue;
    if (!line.startsWith("tamanhos:")) continue;

    const rawSizes = line.slice("tamanhos:".length).split("|").map((item) => item.trim()).filter(Boolean);
    const parsedSizes = rawSizes
      .map((item) => Number(item))
      .filter((num) => Number.isFinite(num) && num > 0)
      .map((num) => Math.trunc(num));

    const merged = Array.from(new Set([...(result[currentModelKey] || []), ...parsedSizes])).sort((a, b) => a - b);
    result[currentModelKey] = merged;
  }

  return result;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "tamanhos_por_modelo.txt");
    const raw = await fs.readFile(filePath, "utf8");
    const capacitiesByModel = parseCapacityCatalog(raw);

    const payload: CapacityCatalogResponse = {
      capacitiesByModel,
    };

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: "Não foi possível carregar o catálogo de lotações." },
      { status: 500 }
    );
  }
}
