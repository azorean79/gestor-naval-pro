/** 20 prateleiras canónicas do armazém de stock. */

export const STOCK_SHELF_COUNT = 20;

export type StockShelf = {
  code: string; // P01..P20
  number: number;
  label: string;
  zone: string;
  row: number;
  col: number;
  legacyCodes: string[];
  suggestedCategories: string[];
};

const ZONE_BY_ROW: Array<{ zone: string; categories: string[] }> = [
  { zone: "Entrada / Expedição", categories: ["PIROTECNICOS", "SINALIZACAO", "ILUMINACAO", "BATERIA"] },
  { zone: "Consumíveis & Pack", categories: ["CONSUMIVEIS", "RACAO", "AGUA", "FARMACIA", "PRIMEIROS SOCORROS"] },
  { zone: "Cilindros & Pressão", categories: ["CILINDROS", "CILINDRO", "VALVULA", "PRESSAO", "TUBOS"] },
  { zone: "Peças & Equipamento", categories: ["CABECAS", "COLETES", "CONTENTORES", "ACESSORIOS", "DIVERSOS"] },
];

function padShelf(n: number) {
  return `P${String(n).padStart(2, "0")}`;
}

function legacyForNumber(n: number) {
  const idx = n - 1;
  const corridor = ["A", "B", "C", "D"][Math.floor(idx / 5)];
  const section = (idx % 5) + 1;
  return [`${corridor}-${section}`, `${corridor}${section}`, `${corridor}.${section}`];
}

export const STOCK_SHELVES: StockShelf[] = Array.from({ length: STOCK_SHELF_COUNT }, (_, i) => {
  const number = i + 1;
  const row = Math.floor(i / 5);
  const col = (i % 5) + 1;
  const zoneMeta = ZONE_BY_ROW[row] || ZONE_BY_ROW[ZONE_BY_ROW.length - 1];
  return {
    code: padShelf(number),
    number,
    label: `Prateleira ${number}`,
    zone: zoneMeta.zone,
    row: row + 1,
    col,
    legacyCodes: legacyForNumber(number),
    suggestedCategories: zoneMeta.categories,
  };
});

const SHELF_BY_CODE = new Map<string, StockShelf>();
const ALIAS_TO_CODE = new Map<string, string>();

function registerAlias(alias: string, code: string) {
  const key = normalizeShelfToken(alias);
  if (key) ALIAS_TO_CODE.set(key, code);
}

for (const shelf of STOCK_SHELVES) {
  SHELF_BY_CODE.set(shelf.code, shelf);
  registerAlias(shelf.code, shelf.code);
  registerAlias(shelf.label, shelf.code);
  registerAlias(`Prateleira ${shelf.number}`, shelf.code);
  registerAlias(`P${shelf.number}`, shelf.code);
  registerAlias(String(shelf.number), shelf.code);
  registerAlias(String(shelf.number).padStart(2, "0"), shelf.code);
  for (const legacy of shelf.legacyCodes) {
    registerAlias(legacy, shelf.code);
  }
}

export function normalizeShelfToken(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/PRATELEIRA\s*/g, "P")
    .replace(/[^A-Z0-9]+/g, "")
    .trim();
}

/** Resolve qualquer formato livre para código canónico P01..P20 (ou null). */
export function resolveShelfCode(value: unknown): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const direct = ALIAS_TO_CODE.get(normalizeShelfToken(raw));
  if (direct) return direct;

  // "P-01", "Prat. 7", "local P12 fundo"
  const matchP = raw.toUpperCase().match(/\bP\s*[-.]?\s*(\d{1,2})\b/);
  if (matchP) {
    const n = Number(matchP[1]);
    if (n >= 1 && n <= STOCK_SHELF_COUNT) return padShelf(n);
  }

  const matchLegacy = raw.toUpperCase().match(/\b([A-D])\s*[-.]?\s*([1-5])\b/);
  if (matchLegacy) {
    const corridor = matchLegacy[1];
    const section = Number(matchLegacy[2]);
    const corridorIdx = ["A", "B", "C", "D"].indexOf(corridor);
    if (corridorIdx >= 0 && section >= 1 && section <= 5) {
      return padShelf(corridorIdx * 5 + section);
    }
  }

  const onlyNum = raw.match(/^(\d{1,2})$/);
  if (onlyNum) {
    const n = Number(onlyNum[1]);
    if (n >= 1 && n <= STOCK_SHELF_COUNT) return padShelf(n);
  }

  return null;
}

export function getShelf(codeOrRaw: unknown): StockShelf | null {
  const code = resolveShelfCode(codeOrRaw);
  if (!code) return null;
  return SHELF_BY_CODE.get(code) || null;
}

export function formatShelfLabel(codeOrRaw: unknown) {
  const shelf = getShelf(codeOrRaw);
  if (!shelf) {
    const raw = String(codeOrRaw || "").trim();
    return raw || "Sem prateleira";
  }
  return `${shelf.code} · ${shelf.label}`;
}

export function shelfMatchesLocation(location: unknown, shelfCode: string) {
  const resolved = resolveShelfCode(location);
  if (!resolved) return false;
  return resolved === resolveShelfCode(shelfCode);
}

export function suggestShelfForCategory(categoria: unknown): string {
  const cat = String(categoria || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  for (const shelf of STOCK_SHELVES) {
    if (shelf.suggestedCategories.some((c) => cat.includes(c) || c.includes(cat))) {
      return shelf.code;
    }
  }
  return "P20";
}

export function groupItemsByShelf<T extends { localizacao?: string | null }>(items: T[]) {
  const buckets = new Map<string, T[]>();
  const unassigned: T[] = [];

  for (const shelf of STOCK_SHELVES) {
    buckets.set(shelf.code, []);
  }

  for (const item of items) {
    const code = resolveShelfCode(item.localizacao);
    if (!code || !buckets.has(code)) {
      unassigned.push(item);
      continue;
    }
    buckets.get(code)!.push(item);
  }

  return { buckets, unassigned, shelves: STOCK_SHELVES };
}

export function buildShelfSummary(
  items: Array<{ localizacao?: string | null; quantidade?: number | null; id?: number }>
) {
  const { buckets, unassigned } = groupItemsByShelf(items);
  return {
    shelves: STOCK_SHELVES.map((shelf) => {
      const list = buckets.get(shelf.code) || [];
      const qty = list.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);
      return {
        ...shelf,
        itemCount: list.length,
        quantityTotal: qty,
        occupied: list.length > 0,
      };
    }),
    unassignedCount: unassigned.length,
    unassignedQuantity: unassigned.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0),
  };
}
