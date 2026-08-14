import { STOCK_LIST_COLUMNS, type StockListColumnKey } from "@/types/stock-page";

export function buildDefaultStockListColumns(): Record<StockListColumnKey, boolean> {
  return STOCK_LIST_COLUMNS.reduce((acc, col) => {
    acc[col.key] = true;
    return acc;
  }, {} as Record<StockListColumnKey, boolean>);
}

export function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function parseMonthYearToDate(value?: string): Date | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const mmYyyy = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyy) {
    const month = Number(mmYyyy[1]);
    const year = Number(mmYyyy[2]);
    if (month >= 1 && month <= 12) {
      return new Date(year, month, 0);
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function normalizeStockLabelText(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
