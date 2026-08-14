import { lifejacketModelData, type LifejacketBrandCatalog, type LifejacketModel, type LifejacketServiceItem } from "@/modules/lifejackets/lifejacketModelData";
import { formatValidityDisplay } from "@/lib/date-display";
import {
  type VerificacaoColete,
  type InflacaoDetalhes,
  type StockItemLite,
  type StockApiErrorPayload,
  type ReplacementFlag,
  type ParsedObservacoesSections,
  type ManualReferenceHints,
  type ChecklistFieldKey,
  CHECKLIST_FIELDS,
  FIELD_SERVICE_KEYWORDS,
  MECANISMO_OPTIONS,
  MANUAL_CHECKLIST_MARKER,
  MANUAL_SYSTEM_MARKER,
} from "@/types/ficha-verificacao-multipla";

export function normalizeText(value: string | null | undefined): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ");
}

export function matchFieldForServiceItem(item: LifejacketServiceItem): ChecklistFieldKey | null {
  const haystack = normalizeText([item.name, item.notes, item.reference].filter(Boolean).join(" "));
  for (const field of CHECKLIST_FIELDS) {
    if (FIELD_SERVICE_KEYWORDS[field.key].some((keyword) => haystack.includes(normalizeText(keyword)))) {
      return field.key;
    }
  }
  return null;
}

export function serviceItemSignature(item: LifejacketServiceItem): string {
  return `${item.name}|${item.notes || ""}|${item.reference || ""}`;
}

export function resolveTechnicalCatalog(marca?: string | null, modelo?: string | null): {
  brandCatalog: LifejacketBrandCatalog | null;
  model: LifejacketModel | null;
} {
  const normalizedBrand = normalizeText(marca);
  const brandCatalog = lifejacketModelData.find((entry) => normalizeText(entry.brand) === normalizedBrand) || null;
  if (!brandCatalog) {
    return { brandCatalog: null, model: null };
  }

  const normalizedModel = normalizeText(modelo);
  const matchedModel = brandCatalog.models.find((entry) => {
    const candidate = normalizeText(entry.model);
    return candidate === normalizedModel || candidate.includes(normalizedModel) || normalizedModel.includes(candidate);
  }) || null;

  return { brandCatalog, model: matchedModel };
}

export function buildMechanismRecommendations(brandCatalog: LifejacketBrandCatalog | null) {
  if (!brandCatalog) return [] as string[];
  const normalizedSystems = brandCatalog.inflationSystems.map((entry) => normalizeText(entry));
  const recommended = new Set<string>();

  if (normalizedSystems.some((entry) => entry.includes("uml"))) recommended.add("UML");
  if (normalizedSystems.some((entry) => entry.includes("halkey"))) recommended.add("HR");
  if (normalizedSystems.some((entry) => entry.includes("hammar"))) recommended.add("HM");
  if (normalizedSystems.some((entry) => entry.includes("secumar"))) recommended.add("SEC");
  if (normalizedSystems.some((entry) => entry.includes("lalizas"))) recommended.add("LZ");
  if (normalizedSystems.some((entry) => entry.includes("crewsaver"))) recommended.add("CREW");
  if (normalizedSystems.some((entry) => entry.includes("plastimo"))) recommended.add("PL");

  return Array.from(recommended);
}

export function orderMechanismOptions(recommended: string[]) {
  const recommendedSet = new Set(recommended);
  return [...MECANISMO_OPTIONS].sort((a, b) => {
    const aRank = recommendedSet.has(a.value) ? 0 : 1;
    const bRank = recommendedSet.has(b.value) ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return a.label.localeCompare(b.label, "pt", { sensitivity: "base" });
  });
}

export function createInitialForm(coleteId: number): VerificacaoColete {
  return {
    coleteId,
    tecidoExterior: "",
    colagens: "",
    zataosVelcro: "",
    fitasReflectoras: "",
    sistemaInflacao: "",
    mecanismoInflacao: "",
    camaras: "",
    garrafaCO2: "",
    tuboInflador: "",
    inspectorNome: "",
    observacoes: "",
  };
}

