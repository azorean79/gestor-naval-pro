import type { ManualCategory, TechnicalItem } from "@/types/departamento-tecnico-page";

export function normalizeToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isGenericManualBrand(value: string): boolean {
  const normalized = normalizeToken(value || '').trim();
  return normalized === 'generica' || normalized === 'generic';
}

export function buildBrandModelCountKey(brand: string, model: string): string {
  return `${normalizeToken(brand)}::${normalizeToken(model)}`;
}

export function inferManualCategory(fileName: string, relativePath?: string): ManualCategory {
  const fullLabel = [relativePath, fileName].filter(Boolean).join(' / ');
  const clean = fileName.replace(/\.[^/.]+$/, "");
  const normalizedFull = normalizeToken(fullLabel);

  const isColete = /(colete|coletes|life\s*jackets?|jackets?)/.test(normalizedFull);
  const isJangada = /(jangada|jangadas|raft|liferaft|lr\s?-?\s?\d+|mk\s?-?\s?iv|to\s?sr|surviva|seasava)/.test(normalizedFull);

  const equipamento: ManualCategory["equipamento"] = isColete
    ? "Coletes"
    : isJangada
      ? "Jangadas"
      : "Outros";

  const knownBrands = [
    "ZODIAC",
    "RFD",
    "EUROVINIL",
    "Survitec",
    "DSB",
    "Lalizas",
    "Viking",
    "Plastimo",
    "SEA-SAFE",
    "Arimar",
    "Seago",
    "Ocean Safety",
  ];

  const marca =
    knownBrands.find((brand) => normalizedFull.includes(normalizeToken(brand))) ||
    (normalizedFull.includes("surviva") ? "Survitec" : "Genérica");

  let modelo = "Geral";
  const mkMatch = fullLabel.match(/\b(MK\s?-?\s?[IVX0-9]+)\b/i);
  const lrMatch = fullLabel.match(/\b(LR\s?-?\s?\d{1,3})\b/i);
  const tosMatch = fullLabel.match(/\b(TO\s?SR|TO)\b/i);
  const modelMatch = fullLabel.match(/\b(model|modelo)\s*[:\-]?\s*([A-Za-z0-9\-_/ ]{2,30})/i);

  if (mkMatch?.[1]) {
    modelo = mkMatch[1].replace(/\s+/g, " ").toUpperCase();
  } else if (lrMatch?.[1]) {
    modelo = lrMatch[1].replace(/\s+/g, " ").toUpperCase();
  } else if (tosMatch?.[1]) {
    modelo = tosMatch[1].replace(/\s+/g, ' ').toUpperCase();
  } else if (modelMatch?.[2]) {
    modelo = modelMatch[2].trim();
  } else if (clean.trim() && normalizeToken(clean) !== normalizeToken(marca)) {
    modelo = clean.trim();
  } else if (relativePath) {
    const parts = relativePath.split(/[\\/]/).filter(Boolean);
    if (parts.length >= 2) {
      modelo = parts[parts.length - 2].replace(/[_-]+/g, ' ').trim() || 'Geral';
    }
  }

  return { equipamento, marca, modelo };
}

export function getMaxUploadBytesByFolder(folder: string): number {
  return folder === 'manuais' ? 50 * 1024 * 1024 : 500 * 1024 * 1024;
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"|?*]/g, "_").replace(/\.\./g, "_");
}

export function isAllowedUploadExtension(filename: string): boolean {
  const ext = filename.toLowerCase().split(".").pop();
  return Boolean(ext && ["pdf", "doc", "docx", "xls", "xlsx", "txt", "jpg", "jpeg", "png"].includes(ext));
}

export function getModelTubes(model: {
  name: string;
  keyTechnicalData?: { tubes?: string };
  serviceItems?: Array<{ name: string; reference?: string }>;
  spareParts?: Array<{ name: string; reference?: string }>;
}) {
  if (model.keyTechnicalData?.tubes) {
    return [model.keyTechnicalData.tubes];
  }

  const knownByModel: Record<string, string[]> = {
    'SEASAVA PLUS': ['30202044 (mangueira superior)', '30203001 (mangueira inferior)'],
  };

  if (knownByModel[model.name]) return knownByModel[model.name];

  const tubeTerms = /(hose|tubo|tubos|mangueira|mangueiras)/i;
  const items = [...(model.serviceItems || []), ...(model.spareParts || [])]
    .filter((item) => tubeTerms.test(item.name))
    .map((item) => item.reference ? `${item.name} (${item.reference})` : item.name);

  return Array.from(new Set(items));
}

export function getModelKeyTechnicalDisplay(model: {
  name: string;
  inflationSystem?: string[];
  valves?: string[];
  torques?: string[];
  keyTechnicalData?: {
    inflationSystem?: string;
    valves?: string;
    tubes?: string;
    torques?: string;
  };
  serviceItems?: Array<{ name: string; reference?: string }>;
  spareParts?: Array<{ name: string; reference?: string }>;
}) {
  const tubes = getModelTubes(model);

  return {
    inflationSystem: model.keyTechnicalData?.inflationSystem || (model.inflationSystem && model.inflationSystem.length > 0 ? model.inflationSystem.join(' / ') : '—'),
    valves: model.keyTechnicalData?.valves || (model.valves && model.valves.length > 0 ? model.valves.join(', ') : '—'),
    tubes: model.keyTechnicalData?.tubes || (tubes.length > 0 ? tubes.join(' • ') : '—'),
    torques: model.keyTechnicalData?.torques || (model.torques && model.torques.length > 0 ? model.torques.join(' • ') : '—'),
  };
}

