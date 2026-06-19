export type StockValidityManualMode = "AUTO" | "SIM" | "NAO";

export const STOCK_APPLICABILITY_TYPES = [
  "JANGADAS",
  "COLETES",
  "TUBOS_ALTA_PRESSAO",
  "EPIRBS",
  "PIROTECNICOS",
  "CONTENTORES",
  "CILINDROS",
  "GERAL",
] as const;

export type StockApplicabilityType = (typeof STOCK_APPLICABILITY_TYPES)[number];

type StockMetadataPayload = {
  validadeAplicavel?: boolean | null;
  aplicavelTipos?: string[];
};

const STOCK_META_MARKER = "[[STOCK_META:";

function normalizeApplicabilityType(value: unknown): StockApplicabilityType | null {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return null;
  return (STOCK_APPLICABILITY_TYPES as readonly string[]).includes(raw)
    ? (raw as StockApplicabilityType)
    : null;
}

function normalizeApplicabilityTypes(values: unknown): StockApplicabilityType[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => normalizeApplicabilityType(value))
        .filter((value): value is StockApplicabilityType => Boolean(value))
    )
  );
}

function parseRawStockMetadata(observacoes?: string | null): StockMetadataPayload {
  const raw = String(observacoes || "");
  const markerIndex = raw.lastIndexOf(STOCK_META_MARKER);
  if (markerIndex < 0) return {};

  const endIndex = raw.indexOf("]]", markerIndex + STOCK_META_MARKER.length);
  if (endIndex < 0) return {};

  const payloadStr = raw.slice(markerIndex + STOCK_META_MARKER.length, endIndex).trim();
  if (!payloadStr) return {};

  try {
    const parsed = JSON.parse(payloadStr) as StockMetadataPayload;
    return {
      validadeAplicavel:
        typeof parsed?.validadeAplicavel === "boolean" ? parsed.validadeAplicavel : null,
      aplicavelTipos: normalizeApplicabilityTypes(parsed?.aplicavelTipos),
    };
  } catch {
    return {};
  }
}

export function stripStockMetadataToken(observacoes?: string | null): string {
  const raw = String(observacoes || "");
  const markerIndex = raw.lastIndexOf(STOCK_META_MARKER);
  if (markerIndex < 0) return raw.trim();

  const endIndex = raw.indexOf("]]", markerIndex + STOCK_META_MARKER.length);
  if (endIndex < 0) return raw.trim();

  return `${raw.slice(0, markerIndex)}${raw.slice(endIndex + 2)}`.trim();
}

export function getStockValidityManualMode(observacoes?: string | null): StockValidityManualMode {
  const metadata = parseRawStockMetadata(observacoes);
  if (metadata.validadeAplicavel === true) return "SIM";
  if (metadata.validadeAplicavel === false) return "NAO";
  return "AUTO";
}

export function getStockApplicabilityTypes(observacoes?: string | null): StockApplicabilityType[] {
  const metadata = parseRawStockMetadata(observacoes);
  return normalizeApplicabilityTypes(metadata.aplicavelTipos);
}

function serializeStockMetadata(metadata: StockMetadataPayload): string | null {
  const payload: StockMetadataPayload = {};
  if (typeof metadata.validadeAplicavel === "boolean") {
    payload.validadeAplicavel = metadata.validadeAplicavel;
  }
  const aplicavelTipos = normalizeApplicabilityTypes(metadata.aplicavelTipos);
  if (aplicavelTipos.length > 0) {
    payload.aplicavelTipos = aplicavelTipos;
  }

  if (!Object.keys(payload).length) return null;
  return `${STOCK_META_MARKER}${JSON.stringify(payload)}]]`;
}

export function parseStockValidityManualInput(value: unknown): boolean | null | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "boolean") return value;

  const raw = String(value).trim().toUpperCase();
  if (raw === "SIM" || raw === "TRUE" || raw === "1") return true;
  if (raw === "NAO" || raw === "NÃO" || raw === "FALSE" || raw === "0") return false;
  if (raw === "AUTO") return null;
  return undefined;
}

export function upsertStockMetadataInObservacoes(
  observacoes: unknown,
  patch: { validadeAplicavel?: boolean | null | undefined; aplicavelTipos?: unknown }
): string | null {
  const base = stripStockMetadataToken(String(observacoes || ""));
  const current = parseRawStockMetadata(String(observacoes || ""));

  const merged: StockMetadataPayload = {
    validadeAplicavel:
      patch.validadeAplicavel === undefined ? current.validadeAplicavel ?? null : patch.validadeAplicavel,
    aplicavelTipos:
      patch.aplicavelTipos === undefined
        ? normalizeApplicabilityTypes(current.aplicavelTipos)
        : normalizeApplicabilityTypes(patch.aplicavelTipos),
  };

  const metadataToken = serializeStockMetadata(merged);
  const joined = [base, metadataToken].filter(Boolean).join(base && metadataToken ? "\n\n" : "").trim();
  return joined || null;
}
