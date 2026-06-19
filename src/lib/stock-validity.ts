import { normalizeLooseText } from "@/lib/text-normalization";
import { normalizeStockCategory } from "@/lib/stock-categories";

const NON_EXPIRING_KEYWORDS = [
  'paddles',
  'padles',
  'paddle',
  'oars',
  'oar',
  'remos',
  'remo',
  'pagaias',
  'pagaia',
  'bellows',
  'fole',
  'batedouro',
  'sponges',
  'sponge',
  'esponjas',
  'esponja',
  'bailer',
  'balde',
  'drinking cup',
  'graduated cup',
  'cup',
  'copo',
  'copo graduado',
  'waterproof torch',
  'torch',
  'lanterna impermeavel',
  'lanterna impermeável',
  'immediate action instructions',
  'survival instructions',
  'instrucoes de acao imediata',
  'instrucoes de sobrevivencia',
  'manual sobrevivencia',
  'reflective tape',
  'fita refletora',
  'fita reflectora',
  'grab handles',
  'grab handle',
  'pegas',
  'pega',
  'painter line',
  'painter',
  'retenida',
  'floating knife',
  'safety knife',
  'faca flutuante',
  'faca de seguranca',
  'thermal protective aid',
  'thermal protection aid',
  'ajudas termicas',
  'ajudas térmicas',
  'fishing kit',
  'estojo de pesca',
  'kit de pesca',
  'rescue signal table',
  'rescue signal card',
  'quadro de sinais',
  'sea anchor',
  'sea anchor with line',
  'drogue',
  'ancora flutuante',
  'ancora flutuante com linha',
  'âncora flutuante com linha',
];

// Categorias que têm validade aplicável
const CATEGORIES_WITH_VALIDITY = [
  'PRIMEIROS SOCORROS',    // farmácias, comprimidos
  'CONSUMÍVEIS',            // águas, rações, baterias
  'PIROTÉCNICOS',           // pirotecnicos
  'CILINDROS',              // cilindros com testes hidráulicos
];

function normalizeText(value: unknown) {
  return normalizeLooseText(value ?? '');
}

export function stockItemSupportsValidity(input: {
  nome?: unknown;
  descricao?: unknown;
  categoria?: unknown;
  codigoFabricante?: unknown;
  referencia?: unknown;
  observacoes?: unknown;
}) {
  const haystack = normalizeText([
    input?.nome,
    input?.descricao,
    input?.codigoFabricante,
    input?.referencia,
    input?.observacoes,
  ].filter(Boolean).join(' '));

  // Se tem palavras de não-expiração, retorna false
  if (NON_EXPIRING_KEYWORDS.some((keyword) => haystack.includes(normalizeText(keyword)))) {
    return false;
  }

  // Verifica se a categoria é uma que suporta validade
  const normalizedCategory = normalizeStockCategory(input?.categoria, input?.descricao);
  return CATEGORIES_WITH_VALIDITY.includes(normalizedCategory);
}

export function normalizeStockValidityValue(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const mmYyyy = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyy) {
    const month = Number(mmYyyy[1]);
    const year = Number(mmYyyy[2]);
    if (month >= 1 && month <= 12) return `${String(month).padStart(2, '0')}/${year}`;
  }

  const yyyyMm = raw.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (yyyyMm) {
    const year = Number(yyyyMm[1]);
    const month = Number(yyyyMm[2]);
    if (month >= 1 && month <= 12) return `${String(month).padStart(2, '0')}/${year}`;
  }

  const ddMmYyyy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddMmYyyy) {
    const month = Number(ddMmYyyy[2]);
    const year = Number(ddMmYyyy[3]);
    if (month >= 1 && month <= 12) return `${String(month).padStart(2, '0')}/${year}`;
  }

  return null;
}
