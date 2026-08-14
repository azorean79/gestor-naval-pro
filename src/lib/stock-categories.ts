export const STOCK_CANONICAL_CATEGORIES = [
  "COLETES",
  "CABEÇAS DE DISPARO",
  "PRIMEIROS SOCORROS",
  "PIROTÉCNICOS",
  "SINALIZAÇÃO",
  "ILUMINAÇÃO",
  "CONTENTORES",
  "TUBOS DE ALTA PRESSÃO",
  "CILINDROS",
  "CONSUMÍVEIS",
  "ACESSÓRIOS",
  "DIVERSOS",
] as const;

export type StockCanonicalCategory = (typeof STOCK_CANONICAL_CATEGORIES)[number];

function normalizeCategoryText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ");
}

/** Aliases exatos de categoria (campo categoria). */
const EXACT_CATEGORY_ALIASES: Record<string, StockCanonicalCategory> = {
  // Coletes
  coletes: "COLETES",
  colete: "COLETES",
  "coletes insuflaveis": "COLETES",
  "colete insuflavel": "COLETES",
  "inflacao de coletes": "COLETES",
  "inflacao coletes": "COLETES",
  "kits coletes": "COLETES",
  "kit coletes": "COLETES",
  "life jackets": "COLETES",
  lifejackets: "COLETES",

  // Cabeças / rearm
  "cabecas de disparo": "CABEÇAS DE DISPARO",
  "cabeca de disparo": "CABEÇAS DE DISPARO",
  "op heads": "CABEÇAS DE DISPARO",
  op_heads: "CABEÇAS DE DISPARO",
  opheads: "CABEÇAS DE DISPARO",
  bobbins: "CABEÇAS DE DISPARO",
  bobbin: "CABEÇAS DE DISPARO",
  kits_recarga: "CABEÇAS DE DISPARO",
  "kits recarga": "CABEÇAS DE DISPARO",
  "kit recarga": "CABEÇAS DE DISPARO",
  "mecanica e sistemas de disparo": "CABEÇAS DE DISPARO",
  "inflacao / cabecas": "CABEÇAS DE DISPARO",

  // Primeiros socorros
  "primeiros socorros": "PRIMEIROS SOCORROS",
  farmacia: "PRIMEIROS SOCORROS",
  "first aid": "PRIMEIROS SOCORROS",

  // Pirotécnicos (só pirotecnia real)
  pirotecnia: "PIROTÉCNICOS",
  pirotecnicos: "PIROTÉCNICOS",
  flares: "PIROTÉCNICOS",
  foguetes: "PIROTÉCNICOS",
  fachos: "PIROTÉCNICOS",

  // Sinalização NÃO pirotécnica
  sinalizacao: "SINALIZAÇÃO",
  "sinalizacao / pack": "SINALIZAÇÃO",
  signalling: "SINALIZAÇÃO",
  signaling: "SINALIZAÇÃO",

  // Iluminação
  iluminacao: "ILUMINAÇÃO",
  luzes: "ILUMINAÇÃO",
  lighting: "ILUMINAÇÃO",
  lanternas: "ILUMINAÇÃO",
  baterias: "ILUMINAÇÃO",

  // Contentores
  contentores: "CONTENTORES",
  contentor: "CONTENTORES",
  "containers e embalagem": "CONTENTORES",
  "cintas de fecho": "CONTENTORES",
  cintas: "CONTENTORES",

  // Tubos
  "tubos de alta pressao": "TUBOS DE ALTA PRESSÃO",
  tubos: "TUBOS DE ALTA PRESSÃO",
  "mangueiras e baionetas": "TUBOS DE ALTA PRESSÃO",
  "sistemas de insuflacao": "TUBOS DE ALTA PRESSÃO",

  // Cilindros
  cilindros: "CILINDROS",
  "cilindros / packs": "CILINDROS",
  cilindro: "CILINDROS",
  garrafa: "CILINDROS",
  co2: "CILINDROS",
  n2: "CILINDROS",

  // Consumíveis
  consumiveis: "CONSUMÍVEIS",
  "consumiveis / pack": "CONSUMÍVEIS",
  "consumiveis servico": "CONSUMÍVEIS",
  sobrevivencia: "CONSUMÍVEIS",
  "sobrevivencia e consumiveis": "CONSUMÍVEIS",
  racoes: "CONSUMÍVEIS",
  aguas: "CONSUMÍVEIS",

  // Acessórios / equipamento de pack
  acessorios: "ACESSÓRIOS",
  acessorio: "ACESSÓRIOS",
  "vedantes e selagens": "ACESSÓRIOS",
  gaskets: "ACESSÓRIOS",
  clips: "ACESSÓRIOS",
  clip: "ACESSÓRIOS",
  ferragens: "ACESSÓRIOS",
  equipamento: "ACESSÓRIOS",
  "equipamento / pack": "ACESSÓRIOS",
  "equipamento / raft": "ACESSÓRIOS",
  geral: "ACESSÓRIOS",
  seguranca: "ACESSÓRIOS",
  "seguranca / hru": "ACESSÓRIOS",
  checklist: "ACESSÓRIOS",
  "manutencao e etiquetagem": "ACESSÓRIOS",
  "componentes criticos de conexao": "ACESSÓRIOS",
  "valvulas e vedantes": "ACESSÓRIOS",
  "etiquetagem / pack": "ACESSÓRIOS",
  "documentacao / pack": "ACESSÓRIOS",
  "ferramentas e teste": "ACESSÓRIOS",
  "inflacao / valvulas": "ACESSÓRIOS",
  "jangada lr97": "ACESSÓRIOS",
};

