export function onlyDigits(value?: string | null) {
  if (!value) return "";
  return value.replace(/\D+/g, "");
}

export function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function isValidNif(nif?: string | null) {
  const digits = onlyDigits(nif);
  return digits.length === 9;
}

export function isValidMmsi(mmsi?: string | null) {
  if (!mmsi) return true;
  const digits = onlyDigits(mmsi);
  return digits.length === 9;
}

export function isValidImo(imo?: string | null) {
  if (!imo) return true;
  const digits = onlyDigits(imo);
  return digits.length === 7;
}

export function normalizePhone(phone?: string | null) {
  if (!phone) return null;
  const cleaned = phone.replace(/\s+/g, " ").trim();
  return cleaned.length ? cleaned : null;
}
