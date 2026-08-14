import type { ComponentKey, ComponentStatus } from "@/types/lifejacket-diagram";

export function parseMonthYearDate(str?: string | null) {
  if (!str) return null;
  const match = str.trim().match(/^(\d{2})\/(\d{4})$/);
  if (match) {
    return new Date(parseInt(match[2]), parseInt(match[1]) - 1, 1);
  }
  const isoMatch = str.trim().match(/^(\d{4})-(\d{2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, 1);
  }
  const parsed = Date.parse(str);
  return isNaN(parsed) ? null : new Date(parsed);
}

export function getComponentStatus(validadeStr?: string | null, hasRef?: boolean): "OK" | "WARNING" | "CRITICAL" | "NONE" {
  if (!hasRef) return "NONE";
  const d = parseMonthYearDate(validadeStr);
  if (!d) return "OK";
  const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  return days < 0 ? "CRITICAL" : days <= 90 ? "WARNING" : "OK";
}

export function fmt(v: unknown) {
  return String(v ?? "").trim() || "—";
}

export function getStrokeColor(status: ComponentStatus["status"], active: boolean) {
  if (active) {
    return { OK: "#10b981", WARNING: "#f59e0b", CRITICAL: "#f43f5e", NONE: "#94a3b8" }[status];
  }
  return { OK: "#10b98188", WARNING: "#f59e0b88", CRITICAL: "#ef444488", NONE: "#94a3b844" }[status];
}

export function getFillColor(status: ComponentStatus["status"], active: boolean) {
  const alpha = active ? "33" : "15";
  return { OK: "#10b981", WARNING: "#f59e0b", CRITICAL: "#ef4444", NONE: "#94a3b8" }[status] + alpha;
}

export function dotStyle(
  components: Record<ComponentKey, ComponentStatus>,
  hoveredKey: ComponentKey | null,
  selectedKey: ComponentKey | null,
  key: ComponentKey
) {
  const st = components[key].status;
  const active = hoveredKey === key || selectedKey === key;
  return {
    base: {
      OK: "border-emerald-500 bg-emerald-400/30",
      WARNING: "border-amber-500 bg-amber-400/30",
      CRITICAL: "border-rose-500 bg-rose-400/30",
      NONE: "border-slate-400 bg-slate-300/30",
    }[st] + (active ? " scale-150 shadow-lg" : ""),
    dot: { OK: "bg-emerald-500", WARNING: "bg-amber-500", CRITICAL: "bg-rose-500", NONE: "bg-slate-400" }[st],
    ping: { OK: "bg-emerald-400", WARNING: "bg-amber-400", CRITICAL: "bg-rose-400", NONE: "bg-slate-300" }[st],
    label: { OK: "bg-emerald-600", WARNING: "bg-amber-500", CRITICAL: "bg-rose-600", NONE: "bg-slate-600" }[st],
  };
}