/**
 * Regras por prioridade (maior = ganha).
 * Avaliam nome/descrição/ref + categoria.
 * Ordem importante: regras específicas antes de genéricas.
 */
const PRIORITY_RULES: Array<{
  category: StockCanonicalCategory;
  priority: number;
  anyOf: string[];
  noneOf?: string[];
}> = [
  // --- Sinalização NÃO piro (antes de piro!) ---
  {
    category: "SINALIZAÇÃO",
    priority: 100,
    anyOf: [
      "apito",
      "whistle",
      "heliografo",
      "heliograph",
      "espelho de sinalizacao",
      "signalling mirror",
      "signaling mirror",
      "quadro de sinais",
      "rescue signal table",
      "tabela de sinais",
      "fita retrorefletora",
      "fita retrorrefletora",
      "reflective tape",
      "retroflective",
      "retroreflet",
    ],
  },

  // --- Pirotécnicos reais ---
  {
    category: "PIROTÉCNICOS",
    priority: 90,
    anyOf: [
      "pirotecn",
      "foguete",
      "paraquedas",
      "rocket",
      "parachute rocket",
      "facho",
      "hand flare",
      "red flare",
      "handflare",
      "pote de fumo",
      "smoke signal",
      "smoke float",
      "buoyant smoke",
      "pains wessex",
      "comets",
    ],
    noneOf: ["apito", "whistle", "heliog", "espelho", "quadro de sinais", "fita retro"],
  },

  // --- Coletes ---
  {
    category: "COLETES",
    priority: 88,
    anyOf: [
      "colete",
      "lifejacket",
      "life jacket",
      "inflatable vest",
      "crotchstrap",
      "crotch strap",
      "tiro cervical",
      "perneira colete",
    ],
  },

  // --- Vedantes / clips genéricos (antes de cabeças) ---
  {
    category: "ACESSÓRIOS",
    priority: 87,
    anyOf: ["o ring", "oring", "o'ring", "vedante", "gasket", "washer"],
    noneOf: ["op head", "rearm"],
  },

  // --- Cabeças de disparo / rearm (colete + jangada) ---
  {
    category: "CABEÇAS DE DISPARO",
    priority: 86,
    anyOf: [
      "op head",
      "ophead",
      "cabeca de disparo",
      "cabeça de disparo",
      "firing head",
      "bobbin",
      "rearm",
      "re-arm",
      "pro sensor",
      "pro-sensor",
      "mk5",
      "mk5i",
      "ma1",
      "js1 auto",
      "js1 ",
      "leafield",
      "thanner",
      "secumar pill",
      "retaining clip",
      "green clip",
    ],
    noneOf: ["cinta contentor", "contentor", "o ring", "oring", "gasket"],
  },

  // --- Primeiros socorros ---
  {
    category: "PRIMEIROS SOCORROS",
    priority: 85,
    anyOf: [
      "primeiros socorros",
      "first aid",
      "farmacia",
      "farmácia",
      "pharmacy",
      "comprimido",
      "enjoo",
      "seasick",
      "medicamento",
      "medicinal",
    ],
  },

  // --- Iluminação ---
  {
    category: "ILUMINAÇÃO",
    priority: 84,
    anyOf: [
      "lanterna",
      "torch",
      "flashlight",
      "bateria",
      "battery",
      "pilha",
      "luz interior",
      "luz exterior",
      "luz de cupula",
      "dome light",
      "lifejacket light",
      "dan light",
      "w2",
      "lithium",
    ],
    noneOf: ["facho", "flare", "foguete"],
  },

  // --- Contentores ---
  {
    category: "CONTENTORES",
    priority: 82,
    anyOf: [
      "contentor",
      "container",
      "canister",
      "valise",
      "cinta contentor",
      "jogo cintas",
      "flat pack",
      "throwover",
      "buckle",
      "fecho contentor",
    ],
  },

  // --- Tubos HP ---
  {
    category: "TUBOS DE ALTA PRESSÃO",
    priority: 80,
    anyOf: [
      "tubo de alta",
      "high pressure hose",
      "mangueira",
      "hose",
      "baioneta",
      "bayonet",
      "hp hose",
    ],
  },

  // --- Cilindros (exclui mini 33g de colete se já apanhado) ---
  {
    category: "CILINDROS",
    priority: 78,
    anyOf: ["cilindro", "cylinder", "garrafa co2", "garrafa n2", "co2 bottle", "n2 bottle", " bottle co2"],
    noneOf: ["op head", "rearm kit", "kit recarga"],
  },

  // --- Consumíveis (comida/água/sobrevivência com validade típica) ---
  {
    category: "CONSUMÍVEIS",
    priority: 76,
    anyOf: [
      "racao",
      "ração",
      "ration",
      "biscuit",
      "biscoito",
      "saco de agua",
      "saco de água",
      "agua potavel",
      "água potável",
      "drinking water",
      "fresh water",
      "food ration",
      "emergency food",
      "saco para enjoo",
      "sickness bag",
      "vomit bag",
      "ajuda termica",
      "thermal protective",
      "thermal blanket",
      "tpa",
      "estojo de pesca",
      "fishing kit",
      "kit de reparacao",
      "repair kit",
      "abre latas",
      "tin opener",
    ],
  },

  // --- Acessórios / equipamento pack ---
  {
    category: "ACESSÓRIOS",
    priority: 50,
    anyOf: [
      "fole",
      "bellows",
      "batedouro",
      "bailer",
      "balde",
      "faca",
      "knife",
      "pagaia",
      "paddle",
      "remo",
      "esponja",
      "sponge",
      "ancora flutuante",
      "sea anchor",
      "drogue",
      "painter",
      "retenida",
      "manual",
      "instrucoes",
      "o ring",
      "oring",
      "vedante",
      "gasket",
      "clip",
      "adaptador",
      "adapter",
      "valvula",
      "valve",
      "hru",
      "pega",
      "grab handle",
      "copo",
      "graduated cup",
    ],
  },
];

