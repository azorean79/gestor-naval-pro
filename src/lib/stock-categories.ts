export const STOCK_CANONICAL_CATEGORIES = [
  "COLETES",
  "PRIMEIROS SOCORROS",
  "PIROTÉCNICOS",
  "CABEÇAS DE DISPARO",
  "CONTENTORES",
  "TUBOS DE ALTA PRESSÃO",
  "ACESSÓRIOS",
  "CONSUMÍVEIS",
  "CILINDROS",
  "DIVERSOS",
] as const;

export type StockCanonicalCategory = (typeof STOCK_CANONICAL_CATEGORIES)[number];

const EXACT_CATEGORY_ALIASES: Record<string, StockCanonicalCategory> = {
  "coletes": "COLETES",
  "colete": "COLETES",
  "coletes insuflaveis": "COLETES",
  "colete insuflavel": "COLETES",
  "inflacao de coletes": "COLETES",
  "inflacao coletes": "COLETES",
  "kits coletes": "COLETES",
  "kit coletes": "COLETES",
  "colete mk5": "COLETES",
  "mk5": "COLETES",
  "ma1": "COLETES",
  "cabeca ma1": "COLETES",
  "cabeca de disparo ma1": "COLETES",
  "garrafa 33g": "COLETES",
  "garrafas 33g": "COLETES",
  "cilindro 33g": "COLETES",
  "cilindros 33g": "COLETES",
  "sinalizacao": "PIROTÉCNICOS",
  "sinalizacao / pack": "PIROTÉCNICOS",
  "pirotecnia": "PIROTÉCNICOS",
  "pirotecnicos": "PIROTÉCNICOS",
  "cabecas de disparo": "CABEÇAS DE DISPARO",
  "cabeca de disparo": "CABEÇAS DE DISPARO",
  "contentores": "CONTENTORES",
  "contentor": "CONTENTORES",
  "containers e embalagem": "CONTENTORES",
  "cintas de fecho": "CONTENTORES",
  "cintas": "CONTENTORES",
  "tubos de alta pressao": "TUBOS DE ALTA PRESSÃO",
  "tubos": "TUBOS DE ALTA PRESSÃO",
  "mangueiras e baionetas": "TUBOS DE ALTA PRESSÃO",
  "acessorios": "ACESSÓRIOS",
  "acessorio": "ACESSÓRIOS",
  "vedantes e selagens": "ACESSÓRIOS",
  "sobrevivencia": "CONSUMÍVEIS",
  "sobrevivencia e consumiveis": "CONSUMÍVEIS",
  "primeiros socorros": "PRIMEIROS SOCORROS",
  "consumiveis": "CONSUMÍVEIS",
  "consumiveis / pack": "CONSUMÍVEIS",
  "consumiveis servico": "CONSUMÍVEIS",
  "equipamento": "ACESSÓRIOS",
  "equipamento / pack": "ACESSÓRIOS",
  "equipamento / raft": "ACESSÓRIOS",
  "geral": "ACESSÓRIOS",
  "seguranca": "ACESSÓRIOS",
  "seguranca / hru": "ACESSÓRIOS",
  "checklist": "ACESSÓRIOS",
  "mecanica e sistemas de disparo": "CABEÇAS DE DISPARO",
  "manutencao e etiquetagem": "ACESSÓRIOS",
  "sistemas de insuflacao": "TUBOS DE ALTA PRESSÃO",
  "componentes criticos de conexao": "ACESSÓRIOS",
  "jangada lr97": "ACESSÓRIOS",
  "valvulas e vedantes": "ACESSÓRIOS",
  "etiquetagem / pack": "ACESSÓRIOS",
  "documentacao / pack": "ACESSÓRIOS",
  "ferramentas e teste": "ACESSÓRIOS",
  "inflacao / cabecas": "CABEÇAS DE DISPARO",
  "inflacao / valvulas": "ACESSÓRIOS",
  "cilindros": "CILINDROS",
  "cilindros / packs": "CILINDROS",
  "cilindro": "CILINDROS",
  "garrafa": "CILINDROS",
  "co2": "CILINDROS",
  "n2": "CILINDROS",
};

