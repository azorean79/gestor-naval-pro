export type Inspection = {
  id: number;
  certificadoNumero?: string | null;
  navioNome?: string | null;
  navioId?: number | null;
  jangadaId?: number | null;
  jangadaSerial?: string | null;
  dataInspecao?: string | null;
  status?: string | null;
  artigos?: Array<{
    id?: number;
    name?: string | null;
    quantidade?: number | null;
    validade?: string | null;
    referencia?: string | null;
    codigoFabricante?: string | null;
  }>;
};

export type Raft = {
  id?: number;
  serial: string;
  model?: string | null;
  brand?: string | null;
  owner?: string | null;
  shipId?: number | null;
  shipNameManual?: string | null;
  capacity?: number | null;
  dataFabrico?: string | null;
  packType?: string | null;
  dataInspecao?: string | null;
  dataProxInspecao?: string | null;
  numeroObra?: string | null;
  testeNAP?: string | null;
  testeFS?: string | null;
  artigos?: Array<{
    id?: number;
    name?: string | null;
    quantidade?: number | null;
    validade?: string | null;
    referencia?: string | null;
    codigoFabricante?: string | null;
  }>;
};

export type Navio = {
  id: number;
  nome: string;
  matricula?: string | null;
  portoRegisto?: string | null;
  tipoPesca?: string | null;
  tipoNavio?: string | null;
  cliente?: {
    id?: number;
    nome?: string | null;
    nif?: string | null;
    morada?: string | null;
    codigoPostal?: string | null;
    localidade?: string | null;
  } | null;
};

export type InspectionReportRow = {
  key: string;
  inspection: Inspection;
  raft: Raft | null;
  shipName: string;
  numeroObra: string;
  raftLabel: string;
  serial: string;
  inspectionDate: string;
  status: string;
  certificadoNumero: string;
};

export type ObraFormState = {
  shipId: string;
  shipName: string;
  numeroObra: string;
};

export type StockItem = {
  id?: number;
  referencia?: string | null;
  descricao?: string | null;
  precoVenda?: number | null;
  quantidade?: number | null;
  categoria?: string | null;
  codigoFabricante?: string | null;
  associavelJangada?: boolean;
  aplicavelMarcaJangada?: string | null;
  aplicavelModeloJangada?: string | null;
};

export type PricingState = {
  inspectionPrice: number;
  includeFS: boolean;
  includeNAP: boolean;
  includeCertificate: boolean;
  certificatePrice: number;
};

export type ObraPreviewLine = {
  key: string;
  raftId?: number;
  isArticle?: boolean;
  isSuggestedStock?: boolean;
  referencia: string;
  descricao: string;
  quantidade: number;
  unitPrice: number;
  total: number;
  source: string;
};

export type ServiceOrder = {
  id: number;
  numeroOrdem: string;
  grupoNumeroOrdem?: string | null;
  status: string;
  prioridade: string;
  tipo: string;
  tecnicoResponsavel?: string | null;
  slaHoras?: number | null;
  dataPlaneadaInicio?: string | null;
  dataPlaneadaFim?: string | null;
  dataPrevista?: string | null;
  createdAt?: string | null;
  jangada?: {
    id?: number;
    serial?: string | null;
    brand?: string | null;
    model?: string | null;
    shipNameManual?: string | null;
    owner?: string | null;
  } | null;
  cliente?: {
    id?: number;
    nome?: string | null;
  } | null;
};

export const SERVICE_STOCK_ITEMS = [
  { referencia: "L-JD", descricao: "Inspeção de Jangada", precoVenda: 180, categoria: "Serviço" },
  { referencia: "L-NAP", descricao: "Teste NAP", precoVenda: 35, categoria: "Serviço" },
  { referencia: "L-FS", descricao: "Teste FS", precoVenda: 35, categoria: "Serviço" },
  { referencia: "L-CER", descricao: "Certificado de Inspeção", precoVenda: 100, categoria: "Serviço" },
] as const;

export const FIXED_ARTICLE_PRICES: Array<{ matcher: (text: string) => boolean; price: number }> = [
  { matcher: (text) => text.includes("cinta"), price: 9 },
  { matcher: (text) => text.includes("comprimid") || text.includes("enjoo"), price: 19 },
  { matcher: (text) => text.includes("paraquedas") || text.includes("parachute"), price: 40 },
  { matcher: (text) => text.includes("pote") || text.includes("fumo") || text.includes("smoke"), price: 40 },
  { matcher: (text) => text.includes("racao") || text.includes("ration"), price: 6 },
  { matcher: (text) => text.includes("agua") || text.includes("water"), price: 3 },
  { matcher: (text) => text.includes("farmacia") || text.includes("first aid") || text.includes("ambulancia"), price: 75 },
];

export const RAFT_RELATED_STOCK_KEYWORDS = [
  "cinta",
  "strap",
  "retenida",
  "retenida final",
  "anilha",
  "pilha",
  "bateria",
  "battery",
  "lanterna",
  "torch",
  "hru",
  "hammar",
  "facho",
  "flare",
  "paraquedas",
  "rocket",
  "pote",
  "fumo",
  "agua",
  "water",
  "racao",
  "ration",
  "farmacia",
  "first aid",
  "comprimido",
  "enjoo",
  "reflector",
  "radar",
  "tubo",
  "hose",
  "mangueira",
  "cilindro",
  "cylinder",
  "co2",
  "n2",
  "valvula",
  "vedante",
  "oring",
  "o ring",
  "cabeca",
  "disparo",
  "fecho",
  "closure",
  "contentor",
  "container",
  "pack",
];
