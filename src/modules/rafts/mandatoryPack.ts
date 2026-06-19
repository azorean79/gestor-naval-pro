import { isRaftManagedPackArticleName, obterArtigosObrigatorios, normalizarPackType } from '../../config/packTemplates';
import {
  BELLOWS_STOCK_REFERENCE,
  DRINKING_WATER_STOCK_REFERENCE,
  FOOD_RATIONS_STOCK_REFERENCE,
  PYRO_HANDFLARE_STOCK_REFERENCE,
  PYRO_PARACHUTE_STOCK_REFERENCE,
  PYRO_SMOKE_STOCK_REFERENCE,
  TABLETS_STOCK_REFERENCE,
} from '../../lib/stock-reference-rules';
import { findRaftTechnicalModel } from './raftModelData';
import type { RaftTechnicalItem } from './types';

export type MandatoryPackSection = 'emergency' | 'equipment' | 'raft';

export type MandatoryPackItem = {
  source: 'technical' | 'template';
  packCode: string;
  technicalName: string;
  label: string;
  englishLabel: string;
  checklistName: string;
  validityFieldName?: string;
  category: string;
  section: MandatoryPackSection;
  quantity: number;
  quantityLabel: string;
  reference?: string;
  stockReferences: string[];
  articleTokens: string[];
  notes?: string;
  optional?: boolean;
};

export type CustomMandatoryPackArticleInput = {
  name: string;
  quantity: number;
  reference?: string | null;
  category?: string | null;
  notes?: string | null;
};

type PackFieldDefinition = {
  aliases: string[];
  label: string;
  englishLabel: string;
  name: string;
  validityFieldName?: string;
  category?: string;
  section?: MandatoryPackSection;
  stockReferences?: string[];
  articleTokens?: string[];
  defaultQuantity?: number;
};

type PackContext = {
  brand?: string | null;
  model?: string | null;
  packType?: string | null;
  capacity?: number | null;
};

type MatchableArticle = {
  name?: string | null;
  referencia?: string | null;
  quantidade?: number | string | null;
  validade?: string | null;
};

type TemplateFallbackItem = {
  quantity: number;
  quantityLabel: string;
};

const TECHNICAL_PACK_ALIASES: Record<string, string[]> = {
  D: ['D', 'PACK D', 'COASTEIRA', 'NAVEGACAO COSTEIRA'],
  E: ['E', 'PACK E', 'COASTAL', 'PACK 2', '<24H', 'PESCA LOCAL', 'PESCA COSTEIRA', 'SIMPLIFICADO REDUZIDO', 'REDUZIDO'],
  R: ['R', 'PACK R', 'VELA DE COMPETICAO', 'SIMPLIFICADO MÍNIMO', 'SIMPLIFICADO MINIMO'],
  STD: ['STD', 'STANDARD', 'PACK STD', 'STANDARD PACK'],
  'CRUISER STANDARD': ['CRUISER STANDARD', 'STANDARD (STD / R)', 'STANDARD', 'STD', 'R'],
  INTERNACIONAL: ['INTERNACIONAL', 'INTERNATIONAL', 'STD'],
  OFFSHORE: ['OFFSHORE', 'PACK 1', '>24H', 'CRUISER ORC+', 'ORC+'],
  COASTAL: ['COASTAL', 'PACK 2', '<24H', 'E', 'SIMPLIFICADO REDUZIDO', 'REDUZIDO', 'CRUISER ORC', 'ORC'],
  'ISO-RAFT': ['ISO-RAFT', 'ISO'],
  'SOLAS B': ['SOLAS B', 'SOLAS-B', 'B-PACK'],
  'ST-INTL': ['ST-INTL', 'STANDARD INTERNATIONAL', 'ST INTL', 'STD INT', 'STD. INT', 'STANDARD INT', 'ST-USA', 'ST USA'],
  'ST-GREEK': ['ST-GREEK', 'STANDARD GREEK PACK', 'ST GREEK'],
  'DM-219': ['DM-219', 'DM219', 'ISO9650 ITA', 'ITALIA DM219'],
  'ITA GRAB BAG': ['ITA GRAB BAG', 'ISO9650-1 ITA GRAB BAG', 'GRAB BAG ITA'],
};

