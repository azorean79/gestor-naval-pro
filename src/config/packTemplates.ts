/**
 * Configuração de artigos obrigatórios por tipo de pack conforme normas SOLAS e ISO
 * Quantidades baseadas em normativas internacionais para jangadas salva-vidas
 */

export type PackType = 'SOLAS A' | 'SOLAS B' | 'ISO-RAFT' | 'ISO 9650-1' | 'ISO 9650-1 +24h' | 'ISO 9650-1 -24h' | 'ISO 9650-1 Liferaft' | 'ISO 9650-1 Gran flag +24h' | 'ISO 9650-1 ITALY' | 'ISO 9650-1 ITALY Gran bag' | 'ISO 9650-2 COASTAL' | 'ISO 9650 ESP' | 'COASTAL' | 'OFFSHORE' | 'E' | 'R' | 'STD' | 'SIMPLIFICADO MÍNIMO' | 'STD AR' | 'STD GR' | 'STD I' | 'STD UK' | 'STD IT' | 'CRUISER STANDARD' | 'CRUISER ORC' | 'CRUISER ORC+' | 'COASTAL ISO' | 'BICA' | 'TRANSOCEAN ORC' | 'TRANSOCEAN ORC+';

export const PACK_ARTICLE_CATEGORIES = [
  'SINALIZAÇÃO',
  'ILUMINAÇÃO',
  'SOBREVIVÊNCIA',
  'PRIMEIROS SOCORROS',
  'EQUIPAMENTO',
  'CONSUMÍVEIS',
  'CILINDROS',
] as const;

export type PackArticleCategory = (typeof PACK_ARTICLE_CATEGORIES)[number];

export type ArtigoTemplate = {
  nome: string;
  quantidadeBase?: number; // quantidade fixa
  quantidadePorPessoa?: number; // multiplicar pela capacidade
  quantidadePercentual?: number; // percentual da capacidade (ex: 0.1 = 10%)
  minimo?: number; // quantidade mínima
  obrigatorio: boolean;
  categoria: PackArticleCategory;
  observacoes?: string;
  // Para cálculo de embalagens comerciais
  unidadePorEmbalagem?: number; // quantas unidades vêm numa embalagem comercial
  tipoUnidade?: 'unidades' | 'litros' | 'gramas'; // tipo de medida
};

const RAFT_MANAGED_PACK_ARTICLE_NAMES = new Set([
  'INSIDE LIGHT AND BATTERY',
  'TOP LIGHT AND BATTERY',
]);

export function isRaftManagedPackArticleName(value?: string | null) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

  return RAFT_MANAGED_PACK_ARTICLE_NAMES.has(normalized);
}

const TORCH_TEMPLATE: ArtigoTemplate = {
  nome: 'Waterproof Torch',
  quantidadeBase: 1,
  obrigatorio: true,
  categoria: 'ILUMINAÇÃO',
  observacoes: 'Regra operacional: todas as jangadas com pack levam lanterna, exceto jangadas SOS.',
};

const TORCH_BATTERIES_TEMPLATE: ArtigoTemplate = {
  nome: 'Torch Batteries',
  quantidadeBase: 4,
  obrigatorio: true,
  categoria: 'ILUMINAÇÃO',
  observacoes: 'Regra operacional: 4 pilhas por jangada; substituição em todas as inspeções e com validade controlada.',
};

