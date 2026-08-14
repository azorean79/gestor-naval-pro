export type PackItemDraft = {
  stockId: number | null;
  stockReference: string;
  stockDescription: string;
  stockCategory: string | null;
  quantity: number;
};

export type CustomPack = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  items: Array<{
    id: number;
    stockId: number | null;
    stockReference: string;
    stockDescription: string;
    stockCategory: string | null;
    quantity: number;
  }>;
};

export type StockRow = {
  id: number;
  referencia: string;
  descricao: string;
  categoria?: string | null;
  codigoFabricante?: string | null;
  quantidade?: number | null;
  quantidadeMinima?: number | null;
};

export type StockCreatePayload = {
  referencia: string;
  descricao: string;
  categoria?: string | null;
  quantidade?: number;
  quantidadeMinima?: number | null;
  associavelJangada?: boolean;
};

export type PackDraft = {
  id: number | null;
  name: string;
  description: string;
  isActive: boolean;
  items: PackItemDraft[];
  canonicalSource: boolean;
};

export type ResolvedPackItem = {
  label?: string;
  reference?: string;
  category?: string;
  quantity?: number;
};

export type StockSuggestion = {
  stock: StockRow;
  score: number;
  reason: string;
};

export const EMPTY_DRAFT: PackDraft = {
  id: null,
  name: "",
  description: "",
  isActive: true,
  items: [],
  canonicalSource: false,
};
