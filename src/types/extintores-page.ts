export type Extintor = {
  id: number;
  shipId?: number | null;
  serial?: string | null;
  marca?: string | null;
  modelo?: string | null;
  capacidadeKg?: number | null;
  tipoAgente?: string | null;
  estado?: string | null;
  localizacao?: string | null;
  dataFabrico?: string | null;
  dataUltimaRecarga?: string | null;
  dataProxRecarga?: string | null;
  dataTesteHidraulico?: string | null;
  dataProxTesteHidraulico?: string | null;
  observacoes?: string | null;
};

export type ExtintorForm = {
  id?: number;
  shipId: string;
  serial: string;
  marca: string;
  modelo: string;
  capacidadeKg: string;
  tipoAgente: string;
  estado: string;
  localizacao: string;
  dataFabrico: string;
  dataUltimaRecarga: string;
  dataProxRecarga: string;
  dataTesteHidraulico: string;
  dataProxTesteHidraulico: string;
  observacoes: string;
};

export const EMPTY_EXTINTOR_FORM: ExtintorForm = {
  shipId: "",
  serial: "",
  marca: "",
  modelo: "",
  capacidadeKg: "",
  tipoAgente: "",
  estado: "Ativo",
  localizacao: "",
  dataFabrico: "",
  dataUltimaRecarga: "",
  dataProxRecarga: "",
  dataTesteHidraulico: "",
  dataProxTesteHidraulico: "",
  observacoes: "",
};

export const EXTINTOR_ESTADOS = ["Ativo", "Para Recarga", "Para Teste Hidráulico", "Fora de Serviço", "Eliminado"] as const;

export const EXTINTOR_TIPOS_AGENTE = ["CO2", "Pó Químico ABC", "Pó Químico BC", "Espuma", "Água", "Água Aditivada", "Halotron"] as const;
