import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export type GoogleCalendarConfig = {
  enabled: boolean;
  calendarId?: string;
  connectionLabel?: string;
  lastSyncAt?: string;
  lastSyncSummary?: string;
  janelaDiasApp: number;
  expiracoesNoGoogle: boolean;
  incluirInspecoesNoGoogle: boolean;
};

const CONFIG_PATH = path.join(process.cwd(), "_meta", "google-calendar-config.json");

export function buildDefaultGoogleCalendarConfig(): GoogleCalendarConfig {
  return {
    enabled: true,
    calendarId: "primary",
    connectionLabel: "",
    lastSyncAt: "",
    lastSyncSummary: "",
    janelaDiasApp: 30,
    expiracoesNoGoogle: true,
    incluirInspecoesNoGoogle: true,
  };
}

function normalizePositiveNumber(value: unknown, fallback: number, max = 365): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(max, Math.round(parsed)) : fallback;
}

export function getGoogleCalendarConfig(): GoogleCalendarConfig {
  const defaults = buildDefaultGoogleCalendarConfig();
  try {
    if (!existsSync(CONFIG_PATH)) return defaults;
    const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    if (!parsed || typeof parsed !== "object") return defaults;
    const src = parsed as Record<string, unknown>;
    const bool = (key: string, fallback: boolean) =>
      typeof src[key] === "boolean" ? (src[key] as boolean) : fallback;
    const str = (key: string, fallback?: string) =>
      typeof src[key] === "string" && String(src[key]).trim() ? String(src[key]).trim() : fallback;
    return {
      enabled: bool("enabled", defaults.enabled),
      calendarId: str("calendarId", defaults.calendarId),
      connectionLabel: str("connectionLabel", ""),
      lastSyncAt: str("lastSyncAt", ""),
      lastSyncSummary: str("lastSyncSummary", ""),
      janelaDiasApp: normalizePositiveNumber(src.janelaDiasApp, defaults.janelaDiasApp),
      expiracoesNoGoogle: bool("expiracoesNoGoogle", defaults.expiracoesNoGoogle),
      incluirInspecoesNoGoogle: bool("incluirInspecoesNoGoogle", defaults.incluirInspecoesNoGoogle),
    };
  } catch {
    return defaults;
  }
}

export function saveGoogleCalendarConfig(
  partial: Partial<GoogleCalendarConfig>,
): GoogleCalendarConfig {
  const current = getGoogleCalendarConfig();
  const bool = (key: keyof GoogleCalendarConfig, fallback: boolean) =>
    typeof partial[key] === "boolean" ? (partial[key] as boolean) : fallback;
  const next: GoogleCalendarConfig = {
    enabled: bool("enabled", current.enabled),
    calendarId:
      typeof partial.calendarId === "string" && partial.calendarId.trim()
        ? partial.calendarId.trim()
        : current.calendarId,
    connectionLabel:
      typeof partial.connectionLabel === "string" ? partial.connectionLabel.trim() : current.connectionLabel,
    lastSyncAt:
      typeof partial.lastSyncAt === "string" ? partial.lastSyncAt : current.lastSyncAt,
    lastSyncSummary:
      typeof partial.lastSyncSummary === "string" ? partial.lastSyncSummary : current.lastSyncSummary,
    janelaDiasApp:
      partial.janelaDiasApp !== undefined
        ? normalizePositiveNumber(partial.janelaDiasApp, current.janelaDiasApp)
        : current.janelaDiasApp,
    expiracoesNoGoogle: bool("expiracoesNoGoogle", current.expiracoesNoGoogle),
    incluirInspecoesNoGoogle: bool("incluirInspecoesNoGoogle", current.incluirInspecoesNoGoogle),
  };
  try {
    mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), "utf-8");
  } catch (error) {
    console.error("[google-calendar-config] Erro ao guardar configuração:", error);
  }
  return next;
}
