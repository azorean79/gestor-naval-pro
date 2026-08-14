import { type Colete } from "@/types/equipamentos-page";
import { resolveLifejacketManuals } from "@/modules/lifejackets/manualResolver";

export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return "-";
  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})/);
  if (match) return `${match[2]}/${match[1]}`;
  return normalized;
}

export function normalizeDateInput(value: string | null | undefined): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function formatInspectionDate(value: string | null | undefined): string {
  if (!value) return "—";
  const normalized = normalizeDateInput(value);
  if (!normalized) return String(value);
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("pt-PT");
}

export function isInspectionOverdue(value: string | null | undefined): boolean {
  const normalized = normalizeDateInput(value);
  if (!normalized) return false;
  return new Date(`${normalized}T00:00:00`).getTime() < Date.now();
}

export function isInspectionDueWithin30Days(value: string | null | undefined): boolean {
  const normalized = normalizeDateInput(value);
  if (!normalized) return false;
  const target = new Date(`${normalized}T00:00:00`).getTime();
  const now = Date.now();
  const limit = now + 30 * 24 * 60 * 60 * 1000;
  return target >= now && target <= limit;
}

export function getInspectionUrgencyRank(value: string | null | undefined): number {
  if (isInspectionOverdue(value)) return 0;
  if (isInspectionDueWithin30Days(value)) return 1;
  return 2;
}

export function normalizeCatalogKey(value: string | null | undefined): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "")
    .trim()
    .toUpperCase();
}

export function getUniqueNormalizedLabels(values: Array<string | null | undefined>): string[] {
  const byKey = new Map<string, string>();
  for (const value of values) {
    const label = String(value || "").trim();
    if (!label) continue;
    const key = normalizeCatalogKey(label);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, label);
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
}

export function getManualData(item: Colete) {
  return resolveLifejacketManuals(item.marca, item.modelo);
}
