import type { TecnicosPayload } from "@/types/tecnicos-page";

export function toDateInput(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function emptyPayload(): TecnicosPayload {
  return {
    activeStationId: null,
    activeStation: null,
    canViewAllStations: false,
    stations: [],
    unassigned: [],
    totalTecnicos: 0,
  };
}
