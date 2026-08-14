export type CoordinateAxis = "lat" | "lng";

function normalizeCoordinateText(value: string) {
  return value
    .trim()
    .replace(/,/g, ".")
    .replace(/[º°]/g, "")
    .replace(/\s+/g, " ");
}

function clampToAxisRange(value: number, axis: CoordinateAxis) {
  if (axis === "lat") {
    return value >= -90 && value <= 90 ? value : null;
  }

  return value >= -180 && value <= 180 ? value : null;
}

export function parseCoordinate(value: unknown, axis: CoordinateAxis): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? clampToAxisRange(value, axis) : null;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const normalized = normalizeCoordinateText(raw);
  const hemisphereMatch = normalized.match(/^([NSEW])\s*(.+)$|^(.+?)\s*([NSEW])$/i);

  let numericPart = normalized;
  let hemisphere = "";

  if (hemisphereMatch) {
    hemisphere = (hemisphereMatch[1] || hemisphereMatch[4] || "").toUpperCase();
    numericPart = (hemisphereMatch[2] || hemisphereMatch[3] || "").trim();
  }

  const parsed = Number(numericPart);
  if (!Number.isFinite(parsed)) return null;

  let signed = parsed;
  if (hemisphere === "S" || hemisphere === "W") {
    signed = -Math.abs(parsed);
  } else if (hemisphere === "N" || hemisphere === "E") {
    signed = Math.abs(parsed);
  }

  return clampToAxisRange(signed, axis);
}

export function formatCoordinate(value: unknown, axis: CoordinateAxis) {
  const parsed = parseCoordinate(value, axis);
  return parsed === null ? "—" : parsed.toFixed(6);
}
