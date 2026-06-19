"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildChecklistInitialValues, buildInspectionChecklistFromQuadro, type ChecklistField, type ChecklistRaftInput } from "@/modules/inspectionChecklist";

type Row = Record<string, string | number | null>;

type AnalyzeResult = {
  fileName: string;
  fileType: "pdf" | "excel";
  sizeBytes: number;
  summary: {
    estimatedRecords?: number;
    sheetCount?: number;
    words?: number;
    lines?: number;
  };
  preview: {
    columns: string[];
    rows: Row[];
    rawTextFull?: string;
    originalSheetHtml?: string;
    sourceSheetName?: string;
    extractedHeader?: HeaderFields;
    analysis?: {
      documentKind: "generated-certificate" | "generated-quadro" | "external-certificate" | "unknown";
      totalRows: number;
      flaggedRowsCount: number;
      manufacturingDateRows: number;
      nonExpiringRows: number;
      flaggedRows: Array<{
        rowNumber: number;
        item: string | null;
        reasons: string[];
      }>;
      autoRules: string[];
    };
  };
};

type BatchAnalyzeItem = {
  fileName: string;
  status: "ok" | "error";
  result?: AnalyzeResult;
  error?: string;
};

type HeaderFields = {
  certificadoNumero: string;
  shipName: string;
  ownerName: string;
  raftSerial: string;
  brand: string;
  model: string;
  emergencyPackType: string;
  capacity: string;
  dataInspecao: string;
  dataProxInspecao: string;
  cylinderSerial: string;
  cylinderCo2: string;
  cylinderN2: string;
  cylinderTara: string;
  cylinderPesoBruto: string;
  cylinderSistema: string;
};

type InspectionChecklistValues = Record<string, string | number | boolean>;

type PreviewTab = "certificate" | "checklist";
type HeaderFieldKey = keyof HeaderFields;

const HEADER_LOOKUP_TERMS: Record<HeaderFieldKey, string[]> = {
  certificadoNumero: ["certificado", "certificate"],
  shipName: ["navio", "embarcacao", "ship", "vessel"],
  ownerName: ["armador", "proprietario", "owner", "cliente"],
  raftSerial: ["serial", "serie", "raft"],
  brand: ["marca", "brand"],
  model: ["modelo", "model"],
  emergencyPackType: ["pack", "solas", "iso", "orc"],
  capacity: ["lotacao", "capacidade", "capacity"],
  dataInspecao: ["data inspecao", "inspecao", "inspection date"],
  dataProxInspecao: ["proxima inspecao", "prox inspecao", "validade", "expiry"],
  cylinderSerial: ["serial cilindro", "cilindro serial", "cylinder serial"],
  cylinderCo2: ["co2"],
  cylinderN2: ["n2"],
  cylinderTara: ["tara"],
  cylinderPesoBruto: ["peso bruto"],
  cylinderSistema: ["sistema insuflacao", "inflation system", "sistema"],
};

const HEADER_LABEL_HINTS = [
  ...Array.from(new Set(Object.values(HEADER_LOOKUP_TERMS).flat())),
  "serial no",
  "date of manuf",
  "manufacture",
  "identification",
  "cylinders",
  "equipment",
  "verification",
  "service station",
  "type",
  "nome e no estacao",
];

const REQUIRED_HEADER_FIELDS: HeaderFieldKey[] = [
  "brand",
  "model",
  "raftSerial",
  "capacity",
  "dataInspecao",
  "dataProxInspecao",
  "shipName",
  "ownerName",
  "cylinderSerial",
];

const REQUIRED_CHECKLIST_FIELD_NAMES = new Set([
  "serial",
  "ship",
  "brand_model",
  "capacity",
  "owner",
  "packType",
  "equip_pack_type",
  "cilindro_co2",
  "cabeca_disparo",
  "comprimento_retenida",
]);

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizeCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

function asText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function asPositiveInt(value: unknown): number | undefined {
  const parsed = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.floor(parsed);
}

