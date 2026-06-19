import { normalizeToken } from "@/lib/text-normalization";

type RegionPresetKey = "ACORES";

type RegionPreset = {
  slug: string;
  name: string;
  issuerName: string;
  theme: string;
  defaultServiceStationCode: string;
  defaultRegionLabel: string;
  icsUidDomain: string;
  geoCenter: { lat: number; lng: number };
  geoLabel: string;
  ivaRate: number;
};

const REGION_PRESETS: Record<RegionPresetKey, RegionPreset> = {
  ACORES: {
    slug: "oreyazores26",
    name: "Orey Técnica Açores",
    issuerName: "Sistema Oreyazores",
    theme: "azores",
    defaultServiceStationCode: "ACORES",
    defaultRegionLabel: "Açores",
    icsUidDomain: "oreyazores",
    geoCenter: { lat: 38.55, lng: -28.2 },
    geoLabel: "Açores",
    ivaRate: 0.16,
  },
};

function readString(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function readNumber(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePresetKey(raw?: string | null): RegionPresetKey {
  return "ACORES";
}

const presetKey = normalizePresetKey(process.env.NEXT_PUBLIC_APP_REGION_PRESET);
const preset = REGION_PRESETS[presetKey];
const serverStorageNamespace = typeof window === "undefined"
  ? readString("APP_STORAGE_NAMESPACE", preset.slug)
  : "";

export const APP_CONFIG = {
  presetKey,
  slug: readString("NEXT_PUBLIC_APP_SLUG", preset.slug),
  name: readString("NEXT_PUBLIC_APP_NAME", preset.name),
  issuerName: readString("NEXT_PUBLIC_APP_ISSUER_NAME", preset.issuerName),
  theme: readString("NEXT_PUBLIC_APP_THEME", preset.theme),
  defaultServiceStationCode: readString("NEXT_PUBLIC_DEFAULT_SERVICE_STATION_CODE", preset.defaultServiceStationCode),
  defaultRegionLabel: readString("NEXT_PUBLIC_DEFAULT_REGION_LABEL", preset.defaultRegionLabel),
  icsUidDomain: readString("NEXT_PUBLIC_ICS_UID_DOMAIN", preset.icsUidDomain),
  geoCenter: {
    lat: readNumber("NEXT_PUBLIC_APP_GEO_CENTER_LAT", preset.geoCenter.lat),
    lng: readNumber("NEXT_PUBLIC_APP_GEO_CENTER_LNG", preset.geoCenter.lng),
  },
  geoLabel: readString("NEXT_PUBLIC_APP_GEO_LABEL", preset.geoLabel),
  ivaRate: readNumber("NEXT_PUBLIC_APP_IVA_RATE", preset.ivaRate),
  storageNamespace: readString("NEXT_PUBLIC_APP_STORAGE_NAMESPACE", serverStorageNamespace || preset.slug),
} as const;

export const APP_METADATA = {
  title: `${APP_CONFIG.name} — Gestor de Inspeções de Jangadas`,
  description: `Gestão de inspeções, clientes, navios e equipamentos para ${APP_CONFIG.name}.`,
} as const;

export function normalizeStationMatchToken(value?: string | null) {
  return normalizeToken(value || "");
}
