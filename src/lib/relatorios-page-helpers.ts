import { formatDateDisplay } from "@/lib/date-display";
import type { StockItem, Raft, Navio, ServiceOrder } from "@/types/relatorios-page";
import { FIXED_ARTICLE_PRICES, RAFT_RELATED_STOCK_KEYWORDS } from "@/types/relatorios-page";

export function normalizeList<T>(payload: unknown): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload === "object" && payload !== null && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[];
  }
  return [];
}

export async function safeReadJson(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  if (!rawText) return [];

  if (contentType.includes("application/json")) {
    return JSON.parse(rawText);
  }

  if (rawText.trim().startsWith("<")) {
    throw new Error(`Resposta inválida da API (${response.status}).`);
  }

  return JSON.parse(rawText);
}

export function formatDate(value?: string | null) {
  return formatDateDisplay(value);
}

export function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function splitApplicability(raw?: string | null) {
  return String(raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getApplicabilityBadge(item: StockItem) {
  const marcas = splitApplicability(item.aplicavelMarcaJangada);
  const modelos = splitApplicability(item.aplicavelModeloJangada);
  const labels = [
    marcas.length > 0 ? `Marca: ${marcas.slice(0, 2).join(" / ")}${marcas.length > 2 ? ` +${marcas.length - 2}` : ""}` : "",
    modelos.length > 0 ? `Modelo: ${modelos.slice(0, 2).join(" / ")}${modelos.length > 2 ? ` +${modelos.length - 2}` : ""}` : "",
  ].filter(Boolean);

  return labels.join(" · ");
}

export function getRaftKeywordScore(item: StockItem) {
  const blob = normalizeText([
    item.referencia,
    item.descricao,
    item.codigoFabricante,
    item.categoria,
    item.aplicavelMarcaJangada,
    item.aplicavelModeloJangada,
  ].filter(Boolean).join(" "));

  return RAFT_RELATED_STOCK_KEYWORDS.reduce((acc, keyword) => (
    blob.includes(normalizeText(keyword)) ? acc + 1 : acc
  ), 0);
}

export function getShipDisplayName(navio?: Navio | null) {
  return String(navio?.nome || "").trim();
}

export function getShipOptionLabel(navio?: Navio | null) {
  if (!navio) return "";
  const nome = String(navio.nome || "").trim() || "Navio sem nome";
  const matricula = String(navio.matricula || "").trim();
  return matricula ? `${nome} (${matricula})` : nome;
}

export function buildSuggestedObraNumber(existingRafts: Raft[]) {
  const today = new Date();
  const stamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const usedNumbers = new Set(
    existingRafts
      .map((raft) => String(raft.numeroObra || "").trim())
      .filter(Boolean)
  );

  let sequence = 1;
  let candidate = "";
  do {
    candidate = `OBR-${stamp}-${String(sequence).padStart(3, "0")}`;
    sequence += 1;
  } while (usedNumbers.has(candidate));

  return candidate;
}

export function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
}

export function isOrderClosed(status?: string | null) {
  const value = String(status || "").trim().toLowerCase();
  return value === "concluida" || value === "concluída" || value === "cancelada";
}

export function isOrderLate(order: ServiceOrder, now = new Date()) {
  if (isOrderClosed(order.status)) return false;
  const plannedEnd = String(order.dataPlaneadaFim || "").trim();
  if (!plannedEnd) return false;
  const date = new Date(plannedEnd);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < now.getTime();
}

export function getPriorityWeight(priority?: string | null) {
  const value = String(priority || "").trim().toLowerCase();
  if (value === "critica" || value === "crítica") return 4;
  if (value === "alta") return 3;
  if (value === "normal") return 2;
  if (value === "baixa") return 1;
  return 0;
}

export function resolveArticleUnitPrice(articleName: string, fallbackPrice: number) {
  const text = normalizeText(articleName);
  const fixed = FIXED_ARTICLE_PRICES.find((rule) => rule.matcher(text));
  return fixed?.price ?? fallbackPrice;
}

export function formatDateLongPt(date = new Date()) {
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}