function textIncludesAny(haystack: string, needles: string[]) {
  return needles.some((n) => haystack.includes(normalizeCategoryText(n)));
}

function textIncludesNone(haystack: string, needles?: string[]) {
  if (!needles?.length) return true;
  return !needles.some((n) => haystack.includes(normalizeCategoryText(n)));
}

export function normalizeStockCategory(value: unknown, context?: unknown): StockCanonicalCategory {
  const categoryField = normalizeCategoryText(value);
  const contextText = normalizeCategoryText(context);
  const combined = [categoryField, contextText].filter(Boolean).join(" ");

  if (!combined) return "DIVERSOS";

  // 1) Regras prioritárias sobre o texto completo (nome+cat+ref)
  let best: { category: StockCanonicalCategory; priority: number } | null = null;
  for (const rule of PRIORITY_RULES) {
    if (!textIncludesAny(combined, rule.anyOf)) continue;
    if (!textIncludesNone(combined, rule.noneOf)) continue;
    if (!best || rule.priority > best.priority) {
      best = { category: rule.category, priority: rule.priority };
    }
  }
  if (best && best.priority >= 70) {
    // prioridade alta: confiar no conteúdo do artigo
    return best.category;
  }

  // 2) Alias exato do campo categoria
  if (categoryField) {
    const exact = EXACT_CATEGORY_ALIASES[categoryField];
    if (exact) return exact;

    const canonical = STOCK_CANONICAL_CATEGORIES.find(
      (category) => normalizeCategoryText(category) === categoryField
    );
    if (canonical) return canonical;
  }

  // 3) Melhor regra de prioridade restante
  if (best) return best.category;

  return "DIVERSOS";
}