export const PACK_TEMPLATES: Record<PackType, ArtigoTemplate[]> = {
  'SOLAS A': [
    // Sinalização Pirotécnica
    { nome: 'Parachute Rockets', quantidadeBase: 4, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Red Hand Flares', quantidadeBase: 6, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    
    // Iluminação
    { nome: 'Inside Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    { nome: 'Top Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    
    // Primeiros Socorros e Saúde
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: '6 doses por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    
    // Proteção Térmica
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.1, minimo: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA', observacoes: '10% da capacidade, mínimo 2' },
    
    // Consumíveis
    { nome: 'Food Rations', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: 'SOLAS A: 1 embalagem de ração (500g) por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Water', quantidadePorPessoa: 3, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: 'SOLAS A: 3 embalagens de água (0.5L) por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    
    // Equipamento de Sobrevivência
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Heliograph', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'Espelho de sinalização' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    
    // Equipamento Operacional
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drogue', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Âncora flutuante' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Bomba/Fole' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Faca flutuante' },
    { nome: 'Sponges', quantidadeBase: 3, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],
  
  'SOLAS B': [
    // Sinalização Pirotécnica - DIFERENÇA: menos foguetes e sinalizadores
    { nome: 'Parachute Rockets', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'SOLAS B: 2 unidades (vs 4 no SOLAS A)' },
    { nome: 'Red Hand Flares', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'SOLAS B: 3 unidades (vs 6 no SOLAS A)' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'SOLAS B: 1 unidade' },

    // Iluminação e sinalização visual conforme lista operacional fornecida
    { nome: 'Flashlight', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    { nome: 'Flashlight Bulb', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    { nome: 'Extra Batteries', quantidadeBase: 4, obrigatorio: true, categoria: 'ILUMINAÇÃO', observacoes: '4 pilhas suplentes para a lanterna.' },
    { nome: 'Signal Mirror', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Signal Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },

    // Primeiros socorros e saúde
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Anti-seasick Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: '6 comprimidos por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Seasickness Bags', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: '1 saco por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },

    // Proteção térmica
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.1, minimo: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA', observacoes: '10% da capacidade, mínimo 2' },

    // Consumíveis - SOLAS B sem água/rações, mas com copo
    { nome: 'Drinking Cup', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: 'SOLAS B: viagens curtas, sem provisões obrigatórias' },

    // Equipamento de sobrevivência
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },

    // Equipamento operacional
    { nome: 'Rescue Quoit and Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Spare Sea Anchor', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Topping-up Air Pump', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Bomba/fole de enchimento.' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Glue, patches.' },
    { nome: 'Repair Plugs', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Can Openers', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Floating Safety Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],
  
  'ISO-RAFT': [
    // Sinalização Pirotécnica - REDUZIDA (ISO 9650-2)
    { nome: 'Red Hand Flares', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Parachute Rockets', quantidadeBase: 0, obrigatorio: false, categoria: 'SINALIZAÇÃO', observacoes: '2 se capacidade > 12 pessoas' },
    
    // Primeiros Socorros
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },

    // Iluminação operacional
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    
    // Equipamento básico
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponge', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],
  
  'COASTAL': [
    // Pack costeiro Eurovinil / Zodiac Coastal / equivalentes
    { nome: 'Lifebuoy Ring with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Anel de borracha com retenida flutuante de 30m.' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Remos flutuantes.' },
    { nome: 'Tin Openers', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Parachute Rockets', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'Pack COASTAL: 2 paraquedas.' },
    { nome: 'Red Hand Flares', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'Heliograph', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'Espelho de sinalização.' },
    { nome: 'Rescue signal table', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Código de sinais.' },
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Drinking Water', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: 'Pack COASTAL: 1 embalagem de água (0.5L) por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: 'Pack COASTAL: 6 doses por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Seasickness Bags', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: '1 saco por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Bomba/Fole' },
  ],
  
  'OFFSHORE': [
    // Similar ao ISO-RAFT mas com alguns itens adicionais para offshore
    { nome: 'Parachute Rockets', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Red Hand Flares', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.1, minimo: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drogue', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponge', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'E': [
    // Pack E / pesca local-costeira (reintroduzido como pack canónico distinto)
    { nome: 'Top Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'Parachute Rockets', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'Pack E: 2 paraquedas.' },
    { nome: 'Red Hand Flares', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'Pack E: 3 fachos de mão.' },
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: 'Pack E: 6 doses por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Drinking Water', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: 'Pack E: 1 embalagem de água (0.5L) por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Cup', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Bomba/Fole' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Immediate Action', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Rescue signal table', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'R': [
    // Pack reduzido/simplificado para navegação costeira (R / legado ORC)
    { nome: 'Red Hand Flares', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Top Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: '6 doses por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
  ],

  'STD': [
    { nome: 'Lifebuoy Ring with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Tin Openers', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Seasickness Bags', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: '1 saco por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'SIMPLIFICADO MÍNIMO': [
    // Pack mínimo simplificado para navegação de curta distância
    { nome: 'Red Hand Flares', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: '6 doses por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
  ],

  'ISO 9650-1': [
    // Pack ISO 9650-1 (jangadas maiores, offshore)
    { nome: 'Parachute Rockets', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Red Hand Flares', quantidadeBase: 6, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: '6 doses por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.1, minimo: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Seasickness Bags', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: '1 saco por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Heliograph', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drogue', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 3, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'ISO 9650 ESP': [
    // Pack ISO 9650 ESP (Espanha, variante regional)
    { nome: 'Parachute Rockets', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Red Hand Flares', quantidadeBase: 4, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: 'ISO 9650 ESP: 6 comprimidos por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.1, minimo: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Heliograph', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drogue', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'STD AR': [
    // Pack STD AR (Argentina, variante regional)
    { nome: 'Lifebuoy Ring with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Red Hand Flares', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Tin Openers', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 4, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: 'STD AR: 4 comprimidos por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Seasickness Bags', quantidadePorPessoa: 2, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: 'STD AR: 2 sacos por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'STD GR': [
    // Pack STD GR (Grécia, variante regional)
    { nome: 'Lifebuoy Ring with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Red Hand Flares', quantidadeBase: 4, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Tin Openers', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 4, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: 'STD GR: 4 comprimidos por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Seasickness Bags', quantidadePorPessoa: 2, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: 'STD GR: 2 sacos por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'STD I': [
    // Pack STD I (Itália, variante regional)
    { nome: 'Lifebuoy Ring with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Immediate Action', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'STD UK': [
    // Pack STD UK (Reino Unido, variante regional)
    { nome: 'Lifebuoy Ring with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Immediate Action', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'STD IT': [
    // Pack STD IT (Itália padrão, mais amplo)
    { nome: 'Lifebuoy Ring with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Tin Openers', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 4, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: 'STD IT: 4 comprimidos por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Seasickness Bags', quantidadePorPessoa: 2, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: 'STD IT: 2 sacos por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Immediate Action', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'CRUISER STANDARD': [
    // Plastimo Cruiser Standard
    { nome: 'Floating Anchor', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Anel flutuante' },
    { nome: 'Sea Anchor', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Anca flutuante' },
    { nome: 'Thermal Protective Aid', quantidadeBase: 3, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Heeling straps', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Seasickness Pills', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Sea sickness pills glygceran', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: 'Checklis and first instructions manual' },
    { nome: 'Signaling mirror (SOLAS)', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'Com espelho' },
    { nome: 'Parachute rockets (SOLAS)', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Hand flare SOLAS', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Chemical light sticks', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: '500 grs' },
    { nome: 'Retroreflective tape on canopy', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: '300 grs' },
    { nome: 'Waterproof torch and bulks for torch', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
  ],

  'CRUISER ORC': [
    // ORC alinhado com a matriz Eurovinil partilhada pelo utilizador
    { nome: 'Lifebuoy Ring with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Red Hand Flares', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: 'ORC: 6 comprimidos por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],

  'CRUISER ORC+': [
    // Plastimo Cruiser ORC+
    { nome: 'Floating Anchor', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Thermal Protective Aid', quantidadeBase: 3, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Heeling straps', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Seasickness Pills', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Signaling mirror (SOLAS)', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Parachute rockets (SOLAS)', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Hand flare SOLAS', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Waterproof torch', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
  ],

  'COASTAL ISO': [
    // Plastimo Coastal ISO
    { nome: 'Floating Anchor', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Thermal Protective Aid', quantidadeBase: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Paddles', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Heeling straps', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Signaling mirror', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Hand flare', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Waterproof torch', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
  ],

  'BICA': [
    // Plastimo BICA
    { nome: 'Floating Anchor', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Identity number', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Repair kit', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Signaling reflective tapes on canopy', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: '300 grs' },
    { nome: 'Signaling reflective tape on bottom', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: '900 grs' },
    { nome: 'Waterproof torch', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    { nome: 'Signaling mirror', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
  ],

  'TRANSOCEAN ORC': [
    // Plastimo Transocean ORC
    { nome: 'Floating Anchor', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Thermal Protective Aid', quantidadeBase: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Seasickness Pills', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Signaling mirror', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Parachute rockets', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Hand flare', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Waterproof torch', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
  ],

  'TRANSOCEAN ORC+': [
    // Plastimo Transocean ORC+
    { nome: 'Floating Anchor', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Thermal Protective Aid', quantidadeBase: 3, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 3, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Seasickness Pills', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Signaling mirror', quantidadeBase: 6, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Parachute rockets', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Hand flare', quantidadeBase: 6, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Waterproof torch', quantidadeBase: 2, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
  ],
  
  // ISO 9650-1 variantes com duração de 24h+ ou 24h-
  'ISO 9650-1 +24h': [
    { nome: 'Parachute Rockets', quantidadeBase: 4, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Red Hand Flares', quantidadeBase: 6, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Inside Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    { nome: 'Top Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: '6 doses por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.1, minimo: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA', observacoes: '10% da capacidade, mínimo 2' },
    { nome: 'Food Rations', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: 'pack +24h: 1 embalagem de ração por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Water', quantidadePorPessoa: 3, obrigatorio: true, categoria: 'CONSUMÍVEIS', observacoes: 'pack +24h: 3 embalagens de água por pessoa', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Heliograph', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'Espelho de sinalização' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drogue', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Âncora flutuante' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Bomba/Fole' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO', observacoes: 'Faca flutuante' },
    { nome: 'Sponges', quantidadeBase: 3, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],
  
  'ISO 9650-1 -24h': [
    { nome: 'Parachute Rockets', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Red Hand Flares', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Inside Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    { nome: 'Top Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'Seasickness Tablets', quantidadeBase: 12, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: '12 doses para pack <24h', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.05, minimo: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA', observacoes: '5% da capacidade, mínimo 1' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drogue', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 3, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],
  
  'ISO 9650-1 Liferaft': [
    { nome: 'Parachute Rockets', quantidadeBase: 4, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Red Hand Flares', quantidadeBase: 6, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Inside Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    { nome: 'Top Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.1, minimo: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Food Rations', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Water', quantidadePorPessoa: 3, obrigatorio: true, categoria: 'CONSUMÍVEIS', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Heliograph', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drogue', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 3, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],
  
  'ISO 9650-1 Gran flag +24h': [
    { nome: 'Parachute Rockets', quantidadeBase: 4, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'Gran flag variante +24h' },
    { nome: 'Red Hand Flares', quantidadeBase: 6, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Inside Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    { nome: 'Top Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.1, minimo: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Food Rations', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Water', quantidadePorPessoa: 3, obrigatorio: true, categoria: 'CONSUMÍVEIS', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Heliograph', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'Espelho de sinalização' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drogue', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 3, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],
  
  'ISO 9650-1 ITALY': [
    { nome: 'Parachute Rockets', quantidadeBase: 4, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Red Hand Flares', quantidadeBase: 6, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Inside Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    { nome: 'Top Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.1, minimo: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Food Rations', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Water', quantidadePorPessoa: 3, obrigatorio: true, categoria: 'CONSUMÍVEIS', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Heliograph', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drogue', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 3, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],
  
  'ISO 9650-1 ITALY Gran bag': [
    { nome: 'Parachute Rockets', quantidadeBase: 4, obrigatorio: true, categoria: 'SINALIZAÇÃO', observacoes: 'ITALY Gran bag variante' },
    { nome: 'Red Hand Flares', quantidadeBase: 6, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Floating Smoke Signals', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Inside Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    { nome: 'Top Light and Battery', quantidadeBase: 1, obrigatorio: true, categoria: 'ILUMINAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Thermal Protective Aid', quantidadePercentual: 0.1, minimo: 2, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Food Rations', quantidadePorPessoa: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Water', quantidadePorPessoa: 3, obrigatorio: true, categoria: 'CONSUMÍVEIS', unidadePorEmbalagem: 1, tipoUnidade: 'unidades' },
    { nome: 'Drinking Cups', quantidadeBase: 1, obrigatorio: true, categoria: 'CONSUMÍVEIS' },
    { nome: 'Fishing Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'SOBREVIVÊNCIA' },
    { nome: 'Heliograph', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Drogue', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 3, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],
  
  'ISO 9650-2 COASTAL': [
    { nome: 'Parachute Rockets', quantidadeBase: 2, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Red Hand Flares', quantidadeBase: 3, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    TORCH_TEMPLATE,
    TORCH_BATTERIES_TEMPLATE,
    { nome: 'First Aid Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS' },
    { nome: 'Seasickness Tablets', quantidadePorPessoa: 6, obrigatorio: true, categoria: 'PRIMEIROS SOCORROS', observacoes: 'ISO 9650-2: 6 comprimidos por pessoa', unidadePorEmbalagem: 60, tipoUnidade: 'unidades' },
    { nome: 'Whistle', quantidadeBase: 1, obrigatorio: true, categoria: 'SINALIZAÇÃO' },
    { nome: 'Bailer', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sea Anchor with Line', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Paddles', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Bellows', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Repair Kit', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Knife', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Sponges', quantidadeBase: 2, obrigatorio: true, categoria: 'EQUIPAMENTO' },
    { nome: 'Survival Instructions', quantidadeBase: 1, obrigatorio: true, categoria: 'EQUIPAMENTO' },
  ],
};

const NON_SELECTABLE_PACK_TYPES = new Set<PackType>(['BICA']);
const PACK_TYPE_OPTION_SET = new Set<string>(
  Object.keys(PACK_TEMPLATES).filter((packType) => !NON_SELECTABLE_PACK_TYPES.has(packType as PackType))
);

export function isRecognizedPackTypeOption(value?: string | null): boolean {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  if (!raw) return false;
  if (PACK_TYPE_OPTION_SET.has(raw)) return true;
  return normalizarPackType(raw) !== null;
}

export function getRecognizedPackTypeOptions(values: Array<string | null | undefined>): string[] {
  const resolved = new Set<string>();

  for (const value of values) {
    const raw = String(value || '').replace(/\s+/g, ' ').trim();
    if (!raw) continue;

    if (PACK_TYPE_OPTION_SET.has(raw)) {
      resolved.add(raw);
      continue;
    }

    const normalized = normalizarPackType(raw);
    if (normalized && PACK_TYPE_OPTION_SET.has(normalized)) {
      resolved.add(normalized);
    }
  }

  return Array.from(resolved).sort((a, b) => a.localeCompare(b, 'pt-PT'));
}

function isSolasBProvision(artigo: ArtigoTemplate) {
  const nome = artigo.nome.trim().toLowerCase();
  return nome === 'food rations' || nome === 'water' || nome === 'drinking water';
}

/**
 * Calcula a quantidade necessária de um artigo baseado na capacidade da jangada
 */
export function calcularQuantidade(artigo: ArtigoTemplate, capacidade: number): number {
  if (artigo.quantidadeBase !== undefined) {
    return artigo.quantidadeBase;
  }
  
  if (artigo.quantidadePorPessoa !== undefined) {
    return artigo.quantidadePorPessoa * capacidade;
  }
  
  if (artigo.quantidadePercentual !== undefined) {
    const calculado = Math.ceil(artigo.quantidadePercentual * capacidade);
    return artigo.minimo !== undefined ? Math.max(calculado, artigo.minimo) : calculado;
  }
  
  return 1; // default
}

/**
 * Calcula quantas embalagens comerciais são necessárias
 * Exemplos:
 * - 36 comprimidos com embalagens de 60 = 1 embalagem
 * - 9L de água com embalagens de 0.5L = 18 embalagens
 * - 3kg de ração com embalagens de 500g = 6 embalagens
 */
export function calcularEmbalagens(artigo: ArtigoTemplate, capacidade: number): {
  quantidadeTotal: number;
  embalagens: number;
  unidade: string;
} {
  const quantidadeTotal = calcularQuantidade(artigo, capacidade);
  
  // Se não tem embalagem definida, retorna a quantidade total como embalagens
  if (!artigo.unidadePorEmbalagem) {
    return {
      quantidadeTotal,
      embalagens: quantidadeTotal,
      unidade: artigo.tipoUnidade || 'unidades',
    };
  }
  
  // Calcula embalagens necessárias (arredonda para cima)
  const embalagens = Math.ceil(quantidadeTotal / artigo.unidadePorEmbalagem);
  
  return {
    quantidadeTotal,
    embalagens,
    unidade: artigo.tipoUnidade || 'unidades',
  };
}

/**
 * Formata a quantidade para exibição
 * Exemplo: "36 comprimidos (1 embalagem de 60)"
 */
export function formatarQuantidade(artigo: ArtigoTemplate, capacidade: number): string {
  const { quantidadeTotal, embalagens, unidade } = calcularEmbalagens(artigo, capacidade);
  
  if (!artigo.unidadePorEmbalagem) {
    // Sem embalagem definida
    if (artigo.tipoUnidade === 'litros') {
      return `${quantidadeTotal}L`;
    }
    if (artigo.tipoUnidade === 'gramas') {
      return quantidadeTotal >= 1000 ? `${quantidadeTotal / 1000}kg` : `${quantidadeTotal}g`;
    }
    return `${quantidadeTotal} ${unidade}`;
  }
  
  // Com embalagem definida
  let descricaoTotal = '';
  if (artigo.tipoUnidade === 'litros') {
    descricaoTotal = `${quantidadeTotal}L`;
  } else if (artigo.tipoUnidade === 'gramas') {
    descricaoTotal = quantidadeTotal >= 1000 ? `${quantidadeTotal / 1000}kg` : `${quantidadeTotal}g`;
  } else {
    descricaoTotal = `${quantidadeTotal} ${unidade}`;
  }
  
  const descricaoEmbalagem = artigo.tipoUnidade === 'litros' 
    ? `${artigo.unidadePorEmbalagem}L`
    : artigo.tipoUnidade === 'gramas'
      ? `${artigo.unidadePorEmbalagem}g`
      : `${artigo.unidadePorEmbalagem}`;
  
  return `${descricaoTotal} (${embalagens} embalagem${embalagens !== 1 ? 's' : ''} de ${descricaoEmbalagem})`;
}

/**
 * Normaliza o nome do tipo de pack para o padrão usado nos templates
 */
export function normalizarPackType(packType: string): PackType | null {
  const normalized = packType.trim().toUpperCase();
  const compact = normalized.replace(/\s+/g, ' ').trim();
  const compactNoSpaces = compact.replace(/\s+/g, '');
  const isIso9650_1 = compact.includes('ISO 9650-1') || compact.includes('ISO9650-1') || compactNoSpaces.includes('ISO9650-1');
  const isIso9650_2 = compact.includes('ISO 9650-2') || compact.includes('ISO9650-2') || compactNoSpaces.includes('ISO9650-2');

  // Eurovinil M14 específicos (devem vir antes dos mapeamentos genéricos)
  if (compact.includes('ST-GREEK') || compact.includes('STANDARD GREEK')) return null;
  if (
    compact.includes('ST-INTL') ||
    compact.includes('ST-USA') ||
    compact.includes('STANDARD INTERNATIONAL') ||
    compact.includes('STD INT') ||
    compact.includes('STD. INT') ||
    compact.includes('STANDARD INT')
  ) return null;
  if (compact.includes('DM219') || compact.includes('DM-219') || compact.includes('ISO9650 ITA')) return null;
  if (compact.includes('GRAB BAG') && compact.includes('ITA')) return null;

  // Variantes específicas ISO 9650-1 (devem vir antes do mapeamento genérico)
  if (isIso9650_1 && (compact.includes('+24') || compact.includes('>24') || compact.includes('24H+') || compactNoSpaces.includes('+24H') || compactNoSpaces.includes('>24H'))) return 'ISO 9650-1 +24h';
  if (isIso9650_1 && (compact.includes('-24') || compact.includes('<24') || compact.includes('24H-') || compactNoSpaces.includes('-24H') || compactNoSpaces.includes('<24H'))) return 'ISO 9650-1 -24h';
  if (isIso9650_1 && (compact.includes('LIFERAFT') || compact.includes('LIFE RAFT'))) return 'ISO 9650-1 Liferaft';
  if (isIso9650_1 && compact.includes('GRAN FLAG') && (compact.includes('+24') || compact.includes('>24') || compact.includes('24H+') || compactNoSpaces.includes('+24H') || compactNoSpaces.includes('>24H'))) return 'ISO 9650-1 Gran flag +24h';
  if (isIso9650_1 && compact.includes('ITALY') && (compact.includes('GRAN BAG') || compact.includes('GRANBAG'))) return 'ISO 9650-1 ITALY Gran bag';
  if (isIso9650_1 && compact.includes('ITALY')) return 'ISO 9650-1 ITALY';
  if (isIso9650_2 && compact.includes('COASTAL')) return 'ISO 9650-2 COASTAL';

  // Alias frequentes em certificados/manuais ISO 9650 (ex.: Pack 1/Pack 2)
  if (isIso9650_1) return 'ISO 9650-1';
  if (compact.includes('ISO 9650 ESP') || compact.includes('ISO9650ESP') || compact.includes('ISO 9650-ESP')) return 'ISO 9650 ESP';
  if (isIso9650_2) return 'ISO-RAFT';
  if (compact === 'STD AR' || compact.includes('STD AR')) return 'STD AR';
  if (compact === 'STD GR' || compact.includes('STD GR')) return 'STD GR';
  if (compact === 'STD IT' || compact.includes('STD IT')) return 'STD IT';
  if (compact === 'STD UK' || compact.includes('STD UK')) return 'STD UK';
  if (compact === 'STD I' || compact.includes('STD I')) return 'STD I';
  if (compact.includes('<24H') || compact.includes('< 24H') || compact.includes('*- 24H') || compact.includes('-24H') || compactNoSpaces.includes('<24H') || compactNoSpaces.includes('-24H')) return 'COASTAL';
  if (compact.includes('>24H') || compact.includes('> 24H') || compact.includes('24H+') || compactNoSpaces.includes('>24H') || compactNoSpaces.includes('+24H')) return 'OFFSHORE';
  if (compact.includes('PACK 1') || compact.includes('PACK1')) return 'OFFSHORE';
  if (compact.includes('PACK 2') || compact.includes('PACK2')) return 'COASTAL';
  
  if (normalized.includes('SOLAS A') || normalized === 'SOLAS-A') return 'SOLAS A';
  if (normalized.includes('SOLAS B') || normalized === 'SOLAS-B' || normalized === 'SOLAS "B"') return 'SOLAS B';
  if (normalized.includes('ISO') || normalized.includes('ISO-RAFT')) return 'ISO-RAFT';
  if (normalized.includes('COASTAL')) return 'COASTAL';
  if (normalized.includes('OFFSHORE')) return 'OFFSHORE';

  // Plastimo pack types (como tipos independentes, não mapeados a SOLAS/ISO)
  if (compact.includes('CRUISER') && compact.includes('STANDARD')) return 'CRUISER STANDARD';
  if (compact.includes('CRUISER') && compact.includes('ORC') && compact.includes('+')) return 'CRUISER ORC+';
  if (compact.includes('CRUISER') && compact.includes('ORC')) return 'CRUISER ORC';
  if (compact.includes('COASTAL') && compact.includes('ISO')) return 'COASTAL ISO';
  if (compact === 'BICA') return 'BICA';
  if (compact.includes('TRANSOCEAN') && compact.includes('ORC') && compact.includes('+')) return 'TRANSOCEAN ORC+';
  if (compact.includes('TRANSOCEAN') && compact.includes('ORC')) return 'TRANSOCEAN ORC';

  // Alias comuns extraídos de quadros/certificados 2025
  if (compact === 'STD' || compact === 'STANDARD') return 'STD';
  if (compact === 'E' || compact === 'PACK E') return 'E';
  if (compact === 'R') return 'R';
  
  // Pack Simplificado Mínimo (deve vir antes do R genérico)
  if (normalized.includes('MIN') && (normalized.includes('SIMPL') || normalized.includes('REDUZ'))) return 'SIMPLIFICADO MÍNIMO';
  if (normalized.match(/^MIN(IMO)?$/)) return 'SIMPLIFICADO MÍNIMO';
  if (compact === 'NIN') return 'SIMPLIFICADO MÍNIMO'; // OCR/erro comum para MIN
  
  // Pack E / reduzido / pesca local-costeira
  if (normalized.includes('ORC+')) return 'OFFSHORE';
  if (normalized.includes('ORC')) return 'COASTAL';
  if (normalized.includes('PACK E')) return 'E';
  if (normalized.includes('REDUZ')) return 'E';
  if (normalized.includes('SIMPL')) return 'R';
  if (compact === 'SIM' || compact === 'SIMP' || compact === 'SIMP.' || compact === 'SIMPL') return 'R';
  
  // Tenta inferir pelo nome
  if (normalized.includes('SOLAS') && !normalized.includes('A') && !normalized.includes('B')) {
    return 'SOLAS B'; // default SOLAS
  }
  
  return null;
}

/**
 * Obtém a lista de artigos obrigatórios para um tipo de pack e capacidade (sem duplicatas)
 */
export function obterArtigosObrigatorios(packType: string, capacidade: number): Array<{ 
  nome: string; 
  quantidade: number;
  embalagens?: number;
  descricaoQuantidade: string;
  categoria: string; 
  observacoes?: string;
}> {
  const tipo = normalizarPackType(packType);
  if (!tipo) return [];
  
  const template = PACK_TEMPLATES[tipo];
  if (!template) return [];

  const templateFiltrado = tipo === 'SOLAS B'
    ? template.filter((artigo) => !isSolasBProvision(artigo))
    : template;
  
  // Remove duplicatas mantendo a primeira ocorrência
  const artigosUnicos = Array.from(
    new Map(templateFiltrado.map(a => [a.nome.toLowerCase(), a])).values()
  );
  
  return artigosUnicos
    .filter(artigo => artigo.obrigatorio && !isRaftManagedPackArticleName(artigo.nome))
    .map(artigo => {
      const { quantidadeTotal, embalagens } = calcularEmbalagens(artigo, capacidade);
      
      return {
        nome: artigo.nome,
        quantidade: quantidadeTotal,
        embalagens: artigo.unidadePorEmbalagem ? embalagens : undefined,
        descricaoQuantidade: formatarQuantidade(artigo, capacidade),
        categoria: artigo.categoria,
        observacoes: artigo.observacoes,
      };
    });
}

/**
 * Valida se uma jangada tem todos os artigos obrigatórios
 */
export function validarConformidade(
  packType: string,
  capacidade: number,
  artigosAtuais: Array<{ name: string; quantidade?: number }>
): {
  conforme: boolean;
  faltantes: Array<{ nome: string; quantidadeEsperada: number }>;
  excesso: Array<{ nome: string; quantidadeAtual: number; quantidadeEsperada: number }>;
} {
  const obrigatorios = obterArtigosObrigatorios(packType, capacidade);
  const faltantes: Array<{ nome: string; quantidadeEsperada: number }> = [];
  const excesso: Array<{ nome: string; quantidadeAtual: number; quantidadeEsperada: number }> = [];
  
  // Normaliza nomes para comparação
  const normalizar = (nome: string) => nome.toLowerCase().trim().replace(/\s+/g, ' ');
  
  obrigatorios.forEach(obrigatorio => {
    const nomeNormalizado = normalizar(obrigatorio.nome);
    const encontrado = artigosAtuais.find(atual => 
      normalizar(atual.name).includes(nomeNormalizado) || 
      nomeNormalizado.includes(normalizar(atual.name))
    );
    
    if (!encontrado) {
      faltantes.push({
        nome: obrigatorio.nome,
        quantidadeEsperada: obrigatorio.quantidade,
      });
    } else if (encontrado.quantidade !== undefined && encontrado.quantidade < obrigatorio.quantidade) {
      excesso.push({
        nome: obrigatorio.nome,
        quantidadeAtual: encontrado.quantidade,
        quantidadeEsperada: obrigatorio.quantidade,
      });
    }
  });
  
  return {
    conforme: faltantes.length === 0 && excesso.length === 0,
    faltantes,
    excesso,
  };
}

/**
 * Gera um resumo dos artigos por categoria
 */
export function resumoPorCategoria(packType: string, capacidade: number) {
  const artigos = obterArtigosObrigatorios(packType, capacidade);
  const porCategoria: Record<string, Array<{ nome: string; quantidade: number; embalagens?: number; descricaoQuantidade: string }>> = {};
  
  artigos.forEach(artigo => {
    if (!porCategoria[artigo.categoria]) {
      porCategoria[artigo.categoria] = [];
    }
    porCategoria[artigo.categoria].push({
      nome: artigo.nome,
      quantidade: artigo.quantidade,
      embalagens: artigo.embalagens,
      descricaoQuantidade: artigo.descricaoQuantidade,
    });
  });
  
  return porCategoria;
}