const KEYWORD_BUCKETS: Array<{ keywords: string[]; category: StockCanonicalCategory }> = [
  {
    keywords: [
      "colete",
      "coletes",
      "lifejacket",
      "life jacket",
      "inflatable vest",
      "ma1",
      "mk5",
      "cabeça ma1",
      "cabeca ma1",
      "33g",
      "garrafa 33",
      "cilindro 33",
      "kit colete",
      "kit de colete",
      "dispositivo de inflacao",
      "ucho",
    ],
    category: "COLETES",
  },
  {
    keywords: ["fogo", "facho", "flare", "rocket", "paraquedas", "smoke", "fumo", "sinal", "piro"],
    category: "PIROTÉCNICOS",
  },
  {
    keywords: ["farm", "first aid", "primeiros socorros", "comprim", "tablet", "enjoo", "seasick", "pharmacy", "medicamento", "medicinal", "medicina"],
    category: "PRIMEIROS SOCORROS",
  },
  {
    keywords: ["head", "cabeca", "cabeça", "disparo", "firing", "gist", "leafield", "thanner", "nss", "vte", "hsr"],
    category: "CABEÇAS DE DISPARO",
  },
  {
    keywords: ["contentor", "container", "canister", "valise", "casco", "shell", "cinta", "strap", "fecho", "buckle", "closure", "banda"],
    category: "CONTENTORES",
  },
  {
    keywords: ["hose", "tubo", "mangueira", "high pressure", "alta pressao", "bayonet", "baioneta"],
    category: "TUBOS DE ALTA PRESSÃO",
  },
  {
    keywords: ["acessor", "adapter", "adaptador", "union", "porca", "o-ring", "oring", "vedante", "seal", "valvula"],
    category: "ACESSÓRIOS",
  },
  {
    keywords: ["agua", "water", "racao", "ration", "consum", "copo", "cup", "vomit", "embal", "luz", "light", "lanterna", "torch", "bateria", "battery", "thermal", "surviv", "sobreviv", "pesca", "fishing", "protecao termica", "heliograph", "agua doce", "fresh water", "biscuit", "biscoito", "chocolate", "alimento"],
    category: "CONSUMÍVEIS",
  },
  {
    keywords: ["cilindro", "cylinder", "garrafa", "co2", "n2", "gas", "nitrogenio", "carbono"],
    category: "CILINDROS",
  }
];

function normalizeCategoryText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ");
}

export function normalizeStockCategory(value: unknown, context?: unknown): StockCanonicalCategory {
  const normalized = normalizeCategoryText(value);
  const contextText = normalizeCategoryText(context);
  const combined = [normalized, contextText].filter(Boolean).join(' ');
  
  // Se não há nenhum conteúdo, retorna DIVERSOS
  if (!combined) return "DIVERSOS";

  // Tenta corresponder a um alias exato
  const exact = EXACT_CATEGORY_ALIASES[normalized];
  if (exact) return exact;

  // Tenta corresponder a uma categoria canónica
  const canonical = STOCK_CANONICAL_CATEGORIES.find(
    (category) => normalizeCategoryText(category) === normalized
  );
  if (canonical) return canonical;

  // Procura por keywords nos buckets (pesquisa no texto combinado)
  for (const bucket of KEYWORD_BUCKETS) {
    if (bucket.keywords.some((keyword) => combined.includes(normalizeCategoryText(keyword)))) {
      return bucket.category;
    }
  }

  // Se nada corresponde, retorna DIVERSOS
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
  if (!category) return null;

  const combined = normalizeCategoryText([value, context].filter(Boolean).join(" "));
  if (!combined) return null;

  if (category === "PIROTÉCNICOS") {
    if (combined.includes("rocket") || combined.includes("paraquedas")) return "Foguetes";
    if (combined.includes("smoke") || combined.includes("fumo")) return "Fumos";
    return "Fachos";
  }

  if (category === "TUBOS DE ALTA PRESSÃO") {
    if (combined.includes("bayonet") || combined.includes("baioneta")) return "Bayonet";
    if (combined.includes("mangueira") || combined.includes("hose")) return "Mangueiras";
    return "Tubagens";
  }

  if (category === "ACESSÓRIOS") {
    if (combined.includes("o ring") || combined.includes("oring") || combined.includes("vedante")) return "Vedantes";
    if (combined.includes("adaptador") || combined.includes("adapter")) return "Adaptadores";
    return "Acessórios gerais";
  }

  return null;
}