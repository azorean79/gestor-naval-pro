import crypto from "node:crypto";
import prisma from "@/lib/prisma";

export const INTEGRITY_VERSION = 1;

export const INSPECTION_INTEGRITY_FIELDS = [
  "certificadoNumero",
  "navioNome",
  "navioId",
  "jangadaId",
  "jangadaSerial",
  "coleteId",
  "coleteSerial",
  "dataInspecao",
  "dataProxInspecao",
  "status",
  "sourceFile",
  "numeroObra",
  "testeWP",
  "testeNAP",
  "testeFS",
  "testeGI",
  "testeDL",
  "testeWPUnidadePressao",
  "testeWPInstrumento",
  "testeWPHoraInicio",
  "testeWPHoraFim",
  "testeWPTemperaturaInicial",
  "testeWPTemperaturaFinal",
  "testeWPPressaoAtmosfericaInicial",
  "testeWPPressaoAtmosfericaFinal",
  "testeWPCamaraSuperiorInicio",
  "testeWPCamaraSuperiorFim",
  "testeWPCamaraSuperiorQueda",
  "testeWPCamaraInferiorInicio",
  "testeWPCamaraInferiorFim",
  "testeWPCamaraInferiorQueda",
  "oficinaTemperatura",
  "oficinaHumidade",
  "orcamento",
] as const;

export type InspectionLike = {
  [key: string]: unknown;
  artigos?: Array<Record<string, unknown>>;
};

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortObject((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortObject(value));
}

export function computeDigest(payload: Record<string, unknown>): string {
  const canonical = stableStringify({ version: INTEGRITY_VERSION, data: payload });
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function buildInspectionContent(
  inspecao: InspectionLike,
  artigos: unknown[] = []
): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  for (const key of INSPECTION_INTEGRITY_FIELDS) {
    const value = (inspecao as Record<string, unknown>)[key];
    if (value !== undefined && value !== null) content[key] = value;
  }
  content.artigos = Array.isArray(artigos)
    ? artigos.map((raw) => {
        const artigo = (raw || {}) as Record<string, unknown>;
        return {
          name: artigo.name,
          quantidade: artigo.quantidade,
          validade: artigo.validade,
          referencia: artigo.referencia,
          codigoFabricante: artigo.codigoFabricante,
        };
      })
    : [];
  return content;
}

export function computeInspectionDigest(
  inspecao: InspectionLike,
  artigos: unknown[] = []
): string {
  return computeDigest(buildInspectionContent(inspecao, artigos));
}

export async function stampInspectionWithDigest(inspecaoId: number) {
  const inspecao = await prisma.inspecao.findUnique({
    where: { id: inspecaoId },
    include: { artigos: true },
  });
  if (!inspecao) return null;

  const hash = computeInspectionDigest(inspecao, inspecao.artigos);
  const timestamp = new Date();

  await prisma.inspecao.update({
    where: { id: inspecaoId },
    data: {
      integrityHash: hash,
      integrityTimestamp: timestamp,
      integrityVersion: INTEGRITY_VERSION,
    },
  });

  return {
    integrityHash: hash,
    integrityTimestamp: timestamp,
    integrityVersion: INTEGRITY_VERSION,
  };
}

export async function verifyInspectionIntegrity(inspecaoId: number) {
  const inspecao = await prisma.inspecao.findUnique({
    where: { id: inspecaoId },
    include: { artigos: true },
  });
  if (!inspecao) {
    return { stamped: false, found: false as const };
  }
  if (!inspecao.integrityHash) {
    return {
      stamped: false,
      found: true as const,
      integrityHash: null,
      integrityTimestamp: null,
      integrityVersion: null,
    };
  }

  const recomputed = computeInspectionDigest(inspecao, inspecao.artigos);
  return {
    stamped: true,
    found: true as const,
    valid: recomputed === inspecao.integrityHash,
    integrityHash: inspecao.integrityHash,
    recomputedHash: recomputed,
    integrityTimestamp: inspecao.integrityTimestamp,
    integrityVersion: inspecao.integrityVersion,
  };
}

export function shortDigest(hash: string | null | undefined): string {
  return String(hash || "").slice(0, 12);
}