export function createInitialInflacaoDetalhes(hasLight: boolean, hasClip: boolean): InflacaoDetalhes {
  return {
    tipoMecanismo: "AUTOMATICO",
    capsulaRef: "",
    capsulaValidade: "",
    capsulaSubstituida: "NAO",
    cilindro1Ref: "",
    cilindro1Validade: "",
    cilindro1Substituido: "NAO",
    cilindro2Ref: "",
    cilindro2Validade: "",
    cilindro2Substituido: "NAO",
    temClip: hasClip ? "SIM" : "",
    clipRef: "",
    clipSubstituido: "NAO",
    temLuz: hasLight ? "SIM" : "",
    luzRef: "",
    luzValidade: "",
    luzSubstituida: "NAO",
  };
}

export function normalizeDateYmd(value?: string | null): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function mechanismSearchTerms(code?: string): string[] {
  switch (String(code || "").toUpperCase()) {
    case "UML":
      return ["uml", "mk5", "pro sensor", "capsule"];
    case "HM":
      return ["hammar", "ma1", "hydrostatic", "capsule"];
    case "HR":
      return ["halkey", "roberts", "halkey roberts", "capsule"];
    case "SEC":
      return ["secumar", "capsule"];
    case "LZ":
      return ["lalizas", "capsule"];
    case "CREW":
      return ["crewsaver", "capsule"];
    case "PL":
      return ["plastimo", "capsule"];
    default:
      return ["capsule", "mecanismo", "inflator"];
  }
}

export function toStockLabel(item: StockItemLite): string {
  const ref = String(item.referencia || "").trim();
  const desc = String(item.descricao || "").trim();
  const validity = normalizeDateYmd(item.validade);
  return [ref || `#${item.id}`, desc, validity ? `Val: ${validity}` : ""]
    .filter(Boolean)
    .join(" · ");
}

export function findStockByReference(items: StockItemLite[], reference: string): StockItemLite | undefined {
  const target = String(reference || "").trim().toUpperCase();
  if (!target) return undefined;
  return items.find((item) => String(item.referencia || "").trim().toUpperCase() === target);
}

