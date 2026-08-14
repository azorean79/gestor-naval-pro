import {
  BER_CODES,
  computeNextServiceDate,
  evaluateOverallResult,
  FATO_CHECKLIST_ITEMS,
  type ChecklistResult,
} from "@/lib/fatos-imersao-checklist";

export { BER_CODES, computeNextServiceDate, evaluateOverallResult };

export function mapChecklistToLegacyFields(checklist: Record<string, string>) {
  const out: Record<string, string | null> = {};
  for (const item of FATO_CHECKLIST_ITEMS) {
    if (!item.mapField) continue;
    out[item.mapField] = checklist[item.key] || null;
  }
  return out;
}

export function buildVerificacaoPayload(input: {
  checklist: Record<string, string>;
  leakMetodo?: string;
  leakPressaoInicial?: string;
  leakPressaoFinal?: string;
  leakDeltaP?: string;
  leakUnidade?: string;
  leakDuracaoMin?: string;
  leakResultado?: string;
  leakReTest?: string;
  zonasFuga?: string[];
  codigoBER?: string;
  motivoBER?: string;
  dataVerificacao?: string;
  inspectorNome?: string;
  observacoes?: string;
}) {
  const legacy = mapChecklistToLegacyFields(input.checklist);
  const resultadoGeral = evaluateOverallResult(
    input.checklist,
    input.leakResultado,
    input.codigoBER
  );

  return {
    ...legacy,
    impermeabilidade: input.leakResultado || legacy.impermeabilidade || null,
    checklistJson: JSON.stringify(input.checklist || {}),
    leakMetodo: input.leakMetodo || null,
    leakPressaoInicial: input.leakPressaoInicial || null,
    leakPressaoFinal: input.leakPressaoFinal || null,
    leakDeltaP: input.leakDeltaP || null,
    leakUnidade: input.leakUnidade || "kPa",
    leakDuracaoMin: input.leakDuracaoMin || null,
    leakResultado: input.leakResultado || null,
    leakReTest: input.leakReTest || null,
    zonasFugaJson: JSON.stringify(input.zonasFuga || []),
    resultadoGeral,
    codigoBER: input.codigoBER || null,
    motivoBER: input.motivoBER || null,
    dataVerificacao: input.dataVerificacao || undefined,
    inspectorNome: input.inspectorNome || null,
    observacoes: input.observacoes || null,
  };
}

export function parseChecklistJson(raw?: string | null): Record<string, ChecklistResult> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* ignore */
  }
  return {};
}

export function berLabel(code?: string | null): string {
  if (!code) return "";
  const found = BER_CODES.find((b) => b.code === code);
  return found ? `${found.code} — ${found.label}` : code;
}