function toIsoDate(value: unknown): string | undefined {
  const text = asText(value);
  if (!text) return undefined;

  const mmYyyyMatch = text.match(/^(\d{2})[\/-](\d{4})$/);
  if (mmYyyyMatch) {
    const [, mm, yyyy] = mmYyyyMatch;
    return `${yyyy}-${mm}-01`;
  }

  const mmYyMatch = text.match(/^(\d{2})[\/-](\d{2})$/);
  if (mmYyMatch) {
    const [, mm, yy] = mmYyMatch;
    return `20${yy}-${mm}-01`;
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return text;

  const ptMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ptMatch) {
    const [, dd, mm, yyyy] = ptMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const dashMatch = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashMatch) {
    const [, dd, mm, yyyy] = dashMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const dotMatch = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotMatch) {
    const [, dd, mm, yyyy] = dotMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

function findRowValue(row: Row, terms: string[]): string {
  for (const [key, value] of Object.entries(row)) {
    const keyNorm = normalizeKey(key);
    if (terms.some((term) => keyNorm.includes(term))) {
      const text = normalizeCell(value).trim();
      if (text) return text;
    }
  }
  return "";
}

function rowHasManufacturingDateMarker(row: Row): boolean {
  const rowText = Object.entries(row)
    .map(([key, value]) => `${normalizeCell(key)} ${normalizeCell(value)}`.trim())
    .join(" ");
  const normalized = normalizeKey(rowText);
  return (
    normalized.includes("data fabrico") ||
    normalized.includes("manuf date") ||
    normalized.includes("fabrication date")
  );
}

function findAnyDateInRow(row: Row): string | undefined {
  for (const value of Object.values(row)) {
    const iso = toIsoDate(value);
    if (iso) return iso;
  }
  return undefined;
}

function detectKnownArticleNameFromRow(row: Row): string {
  const rowText = Object.entries(row)
    .map(([key, value]) => `${normalizeCell(key)} ${normalizeCell(value)}`.trim())
    .join(" ");
  const normalized = normalizeKey(rowText);

  const matchers: Array<{ tokens: string[]; label: string }> = [
    { tokens: ["fachos de mao", "fachos mao", "hand flare", "red hand flare"], label: "Fachos de Mão" },
    { tokens: ["paraquedas", "foguete paraquedas", "parachute rocket"], label: "Foguetes Paraquedas" },
    { tokens: ["farmacia", "first aid", "primeiros socorros", "ambulancia", "ambulância"], label: "Farmácia Solas" },
    { tokens: ["comprimidos", "enjoo", "seasickness", "anti sea sickness"], label: "Comprimidos p/ Enjoo" },
    { tokens: ["agua potavel", "drinking water", "water"], label: "Saco de Água" },
    { tokens: ["racoes", "food ration", "racao alimentar"], label: "Rações Alimentares 0,5 Kg" },
    { tokens: ["potes de fumo", "smoke signal", "fumigeno"], label: "Potes de Fumo" },
    { tokens: ["pilhas lanterna", "torch batteries"], label: "Pilhas para Lanterna" },
    { tokens: ["lanterna", "torch"], label: "Lanterna" },
  ];

  const found = matchers.find((matcher) =>
    matcher.tokens.some((token) => normalized.includes(normalizeKey(token))),
  );

  return found?.label || "";
}

function extractChecklistArticles(rows: Row[]) {
  const seen = new Set<string>();

  return rows.reduce<Array<{ name?: string; validade?: string; quantidade?: number; referencia?: string }>>((acc, row) => {
    const name =
      findRowValue(row, ["item", "artigo", "descricao", "material", "conteudo", "content"]) ||
      detectKnownArticleNameFromRow(row) ||
      "";
    const validade =
      toIsoDate(findRowValue(row, ["validade", "expiry", "vencimento", "validity"])) ||
      findAnyDateInRow(row) ||
      undefined;
    const referencia = findRowValue(row, ["referencia", "ref", "codigo"]) || undefined;
    const quantidade = asPositiveInt(findRowValue(row, ["quantidade", "qty", "qtd"]));

    if (!name) return acc;
    if (rowHasManufacturingDateMarker(row)) return acc;

    const key = `${name}__${validade || ""}__${referencia || ""}`.toLowerCase();
    if (seen.has(key)) return acc;
    seen.add(key);

    acc.push({
      name,
      validade,
      quantidade,
      referencia,
    });
    return acc;
  }, []);
}

function buildChecklistPreviewInput(header: HeaderFields, rows: Row[]): ChecklistRaftInput {
  return {
    serial: asText(header.raftSerial) || undefined,
    brand: asText(header.brand) || undefined,
    model: asText(header.model) || undefined,
    capacity: asPositiveInt(header.capacity),
    owner: asText(header.ownerName) || undefined,
    packType: asText(header.emergencyPackType) || undefined,
    dataInspecao: toIsoDate(header.dataInspecao) || asText(header.dataInspecao) || undefined,
    dataProxInspecao: toIsoDate(header.dataProxInspecao) || asText(header.dataProxInspecao) || undefined,
    shipNameManual: asText(header.shipName) || undefined,
    cylinder: {
      serial: asText(header.cylinderSerial) || undefined,
      co2: asText(header.cylinderCo2) || undefined,
      n2: asText(header.cylinderN2) || undefined,
      tara: asText(header.cylinderTara) || undefined,
      pesoBruto: asText(header.cylinderPesoBruto) || undefined,
      sistema: asText(header.cylinderSistema) || undefined,
    },
    artigos: extractChecklistArticles(rows),
  };
}

function formatChecklistFieldValue(value: string | number | boolean | undefined, type: "text" | "number" | "checkbox" | "date" | "select") {
  if (type === "checkbox") {
    return value ? "Conforme" : "Pendente";
  }
  const text = value == null ? "" : String(value).trim();
  return text || "—";
}

function headerFieldIsMissing(field: HeaderFieldKey, header: HeaderFields) {
  return REQUIRED_HEADER_FIELDS.includes(field) && !asText(header[field]);
}

function fieldHasMeaningfulValue(value: string | number | boolean | undefined, type: ChecklistField["type"]) {
  if (type === "checkbox") return Boolean(value);
  return String(value ?? "").trim().length > 0;
}

function checklistFieldIsRequired(field: ChecklistField) {
  return Boolean(field.required) || REQUIRED_CHECKLIST_FIELD_NAMES.has(field.name);
}

function checklistFieldIsMissing(field: ChecklistField, value: string | number | boolean | undefined) {
  return !fieldHasMeaningfulValue(value, field.type);
}

function normalizeInspectionChecklistValues(raw: unknown): InspectionChecklistValues {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  return Object.entries(raw as Record<string, unknown>).reduce<InspectionChecklistValues>((acc, [key, value]) => {
    if (!key) return acc;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function normalizeKey(input: string): string {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sanitizeExtractedCandidate(value: string): string {
  return String(value || "")
    .replace(/^[\s:;\-–—]+/, "")
    .replace(/[\s:;\-–—]+$/, "")
    .trim();
}

function looksLikeHeaderLabel(value: string): boolean {
  const norm = normalizeKey(value);
  if (!norm) return false;

  if (/^[a-z\s]{2,18}$/.test(norm) && HEADER_LABEL_HINTS.some((hint) => norm === normalizeKey(hint))) {
    return true;
  }

  return HEADER_LABEL_HINTS.some((hint) => {
    const normHint = normalizeKey(hint);
    return norm === normHint || norm.startsWith(`${normHint} `) || norm.endsWith(` ${normHint}`);
  });
}

function hasAnyDigit(value: string): boolean {
  return /\d/.test(value);
}

function isValidHeaderFieldCandidate(field: HeaderFieldKey, value: string): boolean {
  const text = sanitizeExtractedCandidate(value);
  if (!text) return false;
  if (looksLikeHeaderLabel(text)) return false;

  switch (field) {
    case "capacity":
      return Boolean(parseHeaderCapacity(text));
    case "dataInspecao":
    case "dataProxInspecao":
      return Boolean(normalizeHeaderDateCandidate(text));
    case "cylinderCo2":
    case "cylinderN2":
    case "cylinderTara":
    case "cylinderPesoBruto":
      return hasAnyDigit(text);
    case "certificadoNumero":
      return text.length >= 3 && hasAnyDigit(text);
    case "raftSerial":
    case "cylinderSerial":
      return text.length >= 3 && /[a-z0-9]/i.test(text);
    case "shipName":
    case "ownerName":
      return text.length >= 3 && !/^serial\b/i.test(text) && !/^date\b/i.test(text);
    case "brand":
      return text.length >= 2 && !/serial|date|contents/i.test(text);
    case "model":
      return text.length >= 2 && !/serial no|date of manuf|inspection|verification/i.test(text);
    case "emergencyPackType":
      return text.length >= 2 && !/serial|date|owner|ship/i.test(text);
    case "cylinderSistema":
      return text.length >= 2 && !/serial|date/i.test(text);
    default:
      return text.length > 0;
  }
}

function normalizeHeaderDateCandidate(value: string): string {
  const text = sanitizeExtractedCandidate(value);
  if (!text) return "";

  const mmYyyyMatch = text.match(/^(\d{2})[\/-](\d{4})$/);
  if (mmYyyyMatch) {
    const [, mm, yyyy] = mmYyyyMatch;
    return `${yyyy}-${mm}-01`;
  }

  const mmYyMatch = text.match(/^(\d{2})[\/-](\d{2})$/);
  if (mmYyMatch) {
    const [, mm, yy] = mmYyMatch;
    return `20${yy}-${mm}-01`;
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return text;

  const ptMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ptMatch) {
    const [, dd, mm, yyyy] = ptMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const dashMatch = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashMatch) {
    const [, dd, mm, yyyy] = dashMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const dotMatch = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotMatch) {
    const [, dd, mm, yyyy] = dotMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  if (/^\d{5}$/.test(text)) {
    const serial = Number(text);
    if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
      const excelEpochUtc = Date.UTC(1899, 11, 30);
      const converted = new Date(excelEpochUtc + serial * 24 * 60 * 60 * 1000);
      return converted.toISOString().slice(0, 10);
    }
  }

  return "";
}

function parseHeaderCapacity(value: string): string {
  const text = sanitizeExtractedCandidate(value);
  if (!text) return "";

  const normalized = normalizeKey(text);
  const match = normalized.match(/\b(\d{1,3})\b/);
  if (!match) return "";

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 200) return "";
  return String(Math.floor(amount));
}

function matchesTerms(normalizedText: string, normalizedTerms: string[]): boolean {
  return normalizedTerms.some((term) => normalizedText.includes(term));
}

function pickNeighborCandidates(cells: string[], index: number, normalizedTerms: string[]): Array<{ value: string; score: number }> {
  const lookups = [1, 2, -1, -2];
  const candidates: Array<{ value: string; score: number }> = [];

  for (const delta of lookups) {
    const neighbor = sanitizeExtractedCandidate(cells[index + delta] || "");
    if (!neighbor) continue;
    const norm = normalizeKey(neighbor);
    if (!norm) continue;
    if (matchesTerms(norm, normalizedTerms)) continue;
    if (looksLikeHeaderLabel(neighbor)) continue;
    const score = delta > 0 ? (Math.abs(delta) === 1 ? 5 : 4) : (Math.abs(delta) === 1 ? 3 : 2);
    candidates.push({ value: neighbor, score });
  }
  return candidates;
}

function collectHeaderCandidates(rows: Row[], terms: string[]): Array<{ value: string; score: number; rowIndex: number }> {
  const normalizedTerms = terms
    .map((term) => normalizeKey(term))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const candidates: Array<{ value: string; score: number; rowIndex: number }> = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const entries = Object.entries(row);

    for (const [key, value] of entries) {
      const keyNorm = normalizeKey(key);
      if (!matchesTerms(keyNorm, normalizedTerms)) continue;
      const text = sanitizeExtractedCandidate(normalizeCell(value));
      if (!text || looksLikeHeaderLabel(text)) continue;
      candidates.push({ value: text, score: 8, rowIndex });
    }

    const cells = entries.map(([, value]) => sanitizeExtractedCandidate(normalizeCell(value)));
    for (let i = 0; i < cells.length; i += 1) {
      const cell = cells[i];
      if (!cell) continue;
      const cellNorm = normalizeKey(cell);
      if (!matchesTerms(cellNorm, normalizedTerms)) continue;

      const parts = cell.split(/[:：]/);
      if (parts.length > 1) {
        const inlineValue = sanitizeExtractedCandidate(parts.slice(1).join(":"));
        if (inlineValue) {
          const inlineNorm = normalizeKey(inlineValue);
          if (!matchesTerms(inlineNorm, normalizedTerms) && !looksLikeHeaderLabel(inlineValue)) {
            candidates.push({ value: inlineValue, score: 7, rowIndex });
          }
        }
      }

      const neighborCandidates = pickNeighborCandidates(cells, i, normalizedTerms);
      neighborCandidates.forEach((candidate) => {
        candidates.push({ value: candidate.value, score: candidate.score, rowIndex });
      });
    }
  }

  const deduped = new Map<string, { value: string; score: number; rowIndex: number }>();
  candidates.forEach((candidate) => {
    const key = normalizeKey(candidate.value);
    if (!key) return;
    const current = deduped.get(key);
    if (!current || candidate.score > current.score) {
      deduped.set(key, candidate);
    }
  });

  return Array.from(deduped.values()).sort((a, b) => b.score - a.score || a.rowIndex - b.rowIndex);
}

function scoreHeaderCandidate(field: HeaderFieldKey, value: string): number {
  const text = sanitizeExtractedCandidate(value);
  if (!isValidHeaderFieldCandidate(field, text)) return -1;

  let score = 0;
  switch (field) {
    case "dataInspecao":
    case "dataProxInspecao":
      score += normalizeHeaderDateCandidate(text) ? 12 : 0;
      break;
    case "capacity":
      score += parseHeaderCapacity(text) ? 10 : 0;
      break;
    case "shipName":
    case "ownerName": {
      const norm = normalizeKey(text);
      if (/\d{4}/.test(norm)) score -= 3;
      if (/\bserial\b|\bco2\b|\bn2\b/.test(norm)) score -= 4;
      if (/[a-z]/i.test(text)) score += 4;
      if (text.split(/\s+/).length >= 2) score += 2;
      break;
    }
    case "brand":
    case "model":
      if (/\d/.test(text)) score += 1;
      if (/[a-z]/i.test(text)) score += 3;
      break;
    default:
      if (/[a-z0-9]/i.test(text)) score += 2;
      break;
  }

  return score;
}

function normalizeResolvedHeaderValue(field: HeaderFieldKey, value: string): string {
  const text = sanitizeExtractedCandidate(value);
  if (!text) return "";

  if (field === "dataInspecao" || field === "dataProxInspecao") {
    return normalizeHeaderDateCandidate(text);
  }

  if (field === "capacity") {
    return parseHeaderCapacity(text);
  }

  return text;
}

function resolveHeaderField(rows: Row[], field: HeaderFieldKey): string {
  const terms = HEADER_LOOKUP_TERMS[field];
  const candidates = collectHeaderCandidates(rows, terms);
  if (candidates.length === 0) return "";

  const ranked = candidates
    .map((candidate) => {
      const normalized = normalizeResolvedHeaderValue(field, candidate.value);
      if (!normalized) return null;
      const validationScore = scoreHeaderCandidate(field, normalized);
      if (validationScore < 0) return null;
      return {
        value: normalized,
        score: candidate.score + validationScore,
        rowIndex: candidate.rowIndex,
      };
    })
    .filter((candidate): candidate is { value: string; score: number; rowIndex: number } => Boolean(candidate))
    .sort((a, b) => b.score - a.score || a.rowIndex - b.rowIndex);

  return ranked[0]?.value || "";
}

function inferHeader(rows: Row[]): HeaderFields {
  return {
    certificadoNumero: resolveHeaderField(rows, "certificadoNumero"),
    shipName: resolveHeaderField(rows, "shipName"),
    ownerName: resolveHeaderField(rows, "ownerName"),
    raftSerial: resolveHeaderField(rows, "raftSerial"),
    brand: resolveHeaderField(rows, "brand"),
    model: resolveHeaderField(rows, "model"),
    emergencyPackType: resolveHeaderField(rows, "emergencyPackType"),
    capacity: resolveHeaderField(rows, "capacity"),
    dataInspecao: resolveHeaderField(rows, "dataInspecao"),
    dataProxInspecao: resolveHeaderField(rows, "dataProxInspecao"),
    cylinderSerial: resolveHeaderField(rows, "cylinderSerial"),
    cylinderCo2: resolveHeaderField(rows, "cylinderCo2"),
    cylinderN2: resolveHeaderField(rows, "cylinderN2"),
    cylinderTara: resolveHeaderField(rows, "cylinderTara"),
    cylinderPesoBruto: resolveHeaderField(rows, "cylinderPesoBruto"),
    cylinderSistema: resolveHeaderField(rows, "cylinderSistema"),
  };
}

const EMPTY_HEADER: HeaderFields = {
  certificadoNumero: "",
  shipName: "",
  ownerName: "",
  raftSerial: "",
  brand: "",
  model: "",
  emergencyPackType: "",
  capacity: "",
  dataInspecao: "",
  dataProxInspecao: "",
  cylinderSerial: "",
  cylinderCo2: "",
  cylinderN2: "",
  cylinderTara: "",
  cylinderPesoBruto: "",
  cylinderSistema: "",
};

export default function IaImportacaoPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [selectedName, setSelectedName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState("A aguardar ficheiro...");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [batchResults, setBatchResults] = useState<BatchAnalyzeItem[]>([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number>(-1);
  const [editableRows, setEditableRows] = useState<Row[]>([]);
  const [headerDraft, setHeaderDraft] = useState<HeaderFields>(EMPTY_HEADER);
  const [activePreviewTab, setActivePreviewTab] = useState<PreviewTab>("certificate");
  const [checklistOverrides, setChecklistOverrides] = useState<InspectionChecklistValues>({});

  const [trainingNotes, setTrainingNotes] = useState("");
  const [isSubmittingTraining, setIsSubmittingTraining] = useState(false);
  const [isApplyingImport, setIsApplyingImport] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const previewColumns = useMemo(() => result?.preview.columns ?? [], [result]);
  const analysisSummary = useMemo(() => result?.preview.analysis ?? null, [result]);
  const checklistPreviewRaft = useMemo(
    () => buildChecklistPreviewInput(headerDraft, editableRows),
    [headerDraft, editableRows],
  );
  const checklistPreviewSections = useMemo(
    () => buildInspectionChecklistFromQuadro(checklistPreviewRaft),
    [checklistPreviewRaft],
  );
  const checklistPreviewValues = useMemo<InspectionChecklistValues>(
    () => buildChecklistInitialValues(checklistPreviewSections, checklistPreviewRaft),
    [checklistPreviewRaft, checklistPreviewSections],
  );
  const editableChecklistValues = useMemo<InspectionChecklistValues>(
    () => ({ ...checklistPreviewValues, ...normalizeInspectionChecklistValues(checklistOverrides) }),
    [checklistPreviewValues, checklistOverrides],
  );
  const missingHeaderFields = useMemo(
    () => REQUIRED_HEADER_FIELDS.filter((field) => headerFieldIsMissing(field, headerDraft)),
    [headerDraft],
  );
  const checklistFieldStatuses = useMemo(() => {
    const flatFields = checklistPreviewSections.flatMap((section) => section.fields);
    return flatFields.map((field) => {
      const value = editableChecklistValues[field.name];
      const missing = checklistFieldIsMissing(field, value);
      const required = checklistFieldIsRequired(field);
      return {
        field,
        value,
        missing,
        required,
      };
    });
  }, [checklistPreviewSections, editableChecklistValues]);
  const missingRequiredChecklistCount = useMemo(
    () => checklistFieldStatuses.filter(({ missing, required }) => missing && required).length,
    [checklistFieldStatuses],
  );
  const pendingChecklistCount = useMemo(
    () => checklistFieldStatuses.filter(({ missing }) => missing).length,
    [checklistFieldStatuses],
  );
  const checklistCompletion = useMemo(() => {
    const flatFields = checklistPreviewSections.flatMap((section) => section.fields);
    const total = flatFields.length;
    const completed = flatFields.filter((field) => {
      const value = editableChecklistValues[field.name];
      if (field.type === "checkbox") return Boolean(value);
      return String(value ?? "").trim().length > 0;
    }).length;
    return { total, completed };
  }, [checklistPreviewSections, editableChecklistValues]);

  const getCertificateInputClass = (field: HeaderFieldKey, dark = false) => {
    const missing = headerFieldIsMissing(field, headerDraft);
    const base = dark
      ? "text-white text-xs px-2 py-1 rounded w-40 border focus:outline-none placeholder-slate-500"
      : "border rounded px-2 py-1 text-xs focus:bg-white focus:outline-none w-full";

    if (dark) {
      return `${base} ${missing ? "bg-red-950/60 border-red-400 focus:border-red-300" : "bg-slate-700 border-slate-600 focus:border-blue-400"}`;
    }

    return `${base} ${missing ? "border-amber-400 bg-amber-50 focus:border-amber-500" : "border-slate-200 bg-slate-50 focus:border-blue-400"}`;
  };

  useEffect(() => {
    setChecklistOverrides({});
  }, [result?.fileName]);

  const setProgressState = (value: number, label: string) => {
    setProgress(value);
    setProgressStep(label);
  };

  const analyzeFile = async (file: File): Promise<AnalyzeResult> => {
    setSelectedName(file.name);
    setError(null);
    setFeedbackMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/ia-importacao/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Não foi possível analisar o ficheiro.");
    return data as AnalyzeResult;
  };

  const applyAnalyzedResultToEditor = (parsed: AnalyzeResult) => {
    setResult(parsed);
    setEditableRows(parsed.preview.rows.map((row) => ({ ...row })));
    setHeaderDraft(parsed.preview.extractedHeader || inferHeader(parsed.preview.rows));
    setChecklistOverrides({});
  };

  const analyzeSingleFile = async (file: File) => {
    setResult(null);
    setEditableRows([]);
    setHeaderDraft(EMPTY_HEADER);
    setBatchResults([]);
    setSelectedBatchIndex(-1);

    setIsAnalyzing(true);
    setProgressState(10, "Upload do ficheiro...");
    try {
      setProgressState(40, "Análise IA em execução...");
      const parsed = await analyzeFile(file);
      setProgressState(80, "Extração e estruturação dos dados...");
      applyAnalyzedResultToEditor(parsed);
      setProgressState(100, "Concluído. Dados prontos para revisão e importação.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado na análise.");
      setProgressState(0, "Falha na análise.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeFilesInBatch = async (files: File[]) => {
    if (files.length === 0) return;

    setResult(null);
    setEditableRows([]);
    setHeaderDraft(EMPTY_HEADER);
    setBatchResults([]);
    setSelectedBatchIndex(-1);
    setError(null);
    setFeedbackMessage(null);

    setIsAnalyzing(true);

    const nextBatch: BatchAnalyzeItem[] = [];
    try {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const startPct = Math.round((i / files.length) * 100);
        const endPct = Math.round(((i + 1) / files.length) * 100);
        setProgressState(Math.max(5, startPct), `A analisar ficheiro ${i + 1}/${files.length}: ${file.name}`);
        try {
          const parsed = await analyzeFile(file);
          nextBatch.push({ fileName: file.name, status: "ok", result: parsed });
          setProgressState(Math.max(10, endPct), `Concluído ${i + 1}/${files.length}: ${file.name}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Erro na análise.";
          nextBatch.push({ fileName: file.name, status: "error", error: message });
          setProgressState(Math.max(10, endPct), `Falha ${i + 1}/${files.length}: ${file.name}`);
        }
        setBatchResults([...nextBatch]);
      }

      const firstOkIndex = nextBatch.findIndex((item) => item.status === "ok" && item.result);
      if (firstOkIndex >= 0) {
        setSelectedBatchIndex(firstOkIndex);
        applyAnalyzedResultToEditor(nextBatch[firstOkIndex].result!);
      } else {
        setError("Nenhum ficheiro do lote foi analisado com sucesso.");
      }

      setProgressState(100, "Lote concluído. Selecione um ficheiro analisado para rever e importar.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (files.length === 1) {
      await analyzeSingleFile(files[0]);
    } else {
      await analyzeFilesInBatch(files);
    }
    e.target.value = "";
  };

  const handleCellChange = (rowIndex: number, column: string, value: string) => {
    setEditableRows((prev) => prev.map((row, idx) => (idx === rowIndex ? { ...row, [column]: value } : row)));
  };

  const handleHeaderChange = (field: keyof HeaderFields, value: string) => {
    setHeaderDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleChecklistFieldChange = (fieldName: string, value: string | number | boolean) => {
    setChecklistOverrides((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleChecklistFieldReset = (fieldName: string) => {
    setChecklistOverrides((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleResetChecklistOverrides = () => {
    setChecklistOverrides({});
  };

  const applyImportRequest = async () => {
    if (!result) throw new Error("Não existe análise pronta para importar.");

    const response = await fetch("/api/ia-importacao/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: result.fileName,
        fileType: result.fileType,
        extractedColumns: result.preview.columns,
        extractedHeader: result.preview.extractedHeader || inferHeader(result.preview.rows),
        correctedHeader: headerDraft,
        correctedRows: editableRows,
        inspectionChecklistValues: editableChecklistValues,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Falha ao importar para listas.");
    return data;
  };

  const handleSubmitCorrections = async () => {
    if (!result) return;
    setIsSubmittingTraining(true);
    setIsApplyingImport(true);
    setFeedbackMessage(null);
    try {
      const feedbackResponse = await fetch("/api/ia-importacao/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: result.fileName,
          fileType: result.fileType,
          extractedColumns: result.preview.columns,
          extractedHeader: result.preview.extractedHeader || inferHeader(result.preview.rows),
          correctedHeader: headerDraft,
          originalRows: result.preview.rows,
          correctedRows: editableRows,
          notes: trainingNotes,
        }),
      });
      const feedbackData = await feedbackResponse.json().catch(() => null);
      if (!feedbackResponse.ok) throw new Error(feedbackData?.error || "Não foi possível submeter as correções.");

      const applyData = await applyImportRequest();
      setFeedbackMessage(
        `Correções submetidas e dados gravados no Prisma com sucesso (inspeção #${applyData?.summary?.inspecaoId ?? "-"}, jangada #${applyData?.summary?.jangadaId ?? "-"}).`,
      );
    } catch (err) {
      setFeedbackMessage(err instanceof Error ? err.message : "Erro ao submeter correções.");
    } finally {
      setIsSubmittingTraining(false);
      setIsApplyingImport(false);
    }
  };

  const handleApplyImport = async () => {
    if (!result) return;
    setIsApplyingImport(true);
    setFeedbackMessage(null);
    try {
      const data = await applyImportRequest();
      setFeedbackMessage(`Importação concluída: cliente/navio/jangada/inspeções/artigos atualizados (inspeção #${data?.summary?.inspecaoId ?? "-"}).`);
    } catch (err) {
      setFeedbackMessage(err instanceof Error ? err.message : "Erro ao importar para listas.");
    } finally {
      setIsApplyingImport(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ferramenta IA de Análise</h1>
          <p className="text-gray-600">Edite certificado extraído + quadro completo e importe para listas após validação.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <section className="xl:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Upload e Progresso</h2>
            <div
              className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => inputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files || []);
                if (!files.length) return;
                if (files.length === 1) {
                  void analyzeSingleFile(files[0]);
                } else {
                  void analyzeFilesInBatch(files);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input ref={inputRef} type="file" accept=".pdf,.xls,.xlsx" multiple className="hidden" onChange={handleFileChange} />
              <p className="text-sm text-gray-700 font-medium">Clique ou arraste PDF/Excel (1 ou vários)</p>
            </div>

            {selectedName ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                <p><span className="font-semibold">Ficheiro:</span> {selectedName}</p>
                {result ? <p><span className="font-semibold">Tamanho:</span> {formatBytes(result.sizeBytes)}</p> : null}
              </div>
            ) : null}

            <div className="rounded-lg border border-gray-200 p-3 bg-white">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Análise / Extração</span>
                <span className="font-semibold text-gray-900">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-600 mt-2">{progressStep}</p>
            </div>

            {result ? (
              <div className="rounded-lg border border-gray-200 p-3 bg-white text-xs grid grid-cols-2 gap-2">
                <p><b>Tipo:</b> {result.fileType.toUpperCase()}</p>
                <p><b>Registos:</b> {result.summary.estimatedRecords ?? 0}</p>
                <p><b>Folhas/Linhas:</b> {result.fileType === "excel" ? (result.summary.sheetCount ?? 0) : (result.summary.lines ?? 0)}</p>
                <p><b>Palavras:</b> {result.summary.words ?? 0}</p>
              </div>
            ) : null}

            {analysisSummary ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
                <p className="font-semibold uppercase tracking-wide">Leitura inversa do certificado/quadro</p>
                <p>
                  <b>Origem detetada:</b>{" "}
                  {analysisSummary.documentKind === "generated-certificate"
                    ? "Certificado gerado"
                    : analysisSummary.documentKind === "generated-quadro"
                      ? "Quadro gerado"
                      : analysisSummary.documentKind === "external-certificate"
                        ? "Certificado externo"
                        : "Indefinido"}
                </p>
                <p><b>Linhas assinaladas:</b> {analysisSummary.flaggedRowsCount}</p>
                <p><b>Data fabrico:</b> {analysisSummary.manufacturingDateRows}</p>
                <p><b>Itens sem validade:</b> {analysisSummary.nonExpiringRows}</p>
                {analysisSummary.autoRules.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {analysisSummary.autoRules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {batchResults.length > 0 ? (
              <div className="rounded-lg border border-gray-200 p-3 bg-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">Ficheiros do lote</p>
                <div className="space-y-1 max-h-52 overflow-auto">
                  {batchResults.map((item, index) => (
                    <button
                      key={`${item.fileName}-${index}`}
                      type="button"
                      disabled={item.status !== "ok" || !item.result}
                      onClick={() => {
                        if (item.status !== "ok" || !item.result) return;
                        setSelectedBatchIndex(index);
                        setSelectedName(item.fileName);
                        setError(null);
                        applyAnalyzedResultToEditor(item.result);
                      }}
                      className={`w-full text-left rounded border px-2 py-1.5 text-xs ${selectedBatchIndex === index ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"} ${item.status !== "ok" ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-50"}`}
                    >
                      <span className="font-medium">{item.fileName}</span>
                      <span className={`ml-2 ${item.status === "ok" ? "text-emerald-700" : "text-red-700"}`}>
                        {item.status === "ok" ? "✓" : "✕"}
                      </span>
                      {item.status === "error" && item.error ? (
                        <span className="block mt-1 text-[11px] text-red-700">{item.error}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

            <button
              type="button"
              onClick={handleSubmitCorrections}
              disabled={!result || isSubmittingTraining || isApplyingImport}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-900 disabled:opacity-50"
            >
              {isSubmittingTraining || isApplyingImport ? "A submeter e gravar..." : "Submeter correção + gravar no Prisma"}
            </button>
            <button
              type="button"
              onClick={handleApplyImport}
              disabled={!result || isApplyingImport}
              className="w-full px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
            >
              {isApplyingImport ? "A importar..." : "Importar para listas"}
            </button>

            {feedbackMessage ? <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">{feedbackMessage}</div> : null}
          </section>

          <section className="xl:col-span-9 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Pré-visualização da Importação</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Alterne entre o certificado e o quadro de inspeção antes de gravar.</p>
                </div>
                <span className="text-xs text-gray-500">
                  {result ? "Reveja e edite os campos extraídos antes de importar" : "Carregue um ficheiro para pré-visualizar"}
                </span>
              </div>

              <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {([
                  { key: "certificate", label: "Certificado" },
                  { key: "checklist", label: "Quadro de Inspeção" },
                ] as { key: PreviewTab; label: string }[]).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActivePreviewTab(tab.key)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${activePreviewTab === tab.key ? "bg-slate-800 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activePreviewTab === "certificate" ? (
                <div className="rounded-xl border-2 border-slate-300 shadow-md overflow-hidden text-xs">
                {/* ── Header bar ── */}
                  <div className="flex items-center justify-between bg-slate-800 px-5 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-sm tracking-widest">
                      {headerDraft.brand ? headerDraft.brand.toUpperCase() : <span className="text-slate-500 italic font-normal text-xs">MARCA</span>}
                    </span>
                    {headerDraft.model && <span className="text-slate-400 text-xs">{headerDraft.model}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Certificado No.:</span>
                    <input
                      value={headerDraft.certificadoNumero}
                      onChange={(e) => handleHeaderChange("certificadoNumero", e.target.value)}
                      placeholder="—"
                      className={getCertificateInputClass("certificadoNumero", true)}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* ── Title ── */}
                  <div className="border-b border-slate-200 py-2 px-5 bg-slate-50 text-center">
                  <p className="font-bold text-[11px] tracking-widest uppercase text-slate-700">
                    Certificate of Re-Inspection · Certificado de Re-Inspecção
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    DGRM · IMO Resolution A.761(18)
                  </p>
                  {missingHeaderFields.length > 0 ? (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-medium text-amber-700">
                      <span>Campos obrigatórios em falta:</span>
                      <span>{missingHeaderFields.length}</span>
                    </div>
                  ) : (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[10px] font-medium text-emerald-700">
                      <span>Campos essenciais completos</span>
                    </div>
                  )}
                </div>

                {/* ── Two-column body ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">

                  {/* LEFT: Identification + Cylinders */}
                  <div className="divide-y divide-slate-100">

                    {/* Identification */}
                    <div className="px-5 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Identification · Identificação</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {([
                          { label: "Marca / Brand", field: "brand" },
                          { label: "Modelo", field: "model" },
                          { label: "Capacidade / Capacity", field: "capacity" },
                          { label: "No. Série / Serial No.", field: "raftSerial" },
                        ] as { label: string; field: keyof HeaderFields }[]).map(({ label, field }) => (
                          <div key={field} className="flex flex-col gap-0.5">
                            <span className={`text-[9px] uppercase font-medium ${headerFieldIsMissing(field, headerDraft) ? "text-amber-700" : "text-slate-400"}`}>
                              {label}{headerFieldIsMissing(field, headerDraft) ? " • obrigatório" : ""}
                            </span>
                            <input
                              value={headerDraft[field]}
                              onChange={(e) => handleHeaderChange(field, e.target.value)}
                              placeholder="—"
                              className={getCertificateInputClass(field)}
                              suppressHydrationWarning
                            />
                          </div>
                        ))}
                        <div className="col-span-2 flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase text-slate-400 font-medium">Emergency Pack Type / Equip. de Emergência</span>
                          <input
                            value={headerDraft.emergencyPackType}
                            onChange={(e) => handleHeaderChange("emergencyPackType", e.target.value)}
                            placeholder="—"
                            className={getCertificateInputClass("emergencyPackType")}
                            suppressHydrationWarning
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cylinders */}
                    <div className="px-5 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cylinders · Cilindros</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {([
                          { label: "Serial No.", field: "cylinderSerial" },
                          { label: "CO2 (kg)", field: "cylinderCo2" },
                          { label: "N2 (kg)", field: "cylinderN2" },
                          { label: "Tara (kg)", field: "cylinderTara" },
                          { label: "Peso Bruto (kg)", field: "cylinderPesoBruto" },
                          { label: "Sistema Insuflação", field: "cylinderSistema" },
                        ] as { label: string; field: keyof HeaderFields }[]).map(({ label, field }) => (
                          <div key={field} className="flex flex-col gap-0.5">
                            <span className={`text-[9px] uppercase font-medium ${headerFieldIsMissing(field, headerDraft) ? "text-amber-700" : "text-slate-400"}`}>
                              {label}{headerFieldIsMissing(field, headerDraft) ? " • obrigatório" : ""}
                            </span>
                            <input
                              value={headerDraft[field]}
                              onChange={(e) => handleHeaderChange(field, e.target.value)}
                              placeholder="—"
                              className={getCertificateInputClass(field)}
                              suppressHydrationWarning
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Verification + Ship Info + Status */}
                  <div className="divide-y divide-slate-100">

                    {/* Verification */}
                    <div className="px-5 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Verification · Verificação</p>
                      <div className="flex flex-col gap-2">
                        {([
                          { label: "Data Inspecção / Date of Inspection", field: "dataInspecao" },
                          { label: "Data Próx. Inspecção / Next Inspection", field: "dataProxInspecao" },
                        ] as { label: string; field: keyof HeaderFields }[]).map(({ label, field }) => (
                          <div key={field} className="flex flex-col gap-0.5">
                            <span className={`text-[9px] uppercase font-medium ${headerFieldIsMissing(field, headerDraft) ? "text-amber-700" : "text-slate-400"}`}>
                              {label}{headerFieldIsMissing(field, headerDraft) ? " • obrigatório" : ""}
                            </span>
                            <input
                              value={headerDraft[field]}
                              onChange={(e) => handleHeaderChange(field, e.target.value)}
                              placeholder="—"
                              className={getCertificateInputClass(field)}
                              suppressHydrationWarning
                            />
                          </div>
                        ))}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase text-slate-400 font-medium">Nome e No. Estação · Service Station</span>
                          <p className="border border-slate-200 rounded px-2 py-1 text-[8px] bg-slate-50 text-slate-600">
                            Orey Técnica Açores · 50937
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ship info */}
                    <div className="px-5 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Ship Info · Informação do Navio</p>
                      <div className="flex flex-col gap-2">
                        {([
                          { label: "Nome do Navio / Ship Name", field: "shipName" },
                          { label: "Armador / Ship Owner", field: "ownerName" },
                        ] as { label: string; field: keyof HeaderFields }[]).map(({ label, field }) => (
                          <div key={field} className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase text-slate-400 font-medium">{label}</span>
                            <input
                              value={headerDraft[field]}
                              onChange={(e) => handleHeaderChange(field, e.target.value)}
                              placeholder="—"
                              className="border border-slate-200 rounded px-2 py-1 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 w-full"
                              suppressHydrationWarning
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Completion status */}
                    <div className="px-5 py-3 bg-slate-50">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Estado · Completude</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {[
                          { label: "Identificação", check: !!(headerDraft.brand && headerDraft.model && headerDraft.raftSerial && headerDraft.capacity) },
                          { label: "Cilindros", check: !!(headerDraft.cylinderSerial && (headerDraft.cylinderCo2 || headerDraft.cylinderN2)) },
                          { label: "Datas", check: !!(headerDraft.dataInspecao && headerDraft.dataProxInspecao) },
                          { label: "Navio / Armador", check: !!(headerDraft.shipName && headerDraft.ownerName) },
                        ].map(({ label, check }) => (
                          <div key={label} className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold flex-shrink-0 ${check ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-500"}`}>
                              {check ? "✓" : "○"}
                            </span>
                            <span className={`text-[10px] ${check ? "text-emerald-700" : "text-amber-600"}`}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Footer ── */}
                  <div className="border-t border-slate-200 px-5 py-2 bg-slate-100">
                  <p className="text-[9px] text-slate-400 text-center">
                    Orey Técnica - Serviços Navais, Lda. · Delegação Açores: +351 296 929 314 · azores.tecnica@orey.com · www.oreytecnica.com
                  </p>
                  <p className="text-[8px] text-slate-300 text-center mt-0.5">
                    According to SOLAS regulation, this inflatable liferaft requires servicing within 12 months from the date of inspection.
                    · De acordo com a regulação SOLAS, esta jangada insuflável requer inspecção dentro de 12 meses.
                  </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-slate-300 shadow-md overflow-hidden text-xs">
                  <div className="flex items-center justify-between bg-slate-800 px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-sm tracking-widest">
                        {headerDraft.brand ? headerDraft.brand.toUpperCase() : <span className="text-slate-500 italic font-normal text-xs">QUADRO</span>}
                      </span>
                      <span className="text-slate-400 text-xs">{headerDraft.model || "Inspection Worksheet"}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">Completude</p>
                      <p className="text-white text-sm font-semibold">{checklistCompletion.completed}/{checklistCompletion.total}</p>
                    </div>
                  </div>

                  <div className="border-b border-slate-200 py-2 px-5 bg-slate-50 text-center">
                    <p className="font-bold text-[11px] tracking-widest uppercase text-slate-700">
                      Inspection Worksheet · Quadro de Inspeção
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Estrutura automática baseada no certificado e nos artigos extraídos
                    </p>
                  </div>

                  <div className="px-5 py-4 bg-white space-y-4 max-h-[860px] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {[
                        { label: "Navio", value: headerDraft.shipName || "—" },
                        { label: "Armador", value: headerDraft.ownerName || "—" },
                        { label: "Jangada", value: headerDraft.raftSerial || "—" },
                        { label: "Pack", value: headerDraft.emergencyPackType || "—" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-medium">{item.label}</p>
                          <p className="text-sm text-slate-700 font-semibold mt-1">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Quadro editável</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Edite cada item técnico antes da submissão; estes valores seguem na gravação final.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${missingRequiredChecklistCount > 0 ? "border-red-300 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
                          Obrigatórios em falta: {missingRequiredChecklistCount}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${pendingChecklistCount > 0 ? "border-amber-300 bg-amber-50 text-amber-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
                          Pendentes: {pendingChecklistCount}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetChecklistOverrides}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Repor automático
                      </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {checklistPreviewSections.map((section) => (
                        <div key={section.title} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                          <div className="border-b border-slate-200 bg-slate-100 px-4 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">{section.title}</p>
                            {section.englishTitle ? (
                              <p className="text-[10px] text-slate-400 mt-0.5">{section.englishTitle}</p>
                            ) : null}
                          </div>
                          <div className="divide-y divide-slate-100">
                            {section.fields.length > 0 ? section.fields.map((field) => {
                              const value = editableChecklistValues[field.name];
                              const isChecked = field.type === "checkbox" && Boolean(value);
                              const isOverridden = Object.prototype.hasOwnProperty.call(checklistOverrides, field.name);
                              const isRequired = checklistFieldIsRequired(field);
                              const isMissing = checklistFieldIsMissing(field, value);
                              return (
                                <div key={field.name} className={`px-4 py-2.5 space-y-2 ${isMissing ? (isRequired ? "bg-red-50/60" : "bg-amber-50/50") : ""}`}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-[11px] font-medium ${isMissing ? (isRequired ? "text-red-800" : "text-amber-800") : "text-slate-800"}`}>
                                        {field.label}{isRequired ? " *" : ""}
                                      </p>
                                      {field.englishLabel ? (
                                        <p className={`text-[10px] ${isMissing ? (isRequired ? "text-red-500" : "text-amber-500") : "text-slate-400"}`}>{field.englishLabel}</p>
                                      ) : null}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {isMissing ? (
                                        <span className={`rounded-md border px-2 py-1 text-[10px] font-medium ${isRequired ? "border-red-200 bg-red-100 text-red-700" : "border-amber-200 bg-amber-100 text-amber-700"}`}>
                                          {isRequired ? "Obrigatório" : "Em falta"}
                                        </span>
                                      ) : null}
                                      <span className={`rounded-md border px-2 py-1 text-[10px] font-medium ${isOverridden ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                                        {isOverridden ? "Editado" : "Auto"}
                                      </span>
                                      {isOverridden ? (
                                        <button
                                          type="button"
                                          onClick={() => handleChecklistFieldReset(field.name)}
                                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100"
                                        >
                                          Repor
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {field.type === "checkbox" ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleChecklistFieldChange(field.name, true)}
                                          className={`rounded-md border px-3 py-1.5 text-[11px] font-medium ${isChecked ? "border-emerald-300 bg-emerald-50 text-emerald-700" : (isMissing && isRequired ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}`}
                                        >
                                          ✓ Conforme
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleChecklistFieldChange(field.name, false)}
                                          className={`rounded-md border px-3 py-1.5 text-[11px] font-medium ${!isChecked ? (isRequired ? "border-red-300 bg-red-50 text-red-700" : "border-amber-300 bg-amber-50 text-amber-700") : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                                        >
                                          ○ Pendente
                                        </button>
                                      </>
                                    ) : (
                                      <input
                                        value={value == null ? "" : String(value)}
                                        onChange={(e) => handleChecklistFieldChange(field.name, e.target.value)}
                                        type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                                        list={field.type === "select" && field.options?.length ? `${field.name}-options` : undefined}
                                        placeholder={formatChecklistFieldValue(checklistPreviewValues[field.name], field.type)}
                                        className={`w-full min-w-[220px] flex-1 rounded-md border px-3 py-2 text-[11px] text-slate-700 focus:bg-white focus:outline-none ${isMissing ? (isRequired ? "border-red-300 bg-red-50 focus:border-red-400" : "border-amber-300 bg-amber-50 focus:border-amber-400") : "border-slate-200 bg-slate-50 focus:border-blue-400"}`}
                                        suppressHydrationWarning
                                      />
                                    )}
                                    {field.type !== "checkbox" ? (
                                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
                                        Base: {formatChecklistFieldValue(checklistPreviewValues[field.name], field.type)}
                                      </span>
                                    ) : null}
                                  </div>
                                  {field.type === "select" && field.options?.length ? (
                                    <datalist id={`${field.name}-options`}>
                                      {field.options.map((option) => (
                                        <option key={option} value={option} />
                                      ))}
                                    </datalist>
                                  ) : null}
                                </div>
                              );
                            }) : (
                              <div className="px-4 py-3 text-[11px] text-slate-500">Sem campos detetados nesta secção.</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 px-5 py-2 bg-slate-100">
                    <p className="text-[9px] text-slate-400 text-center">
                      Prévia do quadro técnico para validação antes da gravação em base de dados e atualização das inspeções.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Quadro Original Importado (Inteiro)</h3>
                <div className="h-[72vh] min-h-[560px] max-h-[840px] overflow-x-auto overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                  {result?.fileType === "excel" && result?.preview.originalSheetHtml ? (
                    <div className="min-w-max" dangerouslySetInnerHTML={{ __html: result.preview.originalSheetHtml }} />
                  ) : (
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">{result?.preview.rawTextFull || "Sem conteúdo original."}</pre>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Quadro Extraído (Editável Completo)</h3>
                <div className="h-[72vh] min-h-[560px] max-h-[840px] overflow-x-auto overflow-y-auto border border-gray-200 rounded">
                  {result && previewColumns.length > 0 ? (
                    <table className="min-w-[1400px] text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {previewColumns.map((column) => (
                            <th key={column} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {editableRows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-t border-gray-100">
                            {previewColumns.map((column) => (
                              <td key={`${rowIndex}-${column}`} className="px-2 py-1 align-top">
                                <input
                                  value={normalizeCell(row[column])}
                                  onChange={(e) => handleCellChange(rowIndex, column, e.target.value)}
                                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                                  suppressHydrationWarning
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-sm text-gray-500">Os dados extraídos aparecerão aqui após upload.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas das correções</label>
              <textarea
                value={trainingNotes}
                onChange={(e) => setTrainingNotes(e.target.value)}
                rows={3}
                placeholder="Ex.: Corrigi navio, armador, nº série da jangada e validades dos itens."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