export function normalizeRefToken(value: string | null | undefined): string {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

export function hasReferenceMatch(item: StockItemLite, candidates: Array<string | null | undefined>): boolean {
  const itemRef = normalizeRefToken(item?.referencia);
  if (!itemRef) return false;

  return candidates.some((candidate) => {
    const normalized = normalizeRefToken(candidate);
    if (!normalized) return false;
    return itemRef === normalized || itemRef.includes(normalized) || normalized.includes(itemRef);
  });
}

export function findExactReferenceMatch(items: StockItemLite[], candidates: Array<string | null | undefined>): StockItemLite | undefined {
  const normalizedCandidates = Array.from(
    new Set(
      candidates
        .map((candidate) => normalizeRefToken(candidate))
        .filter(Boolean)
    )
  );

  if (normalizedCandidates.length === 0) return undefined;

  const exactMatches = items.filter((item) => {
    const itemRef = normalizeRefToken(item?.referencia);
    return itemRef ? normalizedCandidates.includes(itemRef) : false;
  });

  if (exactMatches.length !== 1) return undefined;
  return exactMatches[0];
}

export function extractReferenceTokens(value?: string | null): string[] {
  const raw = String(value || "").trim();
  if (!raw) return [];

  return Array.from(
    new Set(
      raw
        .split(/[\s,;|/()\[\]-]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3)
        .map((token) => token.toUpperCase())
    )
  );
}

export function buildManualReferenceHints(serviceItems: LifejacketServiceItem[]): ManualReferenceHints {
  const capsuleRefs = new Set<string>();
  const cylinderRefs = new Set<string>();
  const clipRefs = new Set<string>();
  const lightRefs = new Set<string>();

  const capsuleKeywords = new Set<string>();
  const cylinderKeywords = new Set<string>();
  const clipKeywords = new Set<string>();
  const lightKeywords = new Set<string>();

  for (const item of serviceItems) {
    const itemText = normalizeText([item.name, item.notes, item.reference].filter(Boolean).join(" "));
    const refs = extractReferenceTokens(item.reference);

    const isCapsule = ["capsula", "capsule", "cartridge", "bobbin", "water activated", "firing", "inflator", "mk5", "hammar", "ma1", "js1", "sensor"].some((k) => itemText.includes(normalizeText(k)));
    const isCylinder = ["co2", "cilindro", "cylinder", "33g", "38g", "60g", "22g"].some((k) => itemText.includes(normalizeText(k)));
    const isClip = ["clip", "toggle", "lanyard", "safety clip", "seguranca", "segurança"].some((k) => itemText.includes(normalizeText(k)));
    const isLight = ["luz", "light", "pylon", "strobe"].some((k) => itemText.includes(normalizeText(k)));

    if (isCapsule) {
      refs.forEach((ref) => capsuleRefs.add(ref));
      ["capsule", "capsula", "cartridge", "bobbin", "firing", "inflator", "mk5", "hammar", "ma1", "js1", "sensor"].forEach((k) => {
        if (itemText.includes(normalizeText(k))) capsuleKeywords.add(k);
      });
    }

    if (isCylinder) {
      refs.forEach((ref) => cylinderRefs.add(ref));
      ["co2", "cilindro", "cylinder", "33g", "38g", "60g", "22g"].forEach((k) => {
        if (itemText.includes(normalizeText(k))) cylinderKeywords.add(k);
      });
    }

    if (isClip) {
      refs.forEach((ref) => clipRefs.add(ref));
      ["clip", "toggle", "lanyard", "safety clip", "seguranca", "segurança"].forEach((k) => {
        if (itemText.includes(normalizeText(k))) clipKeywords.add(k);
      });
    }

    if (isLight) {
      refs.forEach((ref) => lightRefs.add(ref));
      ["luz", "light", "pylon", "strobe"].forEach((k) => {
        if (itemText.includes(normalizeText(k))) lightKeywords.add(k);
      });
    }
  }

  return {
    capsuleRefs: Array.from(capsuleRefs),
    cylinderRefs: Array.from(cylinderRefs),
    clipRefs: Array.from(clipRefs),
    lightRefs: Array.from(lightRefs),
    capsuleKeywords: Array.from(capsuleKeywords),
    cylinderKeywords: Array.from(cylinderKeywords),
    clipKeywords: Array.from(clipKeywords),
    lightKeywords: Array.from(lightKeywords),
  };
}

export function buildLimitedSearchQuery(parts: Array<string | null | undefined>, options?: { maxTokens?: number; maxLength?: number }): string {
  const maxTokens = options?.maxTokens ?? 14;
  const maxLength = options?.maxLength ?? 180;

  const tokens = Array.from(
    new Set(
      parts
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  ).slice(0, maxTokens);

  const limitedTokens: string[] = [];
  let currentLength = 0;

  for (const token of tokens) {
    const nextLength = currentLength === 0 ? token.length : currentLength + 1 + token.length;
    if (nextLength > maxLength) break;
    limitedTokens.push(token);
    currentLength = nextLength;
  }

  return limitedTokens.join(" ");
}

export async function fetchStockOptions(url: string, signal: AbortSignal): Promise<StockItemLite[]> {
  const response = await fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let payload: StockApiErrorPayload | null = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const statusLabel = `HTTP ${response.status}`;
    const codeLabel = payload?.code ? ` [${payload.code}]` : "";
    const message = payload?.error || "Erro ao carregar referências de stock";
    const details = payload?.details ? ` — ${payload.details}` : "";

    throw new Error(`${statusLabel}${codeLabel}: ${message}${details}`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

export function resolveCertificateResult(formData: VerificacaoColete): string {
  const checklistValues = [
    formData.tecidoExterior,
    formData.colagens,
    formData.zataosVelcro,
    formData.fitasReflectoras,
    formData.sistemaInflacao,
    formData.mecanismoInflacao,
    formData.camaras,
    formData.garrafaCO2,
    formData.tuboInflador,
  ].map((value) => String(value || "").trim().toUpperCase());

  return checklistValues.includes("F") ? "Reprovado" : "Aprovado";
}

export function parseBlockFieldLine(text: string, label: string): string {
  const regex = new RegExp(`^-\\s*${label.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*:\\s*(.*)$`, "i");
  const line = text.split(/\r?\n/).find((entry) => regex.test(entry.trim()));
  if (!line) return "";
  const match = line.trim().match(regex);
  return String(match?.[1] || "").trim();
}

export function splitManualChecklistFromObservacoes(observacoes?: string | null): ParsedObservacoesSections {
  const text = String(observacoes || "").trim();
  if (!text) {
    return { plainObservacoes: "", inflacaoBlock: "", manualChecklistLines: [] };
  }

  const inflacaoIndex = text.indexOf(MANUAL_SYSTEM_MARKER);
  const checklistIndex = text.indexOf(MANUAL_CHECKLIST_MARKER);

  const plainObservacoes = (inflacaoIndex === -1 ? text.slice(0, checklistIndex === -1 ? text.length : checklistIndex) : text.slice(0, inflacaoIndex)).trim();
  const inflacaoBlock = inflacaoIndex === -1
    ? ""
    : text
        .slice(inflacaoIndex + MANUAL_SYSTEM_MARKER.length, checklistIndex === -1 ? text.length : checklistIndex)
        .trim();
  const checklistChunk = checklistIndex === -1 ? "" : text.slice(checklistIndex + MANUAL_CHECKLIST_MARKER.length).trim();

  const manualChecklistLines = checklistChunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => {
      const content = line.replace(/^-+\s*/, "").trim();
      const separatorIndex = content.indexOf(":");

      if (separatorIndex === -1) {
        return {
          itemLabel: content,
          status: "",
          note: "",
        };
      }

      const itemLabel = content.slice(0, separatorIndex).trim();
      const statusAndNote = content.slice(separatorIndex + 1).trim();
      const noteSeparator = statusAndNote.indexOf("· Nota:");

      if (noteSeparator === -1) {
        return {
          itemLabel,
          status: statusAndNote,
          note: "",
        };
      }

      return {
        itemLabel,
        status: statusAndNote.slice(0, noteSeparator).trim(),
        note: statusAndNote.slice(noteSeparator + "· Nota:".length).trim(),
      };
    });

  return { plainObservacoes, inflacaoBlock, manualChecklistLines };
}

export function parseInflacaoLineWithValidity(value: string): { reference: string; validity: string } {
  const raw = String(value || "").trim();
  if (!raw) {
    return { reference: "", validity: "" };
  }

  const match = raw.match(/^(.*?)(?:\s*\(Val:\s*([^\)]+)\))?$/i);
  return {
    reference: String(match?.[1] || "").trim(),
    validity: normalizeDateYmd(match?.[2] || ""),
  };
}

export function parseInflacaoDetalhesFromObservacoes(
  observacoes: string | null | undefined,
  hasLight: boolean,
  hasClip: boolean
): InflacaoDetalhes {
  const parsed = splitManualChecklistFromObservacoes(observacoes);
  const initial = createInitialInflacaoDetalhes(hasLight, hasClip);

  if (!parsed.inflacaoBlock) {
    return initial;
  }

  const tipoMecanismoRaw = normalizeText(parseBlockFieldLine(parsed.inflacaoBlock, "Tipo mecanismo"));
  const capsula = parseInflacaoLineWithValidity(parseBlockFieldLine(parsed.inflacaoBlock, "Cápsula referência"));
  const cilindro1 = parseInflacaoLineWithValidity(parseBlockFieldLine(parsed.inflacaoBlock, "Garrafa CO₂ #1"));
  const cilindro2 = parseInflacaoLineWithValidity(parseBlockFieldLine(parsed.inflacaoBlock, "Garrafa CO₂ #2"));
  const luz = parseInflacaoLineWithValidity(parseBlockFieldLine(parsed.inflacaoBlock, "Luz referência"));

  return {
    ...initial,
    tipoMecanismo: tipoMecanismoRaw.includes("manual") ? "MANUAL" : "AUTOMATICO",
    capsulaRef: capsula.reference && !normalizeText(capsula.reference).includes("nao aplicavel") ? capsula.reference : "",
    capsulaValidade: capsula.validity,
    capsulaSubstituida: (parseBlockFieldLine(parsed.inflacaoBlock, "Cápsula substituída").toUpperCase() as ReplacementFlag) || initial.capsulaSubstituida,
    cilindro1Ref: cilindro1.reference && !normalizeText(cilindro1.reference).includes("nao aplicavel") ? cilindro1.reference : "",
    cilindro1Validade: cilindro1.validity,
    cilindro1Substituido: (parseBlockFieldLine(parsed.inflacaoBlock, "Garrafa CO₂ #1 substituída").toUpperCase() as ReplacementFlag) || initial.cilindro1Substituido,
    cilindro2Ref: cilindro2.reference && !normalizeText(cilindro2.reference).includes("nao aplicavel") ? cilindro2.reference : "",
    cilindro2Validade: cilindro2.validity,
    cilindro2Substituido: (parseBlockFieldLine(parsed.inflacaoBlock, "Garrafa CO₂ #2 substituída").toUpperCase() as ReplacementFlag) || initial.cilindro2Substituido,
    temClip: (parseBlockFieldLine(parsed.inflacaoBlock, "Tem clip de segurança").toUpperCase() as "SIM" | "NAO" | "") || initial.temClip,
    clipRef: parseBlockFieldLine(parsed.inflacaoBlock, "Clip de segurança").replace(/^Não aplicável$/i, "").trim(),
    clipSubstituido: (parseBlockFieldLine(parsed.inflacaoBlock, "Clip de segurança substituído").toUpperCase() as ReplacementFlag) || initial.clipSubstituido,
    temLuz: (parseBlockFieldLine(parsed.inflacaoBlock, "Tem luz").toUpperCase() as "SIM" | "NAO" | "") || initial.temLuz,
    luzRef: luz.reference && !normalizeText(luz.reference).includes("nao aplicavel") ? luz.reference : "",
    luzValidade: luz.validity,
    luzSubstituida: (parseBlockFieldLine(parsed.inflacaoBlock, "Luz substituída").toUpperCase() as ReplacementFlag) || initial.luzSubstituida,
  };
}

export function buildInflacaoBlock(
  formData: VerificacaoColete,
  inflacaoDetalhes: InflacaoDetalhes,
  requiresSecondSystem: boolean
): string {
  return [
    MANUAL_SYSTEM_MARKER,
    `- Tipo mecanismo: ${inflacaoDetalhes.tipoMecanismo === "MANUAL" ? "Manual" : "Automático"}`,
    `- Mecanismo selecionado: ${formData.mecanismoInflacao || "N/D"}`,
    inflacaoDetalhes.tipoMecanismo === "AUTOMATICO"
      ? `- Cápsula referência: ${inflacaoDetalhes.capsulaRef || "N/D"}`
      : "- Cápsula referência: Não aplicável (mecanismo manual)",
    inflacaoDetalhes.tipoMecanismo === "AUTOMATICO"
      ? `- Cápsula validade: ${formatValidityDisplay(inflacaoDetalhes.capsulaValidade, "N/D")}`
      : "- Cápsula validade: Não aplicável",
    inflacaoDetalhes.tipoMecanismo === "AUTOMATICO"
      ? `- Cápsula substituída: ${inflacaoDetalhes.capsulaSubstituida || "N/D"}`
      : "- Cápsula substituída: Não aplicável",
    `- Garrafa CO₂ #1: ${inflacaoDetalhes.cilindro1Ref || "N/D"}${inflacaoDetalhes.cilindro1Validade ? ` (Val: ${formatValidityDisplay(inflacaoDetalhes.cilindro1Validade, "N/D")})` : ""}`,
    `- Garrafa CO₂ #1 substituída: ${inflacaoDetalhes.cilindro1Substituido || "N/D"}`,
    requiresSecondSystem
      ? `- Garrafa CO₂ #2: ${inflacaoDetalhes.cilindro2Ref || "N/D"}${inflacaoDetalhes.cilindro2Validade ? ` (Val: ${formatValidityDisplay(inflacaoDetalhes.cilindro2Validade, "N/D")})` : ""}`
      : "- Garrafa CO₂ #2: Não aplicável (câmara simples)",
    requiresSecondSystem
      ? `- Garrafa CO₂ #2 substituída: ${inflacaoDetalhes.cilindro2Substituido || "N/D"}`
      : "- Garrafa CO₂ #2 substituída: Não aplicável",
    `- Tem clip de segurança: ${inflacaoDetalhes.temClip || "N/D"}`,
    inflacaoDetalhes.temClip === "SIM"
      ? `- Clip de segurança: ${inflacaoDetalhes.clipRef || "N/D"}`
      : "- Clip de segurança: Não aplicável",
    inflacaoDetalhes.temClip === "SIM"
      ? `- Clip de segurança substituído: ${inflacaoDetalhes.clipSubstituido || "N/D"}`
      : "- Clip de segurança substituído: Não aplicável",
    `- Tem luz: ${inflacaoDetalhes.temLuz || "N/D"}`,
    inflacaoDetalhes.temLuz === "SIM"
      ? `- Luz referência: ${inflacaoDetalhes.luzRef || "N/D"}${inflacaoDetalhes.luzValidade ? ` (Val: ${formatValidityDisplay(inflacaoDetalhes.luzValidade, "N/D")})` : ""}`
      : "- Luz referência: Não aplicável",
    inflacaoDetalhes.temLuz === "SIM"
      ? `- Luz substituída: ${inflacaoDetalhes.luzSubstituida || "N/D"}`
      : "- Luz substituída: Não aplicável",
  ].join("\n");
}