const PACK_FIELD_DEFINITIONS: PackFieldDefinition[] = [
  {
    aliases: ['PARACHUTE ROCKETS', 'FLARE PARACHUTE', 'PARACHUTE SIGNAL', 'SINAL COM PARAQUEDAS', 'SINAIS COM PARAQUEDAS', 'PARAQUEDAS'],
    label: 'Foguetes Paraquedas',
    englishLabel: 'Parachute Rockets',
    name: 'foguetoes_paraquedas',
    validityFieldName: 'validade_paraquedas',
    category: 'SINALIZAÇÃO',
    section: 'emergency',
    stockReferences: [PYRO_PARACHUTE_STOCK_REFERENCE, '20577723'],
    defaultQuantity: 2,
  },
  {
    aliases: ['RED HAND FLARES', 'FLARE HAND', 'HAND HELD FLARE', 'HAND FLARE', 'FACHOS DE MAO', 'FACHOS DE MÃO'],
    label: 'Fachos de Mão',
    englishLabel: 'Red Hand Flares',
    name: 'fachos_mao',
    validityFieldName: 'validade_fachos_mao',
    category: 'SINALIZAÇÃO',
    section: 'emergency',
    stockReferences: [PYRO_HANDFLARE_STOCK_REFERENCE],
    defaultQuantity: 2,
  },
  {
    aliases: ['FLOATING SMOKE SIGNALS', 'SMOKE SIGNAL', 'POTES DE FUMO', 'POTE DE FUMO', 'SINAL FUMIGENO'],
    label: 'Potes de Fumo',
    englishLabel: 'Floating Smoke Signals',
    name: 'potes_fumo',
    validityFieldName: 'validade_potes_fumo',
    category: 'SINALIZAÇÃO',
    section: 'emergency',
    stockReferences: [PYRO_SMOKE_STOCK_REFERENCE, 'PYR-SMOKE-ORANGE'],
    defaultQuantity: 1,
  },
  {
    aliases: ['WATERPROOF TORCH', 'TORCH WATERPROOF', 'TORCH', 'LANTERNA'],
    label: 'Lanterna',
    englishLabel: 'Waterproof Torch',
    name: 'lanterna',
    category: 'SINALIZAÇÃO',
    section: 'emergency',
    stockReferences: ['TORCH-WATERPROOF'],
    defaultQuantity: 1,
  },
  {
    aliases: ['TORCH BATTERIES', 'BATTERIES FOR TORCH', 'PILHAS PARA LANTERNA', 'PILHAS LANTERNA'],
    label: 'Pilhas para Lanterna',
    englishLabel: 'Torch Batteries',
    name: 'pilhas_lanterna',
    validityFieldName: 'validade_pilhas_lanterna',
    category: 'ILUMINAÇÃO',
    section: 'emergency',
    stockReferences: ['20903168'],
    defaultQuantity: 4,
  },
  {
    aliases: ['BATERIA DE LITIO', 'BATERIA DE LÍTIO', 'LITHIUM BATTERY', 'BATERIA DE LITHIUM'],
    label: 'Bateria de Lítio',
    englishLabel: 'Lithium Battery',
    name: 'bateria_litio',
    validityFieldName: 'validade_bateria',
    category: 'ILUMINAÇÃO',
    section: 'emergency',
    stockReferences: ['30202206'],
    defaultQuantity: 1,
  },
  {
    aliases: ['FIRST AID KIT', 'KIT DE PRIMEIROS SOCORROS', 'FARMACIA', 'FARMÁCIA', 'AMBULANCIA', 'AMBULÂNCIA'],
    label: 'Farmácia Solas',
    englishLabel: 'First Aid Kit',
    name: 'ambulancia',
    validityFieldName: 'validade_farmacia',
    category: 'PRIMEIROS SOCORROS',
    section: 'emergency',
    stockReferences: ['30202207', '30202050', 'MED-KIT-ISO', 'MED-KIT-SOLAS'],
    defaultQuantity: 1,
  },
  {
    aliases: ['SEASICKNESS TABLETS', 'ANTI SEA SICKNESS TABLETS', 'COMPRIMIDOS ANTI ENJOO', 'COMPRIMIDOS P ENJOO'],
    label: 'Comprimidos p/ Enjoo',
    englishLabel: 'Seasickness Tablets',
    name: 'comprimidos_enjoo',
    validityFieldName: 'validade_comprimidos',
    category: 'PRIMEIROS SOCORROS',
    section: 'emergency',
    stockReferences: [TABLETS_STOCK_REFERENCE, 'TAB-SICKNESS'],
    defaultQuantity: 1,
  },
  {
    aliases: ['DRINKING WATER', 'WATER SACHET', 'WATER SACHETS', 'AGUA POTAVEL', 'ÁGUA POTÁVEL', 'AGUA'],
    label: 'Saco de Água',
    englishLabel: 'Drinking Water',
    name: 'saco_agua',
    validityFieldName: 'validade_agua',
    category: 'CONSUMÍVEIS',
    section: 'emergency',
    stockReferences: [DRINKING_WATER_STOCK_REFERENCE],
    defaultQuantity: 1,
  },
  {
    aliases: ['FOOD RATIONS', 'FOOD RATION', 'RACOES', 'RAÇÕES'],
    label: 'Rações Alimentares 0,5 Kg',
    englishLabel: 'Food Rations 0,5 Kg',
    name: 'racoes_alimentares',
    validityFieldName: 'validade_racoes',
    category: 'CONSUMÍVEIS',
    section: 'emergency',
    stockReferences: [FOOD_RATIONS_STOCK_REFERENCE],
    defaultQuantity: 1,
  },
  {
    aliases: ['DRINKING CUPS', 'DRINKING CUP', 'RECIPIENTE PARA BEBER', 'COPO DE AGUA', 'COPO DE ÁGUA', 'CANECA'],
    label: 'Copo Graduado',
    englishLabel: 'Drinking Cup',
    name: 'copo_graduado',
    category: 'CONSUMÍVEIS',
    section: 'emergency',
    defaultQuantity: 1,
  },
  {
    aliases: ['THERMAL PROTECTIVE AID', 'THERMAL PROTECTION AID', 'AJUDAS TERMICAS', 'AJUDAS TÉRMICAS'],
    label: 'Ajudas Térmicas',
    englishLabel: 'Thermal Protective Aids',
    name: 'ajudas_termicas',
    category: 'SOBREVIVÊNCIA',
    section: 'emergency',
    stockReferences: ['THER-BLANKET-TPA', 'THERM-BLANKET'],
    defaultQuantity: 1,
  },
  {
    aliases: ['WHISTLE', 'APITO'],
    label: 'Apito',
    englishLabel: 'Whistle',
    name: 'apito',
    category: 'SINALIZAÇÃO',
    section: 'emergency',
    stockReferences: ['WHISTLE-SOLAS'],
    defaultQuantity: 1,
  },
  {
    aliases: ['LIFEBUOY RING WITH LINE', 'LIFEBUOY RING', 'ANEL SALVA VIDAS COM CABO', 'ANEL SALVA VIDAS'],
    label: 'Anel Salva-Vidas com Cabo',
    englishLabel: 'Lifebuoy Ring with Line',
    name: 'anel_salva_vidas_cabo',
    category: 'EQUIPAMENTO',
    section: 'equipment',
    defaultQuantity: 1,
  },
  {
    aliases: ['IMMEDIATE ACTION', 'AÇÃO IMEDIATA', 'ACAO IMEDIATA'],
    label: 'Ação Imediata',
    englishLabel: 'Immediate Action',
    name: 'acao_imediata',
    category: 'EQUIPAMENTO',
    section: 'equipment',
    defaultQuantity: 1,
  },
  {
    aliases: ['FISHING KIT', 'ESTOJO DE PESCA'],
    label: 'Estojo de Pesca',
    englishLabel: 'Fishing Kit',
    name: 'estojo_pesca',
    category: 'SOBREVIVÊNCIA',
    section: 'emergency',
    stockReferences: ['FISH-KIT'],
    defaultQuantity: 1,
  },
  {
    aliases: ['KNIFE', 'FACA'],
    label: 'Faca',
    englishLabel: 'Knife',
    name: 'faca',
    category: 'EQUIPAMENTO',
    section: 'equipment',
    stockReferences: ['KNIFE-FLOATING'],
    defaultQuantity: 1,
  },
  {
    aliases: ['SPONGE', 'SPONGES', 'ESPONJA', 'ESPONJAS'],
    label: 'Esponjas',
    englishLabel: 'Sponges',
    name: 'esponjas',
    category: 'EQUIPAMENTO',
    section: 'emergency',
    defaultQuantity: 1,
  },
  {
    aliases: ['TIN OPENER', 'TIN OPENERS', 'ABRE LATAS', 'ABRE-LATAS'],
    label: 'Abre-Latas',
    englishLabel: 'Tin Openers',
    name: 'abre_latas',
    category: 'EQUIPAMENTO',
    section: 'emergency',
    defaultQuantity: 2,
  },
  {
    aliases: ['SCISSORS', 'TESOURAS'],
    label: 'Tesouras',
    englishLabel: 'Scissors',
    name: 'tesouras',
    category: 'EQUIPAMENTO',
    section: 'emergency',
    defaultQuantity: 1,
  },
  {
    aliases: ['SEA SICK BAGS', 'SEASICKNESS BAGS', 'BAG SEASICKNESS', 'SACOS PARA ENJOO', 'SACOS DE ENJOO', 'SACO DE ENJOO'],
    label: 'Sacos para Enjoo',
    englishLabel: 'Seasickness Bags',
    name: 'sacos_enjoo',
    category: 'CONSUMÍVEIS',
    section: 'emergency',
    stockReferences: ['BAG-SICKNESS'],
    defaultQuantity: 1,
  },
  {
    aliases: ['HELIOGRAPH', 'SIGNAL MIRROR', 'MIRROR', 'HELIOGRAFO', 'HELIÓGRAFO'],
    label: 'Heliógrafo',
    englishLabel: 'Signalling Mirror',
    name: 'heliografo',
    category: 'SINALIZAÇÃO',
    section: 'emergency',
    stockReferences: ['HELIOGRAPH'],
    defaultQuantity: 1,
  },
  {
    aliases: ['SURVIVAL INSTRUCTIONS', 'INSTRUCTIONS MANUAL', 'INSTRUCTIONS', 'MANUAL DE SOBREVIVENCIA', 'MANUAL DE SOBREVIVÊNCIA'],
    label: 'Manual de Sobrevivência',
    englishLabel: 'Survival Manual',
    name: 'manual_sobrevivencia',
    category: 'EQUIPAMENTO',
    section: 'emergency',
    stockReferences: ['MANUAL-SURVIVAL'],
    defaultQuantity: 1,
  },
  {
    aliases: ['INTERNAL USER MANUAL', 'MANUAL INTERNO DO UTILIZADOR', 'MANUAL INTERNO UTILIZADOR'],
    label: 'Manual Interno do Utilizador',
    englishLabel: 'Internal User Manual',
    name: 'manual_interno_utilizador',
    category: 'EQUIPAMENTO',
    section: 'equipment',
    stockReferences: ['MANUAL-SURVIVAL'],
    defaultQuantity: 1,
  },
  {
    aliases: ['RESCUE SIGNAL TABLE', 'SIGNALLING TABLE', 'RESCUE SIGNALS TABLE', 'QUADRO DE SINAIS', 'QUADRO C SINAIS SALVAMENTO'],
    label: 'Quadro de Sinais',
    englishLabel: 'Signalling Table',
    name: 'quadro_sinais',
    category: 'EQUIPAMENTO',
    section: 'emergency',
    stockReferences: ['CARD-SALVAGE-SIGNALS'],
    defaultQuantity: 1,
  },
  {
    aliases: ['PADDLES', 'OARS', 'REMOS', 'PAGAIAS'],
    label: 'Pagaias',
    englishLabel: 'Paddles',
    name: 'pagaias',
    category: 'EQUIPAMENTO',
    section: 'equipment',
    defaultQuantity: 2,
  },
  {
    aliases: ['BELLOWS', 'BOMBA', 'FOLE', 'PUMP'],
    label: 'Fole',
    englishLabel: 'Bellows',
    name: 'fole',
    category: 'EQUIPAMENTO',
    section: 'equipment',
    stockReferences: [BELLOWS_STOCK_REFERENCE],
    defaultQuantity: 1,
  },
  {
    aliases: ['TORCH KIT', 'KIT DE LANTERNA'],
    label: 'Kit de Lanterna',
    englishLabel: 'Torch Kit',
    name: 'kit_lanterna',
    category: 'ILUMINAÇÃO',
    section: 'equipment',
    stockReferences: ['TORCH-WATERPROOF'],
    defaultQuantity: 1,
  },
  {
    aliases: ['REPAIR KIT', 'KIT DE REPARACAO', 'KIT DE REPARAÇÃO'],
    label: 'Jogo de Reparação',
    englishLabel: 'Repair Kit',
    name: 'jogo_reparacao',
    category: 'EQUIPAMENTO',
    section: 'equipment',
    stockReferences: ['20909107', 'REPAIR-KIT-PLUGS'],
    defaultQuantity: 1,
  },
  {
    aliases: ['SEA ANCHOR', 'DROGUE', 'ANCORA FLUTUANTE', 'ÂNCORA FLUTUANTE'],
    label: 'Âncora Flutuante com Linha',
    englishLabel: 'Sea Anchor with Line',
    name: 'ancora_flutuante_linha',
    category: 'EQUIPAMENTO',
    section: 'equipment',
    stockReferences: ['DROGUE-ANCHOR'],
    defaultQuantity: 1,
  },
  {
    aliases: ['BAILER', 'VERTEDOURO', 'BALDE', 'COPO VERTEDOURO'],
    label: 'Batedouro',
    englishLabel: 'Bailer',
    name: 'batedouro',
    category: 'EQUIPAMENTO',
    section: 'equipment',
    defaultQuantity: 1,
  },
];

