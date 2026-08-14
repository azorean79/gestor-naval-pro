export type Cliente = {
  id: number;
  nome: string;
  numeroCliente?: string | null;
  modoPagamento?: string | null;
  nif?: string | null;
  email?: string | null;
  telefone?: string | null;
  telmovel?: string | null;
  morada: string | null;
  moradaNumero?: string | null;
  codigoPostal?: string | null;
  localidade?: string | null;
  ilha: string | null;
  navios: {
    id: number;
    nome: string;
    matricula: string;
    ilha: string | null;
    tipoPesca: string;
  }[];
};

export type Navio = {
  id: number;
  nome: string;
  matricula: string;
  clienteId?: number | null;
  cliente?: {
    id: number;
    nome: string;
  } | null;
};

export type ClienteProfileField = "nome" | "numeroCliente" | "modoPagamento" | "morada" | "moradaNumero" | "codigoPostal" | "localidade" | "ilha" | "nif" | "email" | "telefone" | "telmovel";
export type ClienteListColumnKey = "cliente" | "numeroCliente" | "ilha" | "email" | "telefone" | "navios";

export const CLIENTE_LIST_COLUMNS_KEY = "clientes-list-columns-v1";
export const CLIENTE_LIST_COLUMNS: Array<{ key: ClienteListColumnKey; label: string }> = [
  { key: "cliente", label: "Cliente" },
  { key: "numeroCliente", label: "Nº Cliente" },
  { key: "ilha", label: "Ilha" },
  { key: "email", label: "Email" },
  { key: "telefone", label: "Telefone" },
  { key: "navios", label: "Navio(s)" },
];

export type ViewMode = "quadros" | "lista" | "detalhes";