export function getModelCompleteness(model: {
  inflationSystem?: string[];
  valves?: string[];
  torques?: string[];
  serviceItems?: Array<{ name: string; reference?: string }>;
  spareParts?: Array<{ name: string; reference?: string }>;
  name: string;
  keyTechnicalData?: {
    inflationSystem?: string;
    valves?: string;
    tubes?: string;
    torques?: string;
  };
}) {
  const keyDisplay = getModelKeyTechnicalDisplay(model);
  const hasMeaningfulValue = (value?: string) => Boolean(value && value.trim() && value.trim() !== '—');
  const hasInflation = hasMeaningfulValue(keyDisplay.inflationSystem);
  const hasValves = hasMeaningfulValue(keyDisplay.valves);
  const hasTubes = hasMeaningfulValue(keyDisplay.tubes);
  const hasTorques = hasMeaningfulValue(keyDisplay.torques);
  const score = [hasInflation, hasValves, hasTubes, hasTorques].filter(Boolean).length;

  if (score === 4) return { label: 'Completo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 2) return { label: 'Parcial', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Em revisão', className: 'bg-rose-50 text-rose-700 border-rose-200' };
}

export function getSpecN2DisplayValue(spec: { cylinder?: { co2?: number; n2?: number } }) {
  if (typeof spec.cylinder?.n2 === 'number') return spec.cylinder.n2;
  if (typeof spec.cylinder?.co2 === 'number') return 0;
  return null;
}

export function normalizeConfig(config?: string) {
  const n = normalizeToken(config || '');
  if (n.includes('throw') || n === 'to' || n.includes('to ')) return 'TO';
  if (n.includes('davit') || n === 'dl' || n.includes('dl ')) return 'DL';
  return null;
}

export function getItemSubsystem(item: TechnicalItem): string {
  const byCategory = normalizeToken(item.category || '');
  const byName = normalizeToken(item.name);
  const text = `${byCategory} ${byName}`;

  if (/(inflation|insufla|inflator|perc|disparo|regulator|cylinder|co2|n2|mangueira|hose)/.test(text)) return 'Insuflação';
  if (/(valve|valvula|válvula|nrvs|relief|safety valve)/.test(text)) return 'Válvulas';
  if (/(light|luz|lamp|battery|bateria|pilha|led)/.test(text)) return 'Iluminação';
  if (/(pack|container|valise|saco|bolsa|cinta|strap|stowage)/.test(text)) return 'Packs/Container';
  return 'Outros';
}

export function getItemCriticality(item: TechnicalItem) {
  const text = normalizeToken(`${item.name} ${item.category || ''} ${item.notes || ''}`);
  if (item.optional) {
    return { label: 'Baixa', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }

  if (/(inflator|head|cylinder|co2|n2|valve|valvula|válvula|perc|disparo|membrane|burst|regulator)/.test(text)) {
    return { label: 'Alta', className: 'bg-rose-50 text-rose-700 border-rose-200' };
  }

  if (/(light|luz|lamp|battery|bateria|pack|container|cinta|strap|hose|mangueira)/.test(text)) {
    return { label: 'Média', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  return { label: 'Média', className: 'bg-amber-50 text-amber-700 border-amber-200' };
}

export function groupItemsBySubsystem(items: TechnicalItem[]) {
  return items.reduce<Record<string, TechnicalItem[]>>((acc, item) => {
    const subsystem = getItemSubsystem(item);
    if (!acc[subsystem]) acc[subsystem] = [];
    acc[subsystem].push(item);
    return acc;
  }, {});
}

export function getModelConsistencyIssues(model: {
  name: string;
  packTypes?: string[];
  configuration?: string[];
  specifications: Array<{
    codRef?: string;
    capacity: number;
    pack?: string;
    configuration?: string;
    cylinder?: { co2?: number; n2?: number };
  }>;
}) {
  const issues: string[] = [];
  const validPackTokens = (model.packTypes || []).map((p) => normalizeToken(p));
  const normalizedConfigurations = (model.configuration || [])
    .map((cfg) => normalizeConfig(cfg))
    .filter((cfg): cfg is 'TO' | 'DL' => Boolean(cfg));
  const uniqueConfigurations = Array.from(new Set(normalizedConfigurations));

  const hasSpecConfiguration = model.specifications.some((s) => Boolean(s.configuration));
  if (hasSpecConfiguration && model.specifications.some((s) => !s.configuration)) {
    issues.push('Existem specs com configuração ausente (TO/DL).');
  }

  if (uniqueConfigurations.length > 1 && !hasSpecConfiguration) {
    issues.push('Modelo tem configuração TO/DL mas specs sem configuração explícita.');
  }

  const gasMissing = model.specifications.filter((s) => s.capacity > 0 && (s.cylinder?.co2 === undefined || s.cylinder?.co2 === null));
  if (gasMissing.length > 0) {
    issues.push(`Specs sem gases completos: ${gasMissing.map((s) => s.codRef || `${s.capacity}P`).join(', ')}.`);
  }

  const weirdPacks = model.specifications
    .filter((s) => s.pack && validPackTokens.length > 0)
    .filter((s) => !validPackTokens.some((token) => normalizeToken(s.pack || '').includes(token) || token.includes(normalizeToken(s.pack || ''))));
  if (weirdPacks.length > 0) {
    issues.push(`Pack possivelmente inconsistente em: ${weirdPacks.map((s) => s.codRef || `${s.capacity}P`).join(', ')}.`);
  }

  return issues;
}
