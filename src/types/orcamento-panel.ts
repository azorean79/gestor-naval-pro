export type StockItem = {
  id: number;
  referencia?: string | null;
  descricao?: string | null;
  precoVenda?: number | null;
  precoCompra?: number | null;
  quantidade?: number | null;
  validade?: string | null;
  lote?: string | null;
  categoria?: string | null;
  associavelJangada?: boolean;
  codigoBarras?: string | null;
};

export type OrcamentoLine = {
  id: string;
  source: "stock" | "inspection" | "manual";
  stockId?: number;
  referencia?: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  categoria?: string;
  validade?: string;
  lote?: string;
  consumido?: boolean;
  nota?: string;
  desconto?: number;
  descontoTipo?: "valor" | "percentual";
};

export type MaoObraLine = {
  id: string;
  descricao: string;
  horas: number;
  precoHora: number;
  total: number;
  tecnico?: string;
};

export type InspecaoArtigo = {
  id: number;
  name: string;
  quantidade: number;
  referencia?: string | null;
  validade?: string | null;
  codigoFabricante?: string | null;
};

export interface OrcamentoPanelProps {
  ordemId: number;
  jangadaId?: number;
  inspecaoId?: number;
  initialMaterials?: OrcamentoLine[];
  initialMaoObra?: MaoObraLine[];
  onSave: (data: { materiais: OrcamentoLine[]; maoObra: MaoObraLine[]; configuracao: OrcamentoConfig }) => Promise<void>;
  onLoadInspecaoArtigos: (inspecaoId: number) => Promise<InspecaoArtigo[]>;
  clienteIsentoIva?: boolean;
  ivaRate?: number;
  disabled?: boolean;
  readOnly?: boolean;
  ordemNumero?: string;
  clienteNome?: string;
  clienteNif?: string;
  jangadaInfo?: string;
  jangadaSerial?: string;
  navio?: string;
  tecnico?: string;
}

export interface OrcamentoConfig {
  ivaRate: number;
  isentoIva: boolean;
  desconto: number;
  descontoTipo: "valor" | "percentual";
  observacoes: string;
  validadeDias: number;
  condicoesPagamento: string;
}

export const DEFAULT_CONFIG: OrcamentoConfig = {
  ivaRate: 16,
  isentoIva: false,
  desconto: 0,
  descontoTipo: "valor",
  observacoes: "",
  validadeDias: 30,
  condicoesPagamento:
    "Pronto pagamento após conclusão do serviço. Manutenção anual obrigatória conforme normas SOLAS/DGRM.",
};

export const CATEGORIAS = [
  "SINALIZAÇÃO",
  "ILUMINAÇÃO",
  "SOBREVIVÊNCIA",
  "PRIMEIROS SOCORROS",
  "EQUIPAMENTO",
  "CONSUMÍVEIS",
  "CILINDROS",
  "HRU",
  "OUTROS",
];
