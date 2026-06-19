export type InspectionType = "anual" | "anual_gi" | "hidraulico" | "reinspecao" | "outro";

export type InspectionDefaults = {
  label: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
};

export const INSPECTION_TYPE_DEFAULTS: Record<InspectionType, InspectionDefaults> = {
  anual: {
    label: "Inspeção anual",
    durationMinutes: 120,
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
  },
  anual_gi: {
    label: "Inspeção anual + GI (FS/NAP)",
    durationMinutes: 300,
    bufferBeforeMinutes: 20,
    bufferAfterMinutes: 20,
  },
  hidraulico: {
    label: "Teste hidráulico",
    durationMinutes: 240,
    bufferBeforeMinutes: 20,
    bufferAfterMinutes: 20,
  },
  reinspecao: {
    label: "Reinspeção",
    durationMinutes: 90,
    bufferBeforeMinutes: 10,
    bufferAfterMinutes: 10,
  },
  outro: {
    label: "Outro",
    durationMinutes: 210,
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
  },
};

export function normalizeInspectionType(value?: string | null): InspectionType {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "anual") return "anual";
  if (normalized === "anual_gi" || normalized === "anual-gi" || normalized === "anualgi" || normalized === "gi") return "anual_gi";
  if (normalized === "hidraulico") return "hidraulico";
  if (normalized === "reinspecao") return "reinspecao";
  return "outro";
}

export function getInspectionDefaults(type?: string | null): InspectionDefaults {
  return INSPECTION_TYPE_DEFAULTS[normalizeInspectionType(type)];
}

// ── Operational event status ──────────────────────────────────────────────────

export type EventStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "testing"
  | "paused"
  | "completed"
  | "cancelled"
  | "no_show";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  scheduled:   "Agendado",
  confirmed:   "Confirmado",
  in_progress: "Em progresso",
  testing:     "Em teste",
  paused:      "Em pausa",
  completed:   "Concluído",
  cancelled:   "Cancelado",
  no_show:     "Não compareceu",
};

export const EVENT_STATUS_COLORS: Record<EventStatus, { bg: string; text: string; border: string }> = {
  scheduled:   { bg: "#e0f2fe", text: "#0369a1", border: "#0284c7" },
  confirmed:   { bg: "#d1fae5", text: "#065f46", border: "#059669" },
  in_progress: { bg: "#fef3c7", text: "#92400e", border: "#d97706" },
  testing:     { bg: "#ffe4e6", text: "#9f1239", border: "#fb7185" },
  paused:      { bg: "#ede9fe", text: "#6d28d9", border: "#8b5cf6" },
  completed:   { bg: "#dcfce7", text: "#166534", border: "#22c55e" },
  cancelled:   { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" },
  no_show:     { bg: "#f3f4f6", text: "#374151", border: "#9ca3af" },
};

export function normalizeEventStatus(value?: string | null): EventStatus {
  const v = String(value || "").trim().toLowerCase();
  if (v === "confirmed")   return "confirmed";
  if (v === "in_progress") return "in_progress";
  if (v === "testing" || v === "em_teste" || v === "em teste") return "testing";
  if (v === "paused")      return "paused";
  if (v === "completed")   return "completed";
  if (v === "cancelled")   return "cancelled";
  if (v === "no_show")     return "no_show";
  return "scheduled";
}

export type AgendaApiEvent = {
  id: number | string;
  title: string;
  date: string | null;
  raftSerial: string;
  responsavel?: string;
  status?: string;
  type?: string;
  inspectionType?: InspectionType;
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  deleted?: boolean;
};

export type AgendaApiPayload = {
  id?: number | string;
  title?: string;
  date?: string;
  raftSerial?: string;
  responsavel?: string;
  status?: string;
  type?: string;
  inspectionType?: InspectionType;
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
};