export function getStockCategoryLabel(value: unknown, context?: unknown) {
  return normalizeStockCategory(value, context);
}

export function getStockCategoryOptions() {
  return STOCK_CANONICAL_CATEGORIES.map((category) => ({ value: category, label: category }));
}

export function getStockSubcategoryLabel(value: unknown, context?: unknown): string | null {
  const category = normalizeStockCategory(value, context);
  const combined = normalizeCategoryText([value, context].filter(Boolean).join(" "));
  if (!combined) return null;

  if (category === "PIROTÉCNICOS") {
    if (combined.includes("rocket") || combined.includes("paraquedas") || combined.includes("foguete")) return "Foguetes";
    if (combined.includes("smoke") || combined.includes("fumo")) return "Fumos";
    if (combined.includes("facho") || combined.includes("flare")) return "Fachos";
    return "Pirotecnia";
  }

  if (category === "SINALIZAÇÃO") {
    if (combined.includes("apito") || combined.includes("whistle")) return "Apitos";
    if (combined.includes("heliog") || combined.includes("espelho")) return "Heliógrafos";
    if (combined.includes("retro") || combined.includes("fita")) return "Fitas refletoras";
    if (combined.includes("quadro") || combined.includes("tabela")) return "Quadros de sinais";
    return "Sinalização";
  }

  if (category === "ILUMINAÇÃO") {
    if (combined.includes("bateria") || combined.includes("pilha") || combined.includes("battery")) return "Baterias/Pilhas";
    if (combined.includes("lanterna") || combined.includes("torch")) return "Lanternas";
    return "Luzes";
  }

  if (category === "CABEÇAS DE DISPARO") {
    if (combined.includes("bobbin") || combined.includes("pill")) return "Bobbins";
    if (combined.includes("rearm") || combined.includes("re-arm") || combined.includes("kit")) return "Kits recarga";
    return "Cabeças";
  }

  if (category === "TUBOS DE ALTA PRESSÃO") {
    if (combined.includes("bayonet") || combined.includes("baioneta")) return "Bayonet";
    if (combined.includes("mangueira") || combined.includes("hose")) return "Mangueiras";
    return "Tubagens";
  }

  if (category === "ACESSÓRIOS") {
    if (combined.includes("o ring") || combined.includes("oring") || combined.includes("vedante") || combined.includes("gasket")) {
      return "Vedantes";
    }
    if (combined.includes("adaptador") || combined.includes("adapter")) return "Adaptadores";
    if (combined.includes("fole") || combined.includes("bellows")) return "Foles";
    if (combined.includes("faca") || combined.includes("knife")) return "Facas";
    if (combined.includes("pagaia") || combined.includes("paddle")) return "Pagaias";
    return "Equipamento";
  }

  if (category === "CONSUMÍVEIS") {
    if (combined.includes("racao") || combined.includes("ration") || combined.includes("biscoito")) return "Rações";
    if (combined.includes("agua") || combined.includes("water")) return "Água";
    if (combined.includes("termica") || combined.includes("thermal") || combined.includes("tpa")) return "Térmicos";
    return "Consumíveis";
  }

  return null;
}

/** Recalcula categoria canónica a partir dos campos do artigo. */
export function classifyStockItem(input: {
  categoria?: unknown;
  descricao?: unknown;
  nome?: unknown;
  referencia?: unknown;
  codigoFabricante?: unknown;
}) {
  const context = [input.nome, input.descricao, input.referencia, input.codigoFabricante]
    .filter(Boolean)
    .join(" ");
  return normalizeStockCategory(input.categoria, context);
}
