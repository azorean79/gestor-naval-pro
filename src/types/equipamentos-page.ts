export type Colete = {
  id: number;
  shipId?: number | null;
  navioId?: number | null;
  serial?: string | null;
  marca?: string | null;
  modelo?: string | null;
  tamanho?: string | null;
  estado?: string | null;
  dataFabrico?: string | null;
  dataInspecao?: string | null;
  dataProxInspecao?: string | null;
  observacoes?: string | null;
};

export type Navio = {
  id: number;
  nome: string;
  matricula?: string;
};

export type ViewMode = "quadros" | "lista" | "detalhes";

export type ColeteListColumnKey =
  | "navio"
  | "serial"
  | "marca"
  | "paisFabrico"
  | "modelo"
  | "tamanho"
  | "estado"
  | "dataFabrico"
  | "dataInspecao"
  | "dataProxInspecao"
  | "observacoes";

export type ColeteForm = {
  id?: number;
  shipId: string;
  serial: string;
  marca: string;
  modelo: string;
  tamanho: string;
  estado: string;
  dataFabrico: string;
  dataInspecao: string;
  dataProxInspecao: string;
  observacoes: string;
};

export type ColeteCatalogOption = {
  marca: string;
  modelo: string;
  fabricante?: string | null;
  origem?: string | null;
  source?: "catalogo" | "departamentoTecnico" | "baseDados";
};

export const EMPTY_FORM: ColeteForm = {
  shipId: "",
  serial: "",
  marca: "",
  modelo: "",
  tamanho: "",
  estado: "Ativo",
  dataFabrico: "",
  dataInspecao: "",
  dataProxInspecao: "",
  observacoes: "",
};

export const COLETE_LIST_COLUMNS_KEY = "coletes-list-columns-v1";

export const COLETE_LIST_COLUMNS: Array<{ key: ColeteListColumnKey; label: string }> = [
  { key: "navio", label: "Navio" },
  { key: "serial", label: "Nº Série" },
  { key: "marca", label: "Marca" },
  { key: "paisFabrico", label: "País fabrico" },
  { key: "modelo", label: "Modelo" },
  { key: "tamanho", label: "Tamanho" },
  { key: "estado", label: "Estado" },
  { key: "dataFabrico", label: "Data Fabrico" },
  { key: "dataInspecao", label: "Data Inspeção" },
  { key: "dataProxInspecao", label: "Próxima Inspeção" },
  { key: "observacoes", label: "Observações" },
];

export function buildDefaultColeteColumns(): Record<ColeteListColumnKey, boolean> {
  return COLETE_LIST_COLUMNS.reduce((acc, col) => {
    acc[col.key] = true;
    return acc;
  }, {} as Record<ColeteListColumnKey, boolean>);
}
