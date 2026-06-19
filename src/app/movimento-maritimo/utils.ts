import { getNavioIslandLabel } from "@/lib/navios-grouping";
import { getPortosDisponiveis } from "@/utils/portosRegisto";
import { normalizeLooseText } from "@/lib/text-normalization";
import { Navio } from "./types";

export const PORT_TO_ISLAND: Record<string, string> = {
  "horta": "Faial",
  "ponta delgada": "São Miguel",
  "vila franca do campo": "São Miguel",
  "santa cruz das flores": "Flores",
  "angra do heroismo": "Terceira",
  "madalena": "Pico",
  "lajes do pico": "Pico",
  "sao roque do pico": "Pico",
  "velas": "São Jorge",
  "vila do porto": "Santa Maria",
  "corvo": "Corvo",
  "santa cruz da graciosa": "Graciosa",
  "praia da vitoria": "Terceira",
};

export const PORTOS_AZORES = getPortosDisponiveis();

export function normalizeText(value?: string | null) {
  return normalizeLooseText(value || "");
}

export function getShipIsland(navio: Navio) {
  const label = getNavioIslandLabel({ ilha: navio.ilha, cliente: navio.cliente });
  return label === "Sem ilha" ? "Sem ilha" : label;
}

export function hasTrackingReadiness(navio: Navio) {
  return Boolean(
    String(navio.portoRegisto || "").trim() &&
    getShipIsland(navio) !== "Sem ilha" &&
    (String(navio.mmsi || "").trim() || String(navio.imo || "").trim() || String(navio.callSignal || "").trim())
  );
}

export function compareByName<T extends { nome?: string | null }>(a: T, b: T) {
  return String(a.nome || "").localeCompare(String(b.nome || ""), "pt", { sensitivity: "base" });
}

export function readMovementText(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = String(item[key] || "").trim();
    if (value) return value;
  }
  return "";
}
