export function daysUntil(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  return Math.round(
    (startTarget.getTime() - startNow.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function formatHoursFromMinutes(value?: number | null) {
  if (typeof value !== "number") return "—";
  const hours = Math.round((value || 0) / 60);
  return `${hours}h`;
}

export function isDueWithinDays(value?: string | null, days = 30) {
  if (!value) return false;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;
  const now = Date.now();
  const limit = now + days * 24 * 60 * 60 * 1000;
  return parsed >= now && parsed <= limit;
}

export function formatAuditBadge(days: number | null) {
  if (typeof days !== "number") {
    return {
      label: "Sem auditoria planeada",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  if (days < 0) {
    return {
      label: `Auditoria atrasada há ${Math.abs(days)}d`,
      className: "border-rose-200 bg-rose-100 text-rose-700",
    };
  }

  if (days === 0) {
    return {
      label: "Auditoria prevista para hoje",
      className: "border-amber-200 bg-amber-100 text-amber-700",
    };
  }

  if (days <= 14) {
    return {
      label: `Auditoria em ${days}d`,
      className: "border-amber-200 bg-amber-100 text-amber-700",
    };
  }

  return {
    label: `Auditoria em ${days}d`,
    className: "border-emerald-200 bg-emerald-100 text-emerald-700",
  };
}