function normalizeText(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function slugify(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function dedupe(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

function splitReferences(reference?: string | null) {
  return String(reference || '')
    .split(/\s*\/\s*|\s*,\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseQuantity(rawQuantity: string | undefined, capacity: number, itemName: string, fallback = 1) {
  const raw = String(rawQuantity || '').trim();
  if (!raw) return fallback;

  const normalized = raw.replace(/,/g, '.').toLowerCase();
  const numericMatch = normalized.match(/\d+(?:\.\d+)?/);
  const numericValue = numericMatch ? Number(numericMatch[0]) : null;

  if (normalized.includes('por pessoa') || normalized.includes('pessoas') || normalized.includes('per person') || normalized.includes('pax')) {
    if (capacity <= 0) return fallback;
    if (numericValue === null || !Number.isFinite(numericValue)) return capacity;
    if (normalized.includes('water') || normalized.includes('agua') || normalized.includes('água')) {
      return Math.max(capacity, Math.ceil(capacity * numericValue));
    }
    return Math.max(1, Math.ceil(capacity * numericValue));
  }

  if (numericValue !== null && Number.isFinite(numericValue)) {
    return Math.max(1, Math.ceil(numericValue));
  }

  if (normalizeText(itemName).includes('TORCH BATTER')) return 4;
  return fallback;
}

function resolvePackFieldDefinition(itemName: string) {
  const normalized = normalizeText(itemName);
  let bestMatch: { definition: PackFieldDefinition; score: number } | null = null;

  for (const definition of PACK_FIELD_DEFINITIONS) {
    for (const alias of definition.aliases) {
      const normAlias = normalizeText(alias);
      if (!normAlias) continue;

      let score = -1;
      if (normalized === normAlias) {
        score = 10_000 + normAlias.length;
      } else if (normalized.includes(normAlias)) {
        score = 1_000 + normAlias.length;
      } else if (normAlias.includes(normalized)) {
        score = 100 + normalized.length;
      }

      if (score > (bestMatch?.score ?? -1)) {
        bestMatch = { definition, score };
      }
    }
  }

  return bestMatch?.definition;
}

function buildTemplateFallbackMap(packType: string, capacity: number) {
  const normalizedPackType = normalizarPackType(packType);
  if (!normalizedPackType || capacity <= 0) return new Map<string, TemplateFallbackItem>();

  const fallbackMap = new Map<string, TemplateFallbackItem>();
  const templateArticles = obterArtigosObrigatorios(normalizedPackType, capacity);

  for (const article of templateArticles) {
    if (isRaftManagedPackArticleName(article.nome)) continue;

    const definition = resolvePackFieldDefinition(article.nome);
    if (!definition) continue;

    fallbackMap.set(definition.name, {
      quantity: article.quantidade,
      quantityLabel: article.descricaoQuantidade,
    });
  }

  return fallbackMap;
}

function buildUnknownPackItem(
  item: RaftTechnicalItem,
  packCode: string,
  capacity: number,
  source: 'technical' | 'template',
): MandatoryPackItem {
  const quantity = parseQuantity(item.quantity, capacity, item.name, 1);
  const references = splitReferences(item.reference);
  const slug = slugify(item.name) || 'artigo_pack';
  return {
    source,
    packCode,
    technicalName: item.name,
    label: item.name,
    englishLabel: item.name,
    checklistName: `pack_${slug}`,
    category: item.category || 'OUTROS',
    section: 'emergency',
    quantity,
    quantityLabel: item.quantity || `${quantity} unidade${quantity !== 1 ? 's' : ''}`,
    reference: references[0],
    stockReferences: references,
    articleTokens: dedupe([item.name]),
    notes: item.notes,
    optional: item.optional,
  };
}

function isRecreationalPack(packCode: string) {
  const norm = packCode.toUpperCase().trim();
  return norm === 'D' || norm === 'R' || norm === 'STD' || norm === 'INTERNACIONAL' || norm === 'CRUISER STANDARD' || norm === 'ST-INTL' || norm === 'ST-GREEK' || norm === 'ISO' || norm === 'ISO-RAFT' || norm === 'COASTAL' || norm === 'OFFSHORE' || norm.includes('PACK D') || norm.includes('PACK R') || norm.includes('PACK STD') || norm.includes('PACK 2');
}

function buildMandatoryItem(
  item: RaftTechnicalItem,
  packCode: string,
  capacity: number,
  source: 'technical' | 'template',
  templateFallbacks?: Map<string, TemplateFallbackItem>,
): MandatoryPackItem {
  const definition = resolvePackFieldDefinition(item.name);
  if (!definition) return buildUnknownPackItem(item, packCode, capacity, source);

  let references = dedupe([...splitReferences(item.reference), ...(definition.stockReferences || [])]);
  
  // Regra especial Recreio: se for farmácia e pack de recreio, a referência prioritária é 30202050
  if (definition.name === 'ambulancia' && isRecreationalPack(packCode)) {
    const specialRef = '30202050';
    if (references.includes(specialRef)) {
      references = [specialRef, ...references.filter(r => r !== specialRef)];
    }
  }

  const templateFallback = item.quantity ? undefined : templateFallbacks?.get(definition.name);
  const quantity = item.quantity
    ? parseQuantity(item.quantity, capacity, item.name, definition.defaultQuantity || 1)
    : (templateFallback?.quantity ?? (definition.defaultQuantity || 1));
  const quantityLabel = item.quantity
    ? item.quantity
    : (templateFallback?.quantityLabel || `${quantity} unidade${quantity !== 1 ? 's' : ''}`);

  return {
    source,
    packCode,
    technicalName: item.name,
    label: definition.label,
    englishLabel: definition.englishLabel,
    checklistName: definition.name,
    validityFieldName: definition.validityFieldName,
    category: item.category || definition.category || 'OUTROS',
    section: definition.section || 'emergency',
    quantity,
    quantityLabel,
    reference: references[0],
    stockReferences: references,
    articleTokens: dedupe([item.name, definition.label, definition.englishLabel, ...(definition.articleTokens || [])]),
    notes: item.notes,
    optional: item.optional,
  };
}

function dedupeMandatoryItems(items: MandatoryPackItem[]) {
  const byKey = new Map<string, MandatoryPackItem>();

  for (const item of items) {
    const key = item.checklistName;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }

    byKey.set(key, {
      ...existing,
      quantity: Math.max(existing.quantity, item.quantity),
      quantityLabel: existing.quantityLabel !== '1 unidade' ? existing.quantityLabel : item.quantityLabel,
      reference: existing.reference || item.reference,
      stockReferences: dedupe([...existing.stockReferences, ...item.stockReferences]),
      articleTokens: dedupe([...existing.articleTokens, ...item.articleTokens]),
      notes: existing.notes || item.notes,
    });
  }

  return Array.from(byKey.values());
}

export function normalizeMandatoryPackCode(packType?: string | null, model?: string | null) {
  const raw = String(packType || '').trim().toUpperCase();
  const compact = raw.replace(/\s+/g, ' ').trim();
  const normalizedModel = normalizeText(model);
  const isSeasavaPlus = normalizedModel.includes('SEASAVA PLUS');

  if (!compact && normalizedModel.includes('SEASAVA PLUS R')) return 'R';
  if (isSeasavaPlus && (compact.includes('SIMPLIFICADO MINIMO') || compact.includes('SIMPLIFICADO MÍNIMO'))) return 'R';
  if (isSeasavaPlus && (compact.includes('SIMPLIFICADO REDUZIDO') || compact.includes('REDUZIDO'))) return 'E';
  if (compact === 'INTERNACIONAL' || compact === 'INTERNATIONAL') return 'INTERNACIONAL';
  if (compact.includes('CRUISER STANDARD') || (compact.includes('STANDARD') && compact.includes('STD') && compact.includes('/ R'))) return 'CRUISER STANDARD';
  if (compact.includes('ST-GREEK') || compact.includes('STANDARD GREEK')) return 'ST-GREEK';
  if (
    compact.includes('ST-INTL') ||
    compact.includes('ST INTL') ||
    compact.includes('STD INT') ||
    compact.includes('STANDARD INTERNATIONAL') ||
    compact.includes('STANDARD INT') ||
    compact.includes('ST-USA') ||
    compact.includes('ST USA')
  ) return 'ST-INTL';
  if (compact === 'D' || compact.includes('PACK D') || compact.includes('COASTEIRA') || compact.includes('NAVEGACAO COSTEIRA')) return 'D';
  if (compact === 'E' || compact.includes('PACK E') || compact.includes('PESCA LOCAL') || compact.includes('PESCA COSTEIRA')) return 'E';
  if (compact === 'STD' || compact.includes('PACK STD') || compact.includes('STANDARD PACK')) return 'STD';
  if (compact === 'R' || compact.includes('PACK R') || compact.includes('VELA DE COMPETICAO')) return 'R';

  return normalizarPackType(raw) || compact;
}

export function matchesMandatoryPack(entryPack?: string | null, selectedPack?: string | null, model?: string | null) {
  const entry = normalizeMandatoryPackCode(entryPack, model);
  const selected = normalizeMandatoryPackCode(selectedPack, model);
  if (!entry || !selected) return false;
  if (entry === selected) return true;

  const entryAliases = TECHNICAL_PACK_ALIASES[entry] || [entry];
  const selectedAliases = TECHNICAL_PACK_ALIASES[selected] || [selected];
  return entryAliases.some((alias) => selectedAliases.includes(alias));
}

export function getMandatoryPackItemsForRaft(context: PackContext) {
  const brand = String(context.brand || '').trim();
  const model = String(context.model || '').trim();
  const packCode = normalizeMandatoryPackCode(context.packType, model);
  const capacity = Number(context.capacity || 0);
  const templateFallbacks = buildTemplateFallbackMap(String(context.packType || ''), capacity);

  const technicalModel = findRaftTechnicalModel(brand, model);
  const selectedPack = technicalModel?.packEquipment?.find((entry) => matchesMandatoryPack(entry.pack, packCode, model))
    || technicalModel?.packEquipment?.find((entry) => matchesMandatoryPack(entry.pack, normalizeMandatoryPackCode(context.packType), model))
    || null;

  if (selectedPack?.items?.length) {
    return dedupeMandatoryItems(
      selectedPack.items
        .filter((item) => !isRaftManagedPackArticleName(item.name))
        .map((item) => buildMandatoryItem(item, selectedPack.pack, capacity, 'technical', templateFallbacks))
    );
  }

  const normalizedTemplatePack = normalizarPackType(String(context.packType || ''));
  if (!normalizedTemplatePack) return [] as MandatoryPackItem[];

  const articles = obterArtigosObrigatorios(String(context.packType || ''), capacity || 0);
  const fallbackItems = articles.map((article) => buildMandatoryItem({
    name: article.nome,
    category: article.categoria,
    quantity: article.descricaoQuantidade,
    notes: article.observacoes,
  }, normalizedTemplatePack, capacity, 'template', templateFallbacks));

  return dedupeMandatoryItems(fallbackItems);
}

export function buildMandatoryPackItemsFromCustomArticles(args: {
  packCode: string;
  capacity?: number | null;
  items: CustomMandatoryPackArticleInput[];
}) {
  const capacity = Number(args.capacity || 0);
  return dedupeMandatoryItems(
    (args.items || [])
      .filter((item) => !isRaftManagedPackArticleName(item.name))
      .map((item) =>
      buildMandatoryItem(
        {
          name: item.name,
          quantity: String(Math.max(1, Number(item.quantity || 1))),
          reference: item.reference || undefined,
          category: item.category || undefined,
          notes: item.notes || undefined,
        },
        args.packCode,
        capacity,
        'template'
      )
    )
  );
}

export function buildMandatoryPackRows(items: MandatoryPackItem[]) {
  return items.map((item) => ({
    nome: item.label,
    quantidade: item.quantity,
    embalagens: undefined as number | undefined,
    descricaoQuantidade: item.quantityLabel,
    categoria: item.category,
    observacoes: item.notes,
  }));
}

export function buildMandatoryPackSummary(items: MandatoryPackItem[]) {
  return buildMandatoryPackRows(items).reduce<Record<string, Array<{ nome: string; quantidade: number; embalagens?: number; descricaoQuantidade: string }>>>((acc, row) => {
    if (!acc[row.categoria]) acc[row.categoria] = [];
    acc[row.categoria].push({
      nome: row.nome,
      quantidade: row.quantidade,
      embalagens: row.embalagens,
      descricaoQuantidade: row.descricaoQuantidade,
    });
    return acc;
  }, {});
}

export function buildMandatoryPackRowsFromTechnicalItems(items: RaftTechnicalItem[], capacity = 0) {
  return buildMandatoryPackRows(dedupeMandatoryItems(items.map((item) => buildMandatoryItem(item, '', capacity, 'technical'))));
}

export function buildMandatoryPackSummaryFromTechnicalItems(items: RaftTechnicalItem[], capacity = 0) {
  return buildMandatoryPackSummary(dedupeMandatoryItems(items.map((item) => buildMandatoryItem(item, '', capacity, 'technical'))));
}

export function findMatchingArticleForPackItem(item: MandatoryPackItem, articles: MatchableArticle[]) {
  const refs = new Set(item.stockReferences.map((reference) => normalizeText(reference)));
  const tokens = item.articleTokens.map((token) => normalizeText(token)).filter(Boolean);

  return articles.find((article) => {
    const articleRef = normalizeText(article.referencia);
    if (articleRef && refs.has(articleRef)) return true;

    const articleName = normalizeText(article.name);
    
    // Evitar associar pilhas/baterias ao requisito de Lanterna física
    if (item.checklistName === 'lanterna') {
      const nameLower = articleName.toLowerCase();
      if (nameLower.includes('pilha') || nameLower.includes('bateria') || nameLower.includes('battery') || nameLower.includes('batteries')) {
        return false;
      }
    }

    return tokens.some((token) => articleName.includes(token) || token.includes(articleName));
  }) || null;
}
