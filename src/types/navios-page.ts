import { APP_CONFIG } from "@/lib/app-config";

export type Navio = {
  id: number;
  nome: string;
  matricula?: string;
  tipoPesca?: string;
  tipoNavio?: string;
  comprimentoMetros?: number | string;
  ilha?: string;
  proprietario?: string;
  bandeira?: string;
  mmsi?: string;
  imo?: string;
  callSignal?: string;
  portoRegisto?: string;
  cliente?: { id: number; nome: string; ilha?: string } | null;
};

export type JangadaItem = {
  id: number;
  serial: string;
  brand?: string;
  model?: string;
  shipId?: number | null;
};

export type ColeteItem = {
  id: number;
  serial: string;
  marca?: string;
  modelo?: string;
  estado?: string;
  shipId?: number | null;
};

export type EpirbItem = {
  id: number;
  serial: string;
  marca?: string;
  modelo?: string;
  estado?: string;
  shipId?: number | null;
};

export type ClienteItem = {
  id: number;
  nome: string;
  ilha?: string;
  numeroCliente?: string;
};

export type ViewMode = "quadros" | "lista" | "detalhes";
export type NavioLocationColumnKey = "ilha" | "localizacao";
export type NavioListColumnKey = "nome" | "matricula" | "cliente" | "portoRegisto" | "tipo" | NavioLocationColumnKey;

export const IS_AZORES_APP = APP_CONFIG.presetKey === "ACORES";
export const LOCATION_COLUMN_KEY: NavioLocationColumnKey = IS_AZORES_APP ? "ilha" : "localizacao";
export const LOCATION_COLUMN_LABEL = IS_AZORES_APP ? "Ilha" : "Localização";

export const NAVIO_LIST_COLUMNS_KEY = `navios-list-columns-${LOCATION_COLUMN_KEY}-v2`;
export const NAVIO_LIST_COLUMNS: Array<{ key: NavioListColumnKey; label: string }> = [
  { key: "nome", label: "Nome" },
  { key: "matricula", label: "Matrícula" },
  { key: "cliente", label: "Cliente" },
  { key: "portoRegisto", label: "Porto de Registo" },
  { key: "tipo", label: "Tipo de Navio" },
  { key: LOCATION_COLUMN_KEY, label: LOCATION_COLUMN_LABEL },
];

export const BANDEIRAS_OPCOES = [
  "Portugal",
  "Espanha",
  "França",
  "Itália",
  "Alemanha",
  "Países Baixos",
  "Reino Unido",
  "Malta",
  "Panamá",
  "Libéria",
  "Bahamas",
  "Chipre",
  "Dinamarca",
  "Noruega",
  "Suécia",
  "Canadá",
  "Estados Unidos",
  "Brasil",
] as const;

export const AZORES_LOCATION_OPTIONS = [
  "Açores",
  "Corvo",
  "Flores",
  "Faial",
  "Pico",
  "São Jorge",
  "Graciosa",
  "Terceira",
  "São Miguel",
  "Santa Maria",
  "Norte",
  "Centro",
  "Sul",
  "Madeira",
] as const;

export const LOCATION_CANONICAL_MAP: Record<string, (typeof AZORES_LOCATION_OPTIONS)[number]> = {
  acores: "Açores",
  corvo: "Corvo",
  flores: "Flores",
  faial: "Faial",
  pico: "Pico",
  saojorge: "São Jorge",
  graciosa: "Graciosa",
  terceira: "Terceira",
  saomiguel: "São Miguel",
  santamaria: "Santa Maria",
  norte: "Norte",
  centro: "Centro",
  sul: "Sul",
  madeira: "Madeira",
};

export const INITIAL_NAVIO_FORM: Navio = {
  id: 0,
  nome: "",
  matricula: "",
  ilha: "",
  tipoPesca: "",
  tipoNavio: "",
  comprimentoMetros: "",
  proprietario: "",
  bandeira: "Portugal",
  mmsi: "",
  imo: "",
  callSignal: "",
  portoRegisto: "",
};
