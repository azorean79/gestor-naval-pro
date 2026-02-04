// Constantes para opções de jangadas
export const MARCAS_JANGADA = [
  'Viking Life-Saving Equipment',
  'Survitec',
  'RFD',
  'Zodiac',
  'Avon',
  'Bombard',
  'Seago',
  'Winslow',
  'Lilley & Gillie',
  'DSB',
  'LALIZAS',
  'PLASTIMO',
  'Sea-Safe',
  'Eurovinil',
  'CREWAVER',
  'Switlik',
  'OCEAN SAFETY',
  'ARIMAR',
  'ALMAR',
  'Julio Correa',
  'Outros'
] as const;

// Sistemas de insuflação disponíveis para jangadas
// Modelos específicos da marca Zodiac
export const MODELOS_ZODIAC = [
  'Zodiac COASTER 4 Person',
  'Zodiac COASTER 6 Person',
  'Zodiac COASTER 8 Person',
  'Zodiac PROPECHE CLV 6 Person',
  'Zodiac PROPECHE CLVI 6 Person',
  'Zodiac MOR 10 Person',
  'Zodiac TO 6 Person',
  'Zodiac TO 8 Person',
  'Zodiac TO 10 Person',
  'Zodiac TO 12 Person',
  'Zodiac TO 16 Person',
  'Zodiac TO 20 Person',
  'Zodiac TO 25 Person',
  'Zodiac TO SR 6 Person',
  'Zodiac TO SR 8 Person',
  'Zodiac TO SR 10 Person',
  'Zodiac TO SR 12 Person',
  'Zodiac TO SR 25 Person',
  'Zodiac TO SR 37 Person',
  'Zodiac TO SR 50 Person',
  'Zodiac TO SR 100 Person',
  'Zodiac TO SR 150 Person',
  'Zodiac ZODIAC MKIV 6 Person',
  'Zodiac ZODIAC MKIV 8 Person',
  'Zodiac ZODIAC MKIV 10 Person',
  'Zodiac ZODIAC MKIV 12 Person',
  'Zodiac ZODIAC MKIV 15 Person',
  'Zodiac ZODIAC MKIV 20 Person',
  'Zodiac ZODIAC MKIV 25 Person'
] as const;

export const SISTEMAS_INSUFACAO = [
  'THANNER',
  'LEAFIELD',
  'VTE99',
  'HSR-OH-III',
  'NSS',
  'Outro'
] as const;

// Tipos de válvulas disponíveis por sistema de insuflação
export const TIPOS_VALVULAS_POR_SISTEMA: Record<string, string[]> = {
  'LEAFIELD': [
    'A10',
    'A6',
    'A5',
    'A7',
    'B10',
    'C7',
    'D7'
  ],
  'THANNER': [
    'OTS65'
  ],
  'EUROVINIL': [
    'Supernova',
    'BRAVO 2005'
  ],
  'LALIZAS': [
    'AQF-5-100',
    '71891'
  ],
  'Outro': [
    'Personalizado'
  ]
};

// Lista consolidada de todos os tipos de válvulas disponíveis
export const TODOS_TIPOS_VALVULAS = [
  'A10',
  'A6',
  'A5',
  'A7',
  'B10',
  'C7',
  'D7',
  'OTS65',
  'Supernova',
  'BRAVO 2005',
  'AQF-5-100',
  '71891',
  'Personalizado'
] as const;

// Mapeamento de sistemas padrão por modelo (para sugestão automática)
export const SISTEMAS_PADRAO_POR_MODELO: Record<string, string> = {
  // ZODIAC - THANNER (TO, TO SR)
  'Zodiac TO 6 Person': 'THANNER',
  'Zodiac TO 8 Person': 'THANNER',
  'Zodiac TO 10 Person': 'THANNER',
  'Zodiac TO 12 Person': 'THANNER',
  'Zodiac TO 15 Person': 'THANNER',
  'Zodiac TO 20 Person': 'THANNER',
  'Zodiac TO 25 Person': 'THANNER',
  'Zodiac TO SR 6 Person': 'THANNER',
  'Zodiac TO SR 8 Person': 'THANNER',
  'Zodiac TO SR 10 Person': 'THANNER',
  'Zodiac TO SR 12 Person': 'THANNER',
  'Zodiac TO SR 25 Person': 'THANNER',
  'Zodiac TO SR 37 Person': 'THANNER',
  'Zodiac TO SR 50 Person': 'THANNER',
  'Zodiac TO SR 100 Person': 'THANNER',
  'Zodiac TO SR 150 Person': 'THANNER',

  // ZODIAC - LEAFIELD (MKIV)
  'Zodiac ZODIAC MKIV 6 Person': 'LEAFIELD',
  'Zodiac ZODIAC MKIV 8 Person': 'LEAFIELD',
  'Zodiac ZODIAC MKIV 10 Person': 'LEAFIELD',
  'Zodiac ZODIAC MKIV 12 Person': 'LEAFIELD',
  'Zodiac ZODIAC MKIV 15 Person': 'LEAFIELD',
  'Zodiac ZODIAC MKIV 20 Person': 'LEAFIELD',
  'Zodiac ZODIAC MKIV 25 Person': 'LEAFIELD',

  // RFD - THANNER (Seasava Plus, Surviva MKIII, Ferryman)
  'RFD Seasava Plus': 'THANNER',
  'RFD SEASAVA PLUS 6 Person': 'THANNER',
  'RFD SEASAVA PLUS 8 Person': 'THANNER',
  'RFD SEASAVA PLUS 10 Person': 'THANNER',
  'RFD SEASAVA PLUS 12 Person': 'THANNER',
  'RFD SEASAVA PLUS 15 Person': 'THANNER',
  'RFD SEASAVA PLUS 20 Person': 'THANNER',
  'RFD SEASAVA PLUS 25 Person': 'THANNER',
  'RFD SURVIVA MKIII 6 Person': 'THANNER',
  'RFD SURVIVA MKIII 8 Person': 'THANNER',
  'RFD SURVIVA MKIII 10 Person': 'THANNER',
  'RFD SURVIVA MKIII 12 Person': 'THANNER',
  'RFD SURVIVA MKIII 15 Person': 'THANNER',
  'RFD SURVIVA MKIII 20 Person': 'THANNER',
  'RFD SURVIVA MKIII 25 Person': 'THANNER',
  'RFD FERRYMAN 6 Person': 'THANNER',
  'RFD FERRYMAN 8 Person': 'THANNER',
  'RFD FERRYMAN 10 Person': 'THANNER',
  'RFD FERRYMAN 12 Person': 'THANNER',

  // RFD - LEAFIELD (Seasava Pro-ISO, Surviva MKIV TO)
  'RFD SEASAVA PRO-ISO 4 Person': 'LEAFIELD',
  'RFD SEASAVA PRO-ISO 6 Person': 'LEAFIELD',
  'RFD SEASAVA PRO-ISO 8 Person': 'LEAFIELD',
  'RFD SEASAVA PRO-ISO 10 Person': 'LEAFIELD',
  'RFD SEASAVA PRO-ISO 12 Person': 'LEAFIELD',
  'RFD SURVIVA MKIV TO 6 Person': 'LEAFIELD',
  'RFD SURVIVA MKIV TO 8 Person': 'LEAFIELD',
  'RFD SURVIVA MKIV TO 10 Person': 'LEAFIELD',
  'RFD SURVIVA MKIV TO 12 Person': 'LEAFIELD',
  'RFD SURVIVA MKIV TO 15 Person': 'LEAFIELD',
  'RFD SURVIVA MKIV TO 20 Person': 'LEAFIELD',
  'RFD SURVIVA MKIV TO 25 Person': 'LEAFIELD',

  // RFD - VTE99 (Surviva MKII)
  'RFD SURVIVA MKII 4 Person': 'VTE99',
  'RFD SURVIVA MKII 6 Person': 'VTE99',
  'RFD SURVIVA MKII 8 Person': 'VTE99',
  'RFD SURVIVA MKII 10 Person': 'VTE99',
  'RFD SURVIVA MKII 12 Person': 'VTE99',
  'RFD SURVIVA MKII 16 Person': 'VTE99',

  // DSB - THANNER (LR97)
  'DSB LR97': 'THANNER',

  // DSB - LEAFIELD (LR07)
  'DSB LR07': 'LEAFIELD',

  // LALIZAS - HSR-OH-III (ISO-RAFT)
  'LALIZAS ISO-RAFT 4 Person': 'HSR-OH-III',
  'LALIZAS ISO-RAFT 6 Person': 'HSR-OH-III',
  'LALIZAS ISO-RAFT 8 Person': 'HSR-OH-III',
  'LALIZAS ISO-RAFT 10 Person': 'HSR-OH-III',
  'LALIZAS ISO-RAFT 12 Person': 'HSR-OH-III',

  // Sea-Safe - NSS (Pro-light)
  'Sea-Safe Pro-Light 4 Person': 'NSS',
  'Sea-Safe Pro-Light 6 Person': 'NSS',
  'Sea-Safe Pro-Light 8 Person': 'NSS',
  'Sea-Safe Pro-Light 10 Person': 'NSS',
  'Sea-Safe Pro-Light 12 Person': 'NSS',
  'Sea-Safe ISO 9650-1 4 Person': 'NSS',
  'Sea-Safe ISO 9650-1 6 Person': 'NSS',
  'Sea-Safe ISO 9650-1 8 Person': 'NSS',
  'Sea-Safe ISO 9650-1 10 Person': 'NSS',
  'Sea-Safe ISO 9650-1 12 Person': 'NSS'
};

// Função para obter sistema de insuflação padrão para um modelo
export function getSistemaInflacaoPadrao(modelo: string): string {
  // Tenta encontrar correspondência exata
  if (SISTEMAS_PADRAO_POR_MODELO[modelo]) {
    return SISTEMAS_PADRAO_POR_MODELO[modelo];
  }

  // Tenta encontrar correspondência parcial (ex: "Zodiac TO 6" -> "Zodiac TO")
  for (const [padrao, sistema] of Object.entries(SISTEMAS_PADRAO_POR_MODELO)) {
    if (modelo.includes(padrao)) {
      return sistema;
    }
  }

  // Fallback padrão
  return 'THANNER';
}

// Função para obter todos os sistemas disponíveis
export function getSistemasInflacaoDisponiveis(): string[] {
  return [...SISTEMAS_INSUFACAO];
}

// Função para obter todos os packs disponíveis (flexibilidade total)
export function getPacksDisponiveis(): string[] {
  return [...TIPOS_PACK];
}

// Função para obter pack padrão para um modelo (sugestão baseada em especificações)
export function getPackPadraoPorModelo(modelo: string): string {
  // Mapeamento de packs padrão por modelo baseado em especificações técnicas
  const PACKS_PADRAO_POR_MODELO: Record<string, string> = {
    // Modelos que tipicamente vêm com Pack Coastal/E
    'RFD Seasava Plus': 'Pack Coastal/E',
    'RFD SEASAVA PLUS 6 Person': 'Pack Coastal/E',
    'RFD SEASAVA PLUS 8 Person': 'Pack Coastal/E',
    'RFD SEASAVA PLUS 10 Person': 'Pack Coastal/E',
    'RFD SEASAVA PLUS 12 Person': 'Pack Coastal/E',
    'RFD SEASAVA PLUS 15 Person': 'Pack Coastal/E',
    'RFD SEASAVA PLUS 20 Person': 'Pack Coastal/E',
    'RFD SEASAVA PLUS 25 Person': 'Pack Coastal/E',

    // Modelos que tipicamente vêm com Pack SOLAS A
    'Viking RescYou': 'Pack SOLAS A',
    'Viking 6 Person': 'Pack SOLAS A',
    'Viking 8 Person': 'Pack SOLAS A',
    'Viking 10 Person': 'Pack SOLAS A',
    'Viking 12 Person': 'Pack SOLAS A',
    'Viking 15 Person': 'Pack SOLAS A',
    'Viking 20 Person': 'Pack SOLAS A',
    'Viking 25 Person': 'Pack SOLAS A',

    // Modelos que tipicamente vêm com Pack SOLAS B
    'Survitec 6 Person': 'Pack SOLAS B',
    'Survitec 8 Person': 'Pack SOLAS B',
    'Survitec 10 Person': 'Pack SOLAS B',
    'Survitec 12 Person': 'Pack SOLAS B',
    'Survitec 15 Person': 'Pack SOLAS B',
    'Survitec 20 Person': 'Pack SOLAS B',
    'Survitec 25 Person': 'Pack SOLAS B',

    // Modelos que tipicamente vêm com Pack ISO 9650-1 (>24h)
    'Eurovinil ISO 9650 4 Person': 'Pack ISO 9650-1 (>24h)',
    'Eurovinil ISO 9650 6 Person': 'Pack ISO 9650-1 (>24h)',
    'Eurovinil ISO 9650 8 Person': 'Pack ISO 9650-1 (>24h)',
    'Eurovinil ISO 9650 10 Person': 'Pack ISO 9650-1 (>24h)',
    'Eurovinil ISO 9650 12 Person': 'Pack ISO 9650-1 (>24h)',

    // Modelos que tipicamente vêm com Pack ORC
    'Zodiac TO SR 100 Person': 'Pack ORC',
    'Zodiac TO SR 150 Person': 'Pack ORC'
  };

  // Tenta encontrar correspondência exata
  if (PACKS_PADRAO_POR_MODELO[modelo]) {
    return PACKS_PADRAO_POR_MODELO[modelo];
  }

  // Tenta encontrar correspondência parcial
  for (const [padrao, pack] of Object.entries(PACKS_PADRAO_POR_MODELO)) {
    if (modelo.includes(padrao)) {
      return pack;
    }
  }

  // Fallback baseado no tipo de modelo
  if (modelo.includes('SOLAS')) {
    return 'Pack SOLAS A';
  }
  if (modelo.includes('ISO')) {
    return 'Pack ISO 9650-1 (>24h)';
  }
  if (modelo.includes('Coastal') || modelo.includes('E')) {
    return 'Pack Coastal/E';
  }

  // Fallback padrão
  return 'Pack SOLAS A';
}

export const MODELOS_JANGADA = [
  'Viking RescYou',
  'Viking 6 Person',
  'Viking 8 Person',
  'Viking 10 Person',
  'Viking 12 Person',
  'Viking 15 Person',
  'Viking 20 Person',
  'Viking 25 Person',
  'Survitec 6 Person',
  'Survitec 8 Person',
  'Survitec 10 Person',
  'Survitec 12 Person',
  'Survitec 15 Person',
  'Survitec 20 Person',
  'Survitec 25 Person',
  'Survitec MKIII',
  'Survitec MKIV',
  'RFD 6 Person',
  'RFD 8 Person',
  'RFD 10 Person',
  'RFD 12 Person',
  'RFD 15 Person',
  'RFD 20 Person',
  'RFD 25 Person',
  'RFD Seasava Plus',
  'Zodiac 6 Person',
  'Zodiac 8 Person',
  'Zodiac 10 Person',
  'Zodiac 12 Person',
  'Zodiac 15 Person',
  'Zodiac 20 Person',
  'Zodiac 25 Person',
  'Avon 6 Person',
  'Avon 8 Person',
  'Avon 10 Person',
  'Avon 12 Person',
  'Avon 15 Person',
  'Avon 20 Person',
  'Avon 25 Person',
  'Bombard 6 Person',
  'Bombard 8 Person',
  'Bombard 10 Person',
  'Bombard 12 Person',
  'Bombard 15 Person',
  'Bombard 20 Person',
  'Bombard 25 Person',
  'Seago 6 Person',
  'Seago 8 Person',
  'Seago 10 Person',
  'Seago 12 Person',
  'Seago 15 Person',
  'Seago 20 Person',
  'Seago 25 Person',
  'Winslow 6 Person',
  'Winslow 8 Person',
  'Winslow 10 Person',
  'Winslow 12 Person',
  'Winslow 15 Person',
  'Winslow 20 Person',
  'Winslow 25 Person',
  'Lilley & Gillie 6 Person',
  'Lilley & Gillie 8 Person',
  'Lilley & Gillie 10 Person',
  'Lilley & Gillie 12 Person',
  'Lilley & Gillie 15 Person',
  'Lilley & Gillie 20 Person',
  'Lilley & Gillie 25 Person',
  'DSB 6 Person',
  'DSB 8 Person',
  'DSB 10 Person',
  'DSB 12 Person',
  'DSB 15 Person',
  'DSB 20 Person',
  'DSB 25 Person',
  'DSB LR97',
  'DSB LR07',
  // LALIZAS
  'LALIZAS ISO-RAFT 4 Person',
  'LALIZAS ISO-RAFT 6 Person',
  'LALIZAS ISO-RAFT 8 Person',
  'LALIZAS ISO-RAFT 10 Person',
  'LALIZAS ISO-RAFT 12 Person',
  // PLASTIMO
  'PLASTIMO Cruiser 4 Person',
  'PLASTIMO Cruiser 6 Person',
  'PLASTIMO Cruiser 8 Person',
  'PLASTIMO Transocean ISO 9650-1 4 Person',
  'PLASTIMO Transocean ISO 9650-1 6 Person',
  'PLASTIMO Transocean ISO 9650-1 8 Person',
  'PLASTIMO Transocean ISO 9650-1 10 Person',
  'PLASTIMO Transocean ISO 9650-1 12 Person',
  'PLASTIMO Offshore 4 Person',
  'PLASTIMO Offshore 6 Person',
  'PLASTIMO Offshore 8 Person',
  'PLASTIMO Offshore 10 Person',
  'PLASTIMO Offshore 12 Person',
  // Sea-Safe
  'Sea-Safe Pro-Light 4 Person',
  'Sea-Safe Pro-Light 6 Person',
  'Sea-Safe Pro-Light 8 Person',
  'Sea-Safe Pro-Light 10 Person',
  'Sea-Safe Pro-Light 12 Person',
  'Sea-Safe ISO 9650-1 4 Person',
  'Sea-Safe ISO 9650-1 6 Person',
  'Sea-Safe ISO 9650-1 8 Person',
  'Sea-Safe ISO 9650-1 10 Person',
  'Sea-Safe ISO 9650-1 12 Person',
  // Eurovinil
  'Eurovinil Leisure Syntesy 4 Person',
  'Eurovinil Leisure Syntesy 6 Person',
  'Eurovinil Leisure Syntesy 8 Person',
  'Eurovinil Leisure Syntesy 10 Person',
  'Eurovinil Leisure Syntesy 12 Person',
  'Eurovinil ISO 9650 4 Person',
  'Eurovinil ISO 9650 6 Person',
  'Eurovinil ISO 9650 8 Person',
  'Eurovinil ISO 9650 10 Person',
  'Eurovinil ISO 9650 12 Person',
  'Eurovinil STANDARD 4 Person',
  'Eurovinil STANDARD 6 Person',
  'Eurovinil STANDARD 8 Person',
  'Eurovinil STANDARD 10 Person',
  'Eurovinil STANDARD 12 Person',
  'Eurovinil SOLAS 4 Person',
  'Eurovinil SOLAS 6 Person',
  'Eurovinil SOLAS 8 Person',
  'Eurovinil SOLAS 10 Person',
  'Eurovinil SOLAS 12 Person',
  // ZODIAC - Modelos específicos
  'Zodiac COASTER 4 Person',
  'Zodiac COASTER 6 Person',
  'Zodiac COASTER 8 Person',
  'Zodiac PROPECHE CLV 6 Person',
  'Zodiac PROPECHE CLVI 6 Person',
  'Zodiac MOR 10 Person',
  'Zodiac TO 6 Person',
  'Zodiac TO 8 Person',
  'Zodiac TO 10 Person',
  'Zodiac TO 12 Person',
  'Zodiac TO 16 Person',
  'Zodiac TO 20 Person',
  'Zodiac TO 25 Person',
  'Zodiac TO SR 6 Person',
  'Zodiac TO SR 8 Person',
  'Zodiac TO SR 10 Person',
  'Zodiac TO SR 12 Person',
  'Zodiac TO SR 25 Person',
  'Zodiac TO SR 37 Person',
  'Zodiac TO SR 50 Person',
  'Zodiac TO SR 100 Person',
  'Zodiac TO SR 150 Person',
  'Zodiac ZODIAC MKIV 6 Person',
  'Zodiac ZODIAC MKIV 8 Person',
  'Zodiac ZODIAC MKIV 10 Person',
  'Zodiac ZODIAC MKIV 12 Person',
  'Zodiac ZODIAC MKIV 15 Person',
  'Zodiac ZODIAC MKIV 20 Person',
  'Zodiac ZODIAC MKIV 25 Person',
  // RFD - Modelos específicos
  'RFD SEASAVA PLUS 6 Person',
  'RFD SEASAVA PLUS 8 Person',
  'RFD SEASAVA PLUS 10 Person',
  'RFD SEASAVA PLUS 12 Person',
  'RFD SEASAVA PLUS 15 Person',
  'RFD SEASAVA PLUS 20 Person',
  'RFD SEASAVA PLUS 25 Person',
  'RFD SEASAVA PRO-ISO 4 Person',
  'RFD SEASAVA PRO-ISO 6 Person',
  'RFD SEASAVA PRO-ISO 8 Person',
  'RFD SEASAVA PRO-ISO 10 Person',
  'RFD SEASAVA PRO-ISO 12 Person',
  'RFD SURVIVA MKII 4 Person',
  'RFD SURVIVA MKII 6 Person',
  'RFD SURVIVA MKII 8 Person',
  'RFD SURVIVA MKII 10 Person',
  'RFD SURVIVA MKII 12 Person',
  'RFD SURVIVA MKII 16 Person',
  'RFD SURVIVA MKIII 6 Person',
  'RFD SURVIVA MKIII 8 Person',
  'RFD SURVIVA MKIII 10 Person',
  'RFD SURVIVA MKIII 12 Person',
  'RFD SURVIVA MKIII 15 Person',
  'RFD SURVIVA MKIII 20 Person',
  'RFD SURVIVA MKIII 25 Person',
  'RFD SURVIVA MKIV TO 6 Person',
  'RFD SURVIVA MKIV TO 8 Person',
  'RFD SURVIVA MKIV TO 10 Person',
  'RFD SURVIVA MKIV TO 12 Person',
  'RFD SURVIVA MKIV TO 15 Person',
  'RFD SURVIVA MKIV TO 20 Person',
  'RFD SURVIVA MKIV TO 25 Person',
  'RFD FERRYMAN 6 Person',
  'RFD FERRYMAN 8 Person',
  'RFD FERRYMAN 10 Person',
  'RFD FERRYMAN 12 Person',
  'Outro'
] as const;

export const TIPOS_PACK = [
  'Pack SOLAS A',
  'Pack SOLAS B',
  'Pack ISO 9650-1 (>24h)',
  'Pack ISO 9650-1 (<24h)',
  'Pack Coastal/E',
  'Pack ORC',
  'Simplificado Reduzido',
  'Simplificado Minimo',
  'Pack Customizado',
  'Outro'
] as const;

export const COMPONENTES_JANGADA = [
  'Balsa Inflável',
  'Coletes Salva-Vidas',
  'Kit de Primeiros Socorros',
  'Kit de Sobrevivência (Água, Comida, etc.)',
  'Rádio VHF',
  'EPIRB (Emergency Position Indicating Radio Beacon)',
  'Sinalizadores (Foguetes, Luzes)',
  'Lanterna com Pilhas',
  'Bússola',
  'Mapa Náutico',
  'Remos',
  'Âncora Flutuante',
  'Cobertura Térmica',
  'Sistema de Desalinizador de Água',
  'Ração de Emergência',
  'Medicamentos',
  'Equipamento de Pescaria',
  'Kit de Reparo',
  'Documento de Instruções',
  'Outro'
] as const;

export const COMPONENTES_PACK = [
  'Equipamento Básico (Balsa + Coletes)',
  'Kit de Sobrevivência Completo',
  'Equipamento de Comunicação (Rádio + EPIRB)',
  'Sinalizadores e Luzes',
  'Kit Médico',
  'Equipamento de Navegação',
  'Ração e Água',
  'Ferramentas de Reparo',
  'Cobertura e Isolamento Térmico',
  'Sistema de Desalinizador',
  'Equipamento de Pescaria',
  'Documentação e Instruções',
  'Outro'
] as const;

// Componentes detalhados por tipo de pack baseado em normas SOLAS e ISO
// 
// CLASSIFICAÇÃO DOS PACKS POR NÍVEL DE EQUIPAMENTO:
// 
// PACKS COMPLETOS (Longa duração - >24h):
// - Pack SOLAS A: Equipamento completo para navegação oceânica
// - Pack ISO 9650-1 (>24h): Equivalente ao SOLAS A para recreio
//
// PACKS REDUZIDOS (Curta duração - <24h):
// - Pack SOLAS B: Equipamento reduzido para navegação costeira
// - Pack ISO 9650-1 (<24h): Equivalente ao SOLAS B para recreio
//
// PACKS SIMPLIFICADOS (Mínimo legal):
// - Pack Coastal/E: Simplificado mínimo (apenas itens essenciais por lei)
// - Pack ORC: Simplificado reduzido (itens básicos + água e primeiros socorros)
// - Simplificado Reduzido: Equivalente ao Pack ORC
// - Simplificado Minimo: Equivalente ao Pack Coastal/E
//
export const COMPONENTES_POR_PACK: Record<string, Array<{
  nome: string;
  quantidade: string;
  validade?: string;
}>> = {
  'Pack SOLAS A': [
    { nome: 'Rações de Emergência', quantidade: '10,000 kJ (aprox. 2400 kcal) por pessoa', validade: '5 anos (conforme fabricante e normas SOLAS)' },
    { nome: 'Água Potável', quantidade: '1.5 litros por pessoa', validade: '6 anos (embalagem estéril, conforme SOLAS)' },
    { nome: 'Kit de Primeiros Socorros', quantidade: '1 kit à prova de água (conforme SOLAS)', validade: '5 anos (medicamentos: verificar data individual)' },
    { nome: 'Comprimidos para o Enjoo', quantidade: '6 doses por pessoa', validade: '4 anos (conforme fabricante)' },
    { nome: 'Sacos para Enjoo', quantidade: '1 por pessoa', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Foguetes com Paraquedas', quantidade: '4 unidades', validade: '4 anos (conforme normas SOLAS/IMO)' },
    { nome: 'Fachos de Mão', quantidade: '6 unidades', validade: '4 anos (conforme normas SOLAS/IMO)' },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: '2 unidades', validade: '4 anos (conforme normas SOLAS/IMO)' },
    { nome: 'Lanterna Estanque', quantidade: '1 unidade (com pilhas e lâmpada suplente)', validade: 'Corpo: Indefinida, Pilhas: 2 anos' },
    { nome: 'Heliógrafo (Espelho de Sinais)', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Apito', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Faca de Ponta Redonda Flutuante', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Esponjas', quantidade: '2 unidades', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Abre-latas', quantidade: '3 unidades', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Copos Graduados', quantidade: '1 ou mais', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Manta Térmica', quantidade: '2 unidades', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Kit de Pesca', quantidade: '1 conjunto', validade: '5 anos (linha e anzóis)' },
    { nome: 'Manual de Sobrevivência', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Tabela de Sinais de Salvamento', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Fole ou Bomba de Enchimento', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Tampões para Furos', quantidade: 'Vários tamanhos', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Kit de Reparação', quantidade: '1 kit (para furos)', validade: '5 anos (adesivos e materiais)' },
    { nome: 'Âncora Flutuante (Drogue)', quantidade: '1 ou 2 (dependendo do tamanho)', validade: 'Indefinida (durabilidade ilimitada)' }
  ],
  'Pack SOLAS B': [
    { nome: 'Kit de Primeiros Socorros', quantidade: '1 kit à prova de água (conforme SOLAS)', validade: '5 anos (medicamentos: verificar data individual)' },
    { nome: 'Comprimidos para o Enjoo', quantidade: '6 doses por pessoa', validade: '4 anos (conforme fabricante)' },
    { nome: 'Sacos para Enjoo', quantidade: '1 por pessoa', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Foguetes com Paraquedas', quantidade: '2 unidades (metade do Pack A)', validade: '4 anos (conforme normas SOLAS/IMO)' },
    { nome: 'Fachos de Mão', quantidade: '3 unidades (metade do Pack A)', validade: '4 anos (conforme normas SOLAS/IMO)' },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: '1 unidade (metade do Pack A)', validade: '4 anos (conforme normas SOLAS/IMO)' },
    { nome: 'Lanterna Estanque', quantidade: '1 unidade (com pilhas e lâmpada suplente)', validade: 'Corpo: Indefinida, Pilhas: 2 anos' },
    { nome: 'Heliógrafo (Espelho de Sinais)', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Apito', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Faca de Ponta Redonda Flutuante', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Esponjas', quantidade: '2 unidades', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Copos Graduados', quantidade: '1 ou mais', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Manta Térmica', quantidade: '2 unidades', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Manual de Sobrevivência', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Tabela de Sinais de Salvamento', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Fole ou Bomba de Enchimento', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Tampões para Furos', quantidade: 'Vários tamanhos', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Kit de Reparação', quantidade: '1 kit (para furos)', validade: '5 anos (adesivos e materiais)' },
    { nome: 'Âncora Flutuante (Drogue)', quantidade: '1 ou 2 (dependendo do tamanho)', validade: 'Indefinida (durabilidade ilimitada)' }
  ],
  'Pack ISO 9650-1 (>24h)': [
    { nome: 'Rações de Emergência', quantidade: '10,000 kJ (aprox. 2400 kcal) por pessoa', validade: '5 anos (conforme fabricante e normas ISO)' },
    { nome: 'Água Potável', quantidade: '1.5 litros por pessoa', validade: '6 anos (embalagem estéril, conforme ISO)' },
    { nome: 'Kit de Primeiros Socorros', quantidade: '1 kit à prova de água (conforme ISO)', validade: '5 anos (medicamentos: verificar data individual)' },
    { nome: 'Comprimidos para o Enjoo', quantidade: '6 doses por pessoa', validade: '4 anos (conforme fabricante)' },
    { nome: 'Sacos para Enjoo', quantidade: '1 por pessoa', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Foguetes com Paraquedas', quantidade: '4 unidades', validade: '4 anos (conforme normas ISO/IMO)' },
    { nome: 'Fachos de Mão', quantidade: '6 unidades', validade: '4 anos (conforme normas ISO/IMO)' },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: '2 unidades', validade: '4 anos (conforme normas ISO/IMO)' },
    { nome: 'Lanterna Estanque', quantidade: '1 unidade (com pilhas e lâmpada suplente)', validade: 'Corpo: Indefinida, Pilhas: 2 anos' },
    { nome: 'Heliógrafo (Espelho de Sinais)', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Apito', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Faca de Ponta Redonda Flutuante', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Esponjas', quantidade: '2 unidades', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Abre-latas', quantidade: '3 unidades', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Copos Graduados', quantidade: '1 ou mais', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Manta Térmica', quantidade: '2 unidades', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Kit de Pesca', quantidade: '1 conjunto', validade: '5 anos (linha e anzóis)' },
    { nome: 'Manual de Sobrevivência', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Tabela de Sinais de Salvamento', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Fole ou Bomba de Enchimento', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Tampões para Furos', quantidade: 'Vários tamanhos', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Kit de Reparação', quantidade: '1 kit (para furos)', validade: '5 anos (adesivos e materiais)' },
    { nome: 'Âncora Flutuante (Drogue)', quantidade: '1 ou 2 (dependendo do tamanho)', validade: 'Indefinida (durabilidade ilimitada)' }
  ],
  'Pack ISO 9650-1 (<24h)': [
    { nome: 'Água Potável', quantidade: '0.5 litros por pessoa', validade: '6 anos (embalagem estéril, conforme ISO)' },
    { nome: 'Kit de Primeiros Socorros', quantidade: '1 kit à prova de água (conforme ISO)', validade: '5 anos (medicamentos: verificar data individual)' },
    { nome: 'Comprimidos para o Enjoo', quantidade: '6 doses por pessoa', validade: '4 anos (conforme fabricante)' },
    { nome: 'Sacos para Enjoo', quantidade: '1 por pessoa', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Foguetes com Paraquedas', quantidade: '3 unidades', validade: '4 anos (conforme normas ISO/IMO)' },
    { nome: 'Fachos de Mão', quantidade: '3 unidades', validade: '4 anos (conforme normas ISO/IMO)' },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: '1 unidade', validade: '4 anos (conforme normas ISO/IMO)' },
    { nome: 'Lanterna Estanque', quantidade: '1 unidade (com pilhas e lâmpada suplente)', validade: 'Corpo: Indefinida, Pilhas: 2 anos' },
    { nome: 'Heliógrafo (Espelho de Sinais)', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Apito', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Faca de Ponta Redonda Flutuante', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Esponjas', quantidade: '2 unidades', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Copos Graduados', quantidade: '1 ou mais', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Manta Térmica', quantidade: '2 unidades', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Manual de Sobrevivência', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Tabela de Sinais de Salvamento', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Fole ou Bomba de Enchimento', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Tampões para Furos', quantidade: 'Vários tamanhos', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Kit de Reparação', quantidade: '1 kit (para furos)', validade: '5 anos (adesivos e materiais)' },
    { nome: 'Âncora Flutuante (Drogue)', quantidade: '1 ou 2 (dependendo do tamanho)', validade: 'Indefinida (durabilidade ilimitada)' }
  ],
  'Pack Coastal/E': [
    { nome: 'Foguetes com Paraquedas', quantidade: 'Quantidade mínima exigida por lei local', validade: '4 anos (conforme normas internacionais)' },
    { nome: 'Fachos de Mão', quantidade: 'Quantidade mínima exigida por lei local', validade: '4 anos (conforme normas internacionais)' },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: 'Quantidade mínima exigida por lei local', validade: '4 anos (conforme normas internacionais)' },
    { nome: 'Lanterna Estanque', quantidade: '1 unidade', validade: 'Corpo: Indefinida, Pilhas: 2 anos' },
    { nome: 'Apito', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Faca de Ponta Redonda Flutuante', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Kit de Reparação', quantidade: '1 kit básico', validade: '5 anos (adesivos e materiais)' }
  ],
  'Pack ORC': [
    { nome: 'Água Potável', quantidade: '0.5 litros por pessoa', validade: '6 anos (embalagem estéril, conforme ORC)' },
    { nome: 'Kit de Primeiros Socorros', quantidade: '1 kit básico (conforme ORC)', validade: '5 anos (medicamentos: verificar data individual)' },
    { nome: 'Comprimidos para o Enjoo', quantidade: '4 doses por pessoa', validade: '4 anos (conforme fabricante)' },
    { nome: 'Sacos para Enjoo', quantidade: '1 por pessoa', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Foguetes com Paraquedas', quantidade: '2 unidades', validade: '4 anos (conforme normas ORC/IMO)' },
    { nome: 'Fachos de Mão', quantidade: '2 unidades', validade: '4 anos (conforme normas ORC/IMO)' },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: '1 unidade', validade: '4 anos (conforme normas ORC/IMO)' },
    { nome: 'Lanterna Estanque', quantidade: '1 unidade (com pilhas e lâmpada suplente)', validade: 'Corpo: Indefinida, Pilhas: 2 anos' },
    { nome: 'Apito', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Faca de Ponta Redonda Flutuante', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Esponjas', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Manta Térmica', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Manual de Sobrevivência', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Fole ou Bomba de Enchimento', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Tampões para Furos', quantidade: 'Vários tamanhos básicos', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Kit de Reparação', quantidade: '1 kit básico', validade: '5 anos (adesivos e materiais)' },
    { nome: 'Âncora Flutuante (Drogue)', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' }
  ],
  'Simplificado Reduzido': [
    { nome: 'Água Potável', quantidade: '0.5 litros por pessoa', validade: '6 anos (embalagem estéril, conforme ORC)' },
    { nome: 'Kit de Primeiros Socorros', quantidade: '1 kit básico (conforme ORC)', validade: '5 anos (medicamentos: verificar data individual)' },
    { nome: 'Comprimidos para o Enjoo', quantidade: '4 doses por pessoa', validade: '4 anos (conforme fabricante)' },
    { nome: 'Sacos para Enjoo', quantidade: '1 por pessoa', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Foguetes com Paraquedas', quantidade: '2 unidades', validade: '4 anos (conforme normas ORC/IMO)' },
    { nome: 'Fachos de Mão', quantidade: '2 unidades', validade: '4 anos (conforme normas ORC/IMO)' },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: '1 unidade', validade: '4 anos (conforme normas ORC/IMO)' },
    { nome: 'Lanterna Estanque', quantidade: '1 unidade (com pilhas e lâmpada suplente)', validade: 'Corpo: Indefinida, Pilhas: 2 anos' },
    { nome: 'Apito', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Faca de Ponta Redonda Flutuante', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Esponjas', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Manta Térmica', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Manual de Sobrevivência', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Fole ou Bomba de Enchimento', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Tampões para Furos', quantidade: 'Vários tamanhos básicos', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Kit de Reparação', quantidade: '1 kit básico', validade: '5 anos (adesivos e materiais)' },
    { nome: 'Âncora Flutuante (Drogue)', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' }
  ],
  'Simplificado Minimo': [
    { nome: 'Foguetes com Paraquedas', quantidade: 'Quantidade mínima exigida por lei local', validade: '4 anos (conforme normas internacionais)' },
    { nome: 'Fachos de Mão', quantidade: 'Quantidade mínima exigida por lei local', validade: '4 anos (conforme normas internacionais)' },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: 'Quantidade mínima exigida por lei local', validade: '4 anos (conforme normas internacionais)' },
    { nome: 'Lanterna Estanque', quantidade: '1 unidade', validade: 'Corpo: Indefinida, Pilhas: 2 anos' },
    { nome: 'Apito', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Faca de Ponta Redonda Flutuante', quantidade: '1 unidade', validade: 'Indefinida (durabilidade ilimitada)' },
    { nome: 'Kit de Reparação', quantidade: '1 kit básico', validade: '5 anos (adesivos e materiais)' }
  ]
};

// Especificações técnicas detalhadas por modelo de jangada
export const ESPECIFICACOES_TECNICAS: Record<string, {
  sistemaInflacao: string; // Agora pode ser qualquer sistema da lista SISTEMAS_INSUFACAO
  valvulas: string; // Agora pode ser qualquer válvula da lista TODOS_TIPOS_VALVULAS
  cilindroCO2: string;
  cilindroN2?: string;
  volumeTotal: string;
  sistemaIluminacao: string;
  referencia?: string;
}> = {
  // ZODIAC
  'Zodiac 4': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.6L (0.6kg CO2)',
    volumeTotal: '4.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'ZODIAC-4-THANNER'
  },
  'Zodiac 6': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.9L (0.9kg CO2)',
    volumeTotal: '6.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'ZODIAC-6-THANNER'
  },
  'Zodiac 8': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.2L (1.2kg CO2)',
    volumeTotal: '8.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'ZODIAC-8-THANNER'
  },
  'Zodiac 10': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.5L (1.5kg CO2)',
    volumeTotal: '10.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'ZODIAC-10-THANNER'
  },
  'Zodiac 12': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.8L (1.8kg CO2)',
    volumeTotal: '12.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'ZODIAC-12-THANNER'
  },
  'Zodiac 16': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 2.4L (2.4kg CO2)',
    volumeTotal: '16.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'ZODIAC-16-THANNER'
  },
  'Zodiac 20': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.0L (3.0kg CO2)',
    volumeTotal: '20.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'ZODIAC-20-THANNER'
  },
  'Zodiac 25': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.75L (3.75kg CO2)',
    volumeTotal: '25.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'ZODIAC-25-THANNER'
  },

  // RFD - Modelos com diferentes sistemas
  'RFD Surviva MKII 4': {
    sistemaInflacao: 'VTE99',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.6L (0.6kg CO2)',
    volumeTotal: '4.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SURVIVA-MKII-4-VTE99'
  },
  'RFD Surviva MKII 6': {
    sistemaInflacao: 'VTE99',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.9L (0.9kg CO2)',
    volumeTotal: '6.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SURVIVA-MKII-6-VTE99'
  },
  'RFD Surviva MKII 8': {
    sistemaInflacao: 'VTE99',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.2L (1.2kg CO2)',
    volumeTotal: '8.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SURVIVA-MKII-8-VTE99'
  },
  'RFD Surviva MKII 10': {
    sistemaInflacao: 'VTE99',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.5L (1.5kg CO2)',
    volumeTotal: '10.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SURVIVA-MKII-10-VTE99'
  },
  'RFD Surviva MKII 12': {
    sistemaInflacao: 'VTE99',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.8L (1.8kg CO2)',
    volumeTotal: '12.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SURVIVA-MKII-12-VTE99'
  },
  'RFD Surviva MKII 16': {
    sistemaInflacao: 'VTE99',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 2.4L (2.4kg CO2)',
    volumeTotal: '16.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SURVIVA-MKII-16-VTE99'
  },

  // RFD - Modelos THANNER (Seasava Plus, Surviva MKIII, Ferryman)
  'RFD Seasava Plus 6': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.9L (0.9kg CO2)',
    volumeTotal: '6.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PLUS-6-THANNER'
  },
  'RFD Seasava Plus 8': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.2L (1.2kg CO2)',
    volumeTotal: '8.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PLUS-8-THANNER'
  },
  'RFD Seasava Plus 10': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.5L (1.5kg CO2)',
    volumeTotal: '10.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PLUS-10-THANNER'
  },
  'RFD Seasava Plus 12': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.8L (1.8kg CO2)',
    volumeTotal: '12.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PLUS-12-THANNER'
  },
  'RFD Seasava Plus 15': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 2.25L (2.25kg CO2)',
    volumeTotal: '15.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PLUS-15-THANNER'
  },
  'RFD Seasava Plus 20': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.0L (3.0kg CO2)',
    volumeTotal: '20.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PLUS-20-THANNER'
  },
  'RFD Seasava Plus 25': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.75L (3.75kg CO2)',
    volumeTotal: '25.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PLUS-25-THANNER'
  },

  // RFD - Modelos LEAFIELD (Seasava Pro-ISO, Surviva MKIV TO)
  'RFD Seasava Pro-ISO 4': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.6L (0.6kg CO2)',
    volumeTotal: '4.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PRO-ISO-4-LEAFIELD'
  },
  'RFD Seasava Pro-ISO 6': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.9L (0.9kg CO2)',
    volumeTotal: '6.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PRO-ISO-6-LEAFIELD'
  },
  'RFD Seasava Pro-ISO 8': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.2L (1.2kg CO2)',
    volumeTotal: '8.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PRO-ISO-8-LEAFIELD'
  },
  'RFD Seasava Pro-ISO 10': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.5L (1.5kg CO2)',
    volumeTotal: '10.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PRO-ISO-10-LEAFIELD'
  },
  'RFD Seasava Pro-ISO 12': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.8L (1.8kg CO2)',
    volumeTotal: '12.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'RFD-SEASAVA-PRO-ISO-12-LEAFIELD'
  },

  // DSB
  'DSB 4': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.6L (0.6kg CO2)',
    volumeTotal: '4.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'DSB-4-THANNER'
  },
  'DSB 6': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.9L (0.9kg CO2)',
    volumeTotal: '6.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'DSB-6-THANNER'
  },
  'DSB 8': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.2L (1.2kg CO2)',
    volumeTotal: '8.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'DSB-8-THANNER'
  },
  'DSB 10': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.5L (1.5kg CO2)',
    volumeTotal: '10.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'DSB-10-THANNER'
  },
  'DSB 12': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.8L (1.8kg CO2)',
    volumeTotal: '12.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'DSB-12-THANNER'
  },
  'DSB 16': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 2.4L (2.4kg CO2)',
    volumeTotal: '16.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'DSB-16-THANNER'
  },
  'DSB 20': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.0L (3.0kg CO2)',
    volumeTotal: '20.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'DSB-20-THANNER'
  },
  'DSB 25': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.75L (3.75kg CO2)',
    volumeTotal: '25.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'DSB-25-THANNER'
  },

  // LALIZAS
  'LALIZAS 4': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.6L (0.6kg CO2)',
    volumeTotal: '4.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED',
    referencia: 'LALIZAS-4-THANNER'
  },
  'LALIZAS 6': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.9L (0.9kg CO2)',
    volumeTotal: '6.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED',
    referencia: 'LALIZAS-6-THANNER'
  },
  'LALIZAS 8': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.2L (1.2kg CO2)',
    volumeTotal: '8.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED',
    referencia: 'LALIZAS-8-THANNER'
  },
  'LALIZAS 10': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.5L (1.5kg CO2)',
    volumeTotal: '10.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED',
    referencia: 'LALIZAS-10-THANNER'
  },
  'LALIZAS 12': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.8L (1.8kg CO2)',
    volumeTotal: '12.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED',
    referencia: 'LALIZAS-12-THANNER'
  },
  'LALIZAS 16': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 2.4L (2.4kg CO2)',
    volumeTotal: '16.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED',
    referencia: 'LALIZAS-16-THANNER'
  },
  'LALIZAS 20': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.0L (3.0kg CO2)',
    volumeTotal: '20.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED',
    referencia: 'LALIZAS-20-THANNER'
  },
  'LALIZAS 25': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.75L (3.75kg CO2)',
    volumeTotal: '25.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED',
    referencia: 'LALIZAS-25-THANNER'
  },

  // PLASTIMO
  'PLASTIMO 4': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.6L (0.6kg CO2)',
    volumeTotal: '4.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'PLASTIMO-4-LEAFIELD'
  },
  'PLASTIMO 6': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.9L (0.9kg CO2)',
    volumeTotal: '6.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'PLASTIMO-6-LEAFIELD'
  },
  'PLASTIMO 8': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.2L (1.2kg CO2)',
    volumeTotal: '8.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'PLASTIMO-8-LEAFIELD'
  },
  'PLASTIMO 10': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.5L (1.5kg CO2)',
    volumeTotal: '10.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'PLASTIMO-10-LEAFIELD'
  },
  'PLASTIMO 12': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.8L (1.8kg CO2)',
    volumeTotal: '12.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'PLASTIMO-12-LEAFIELD'
  },
  'PLASTIMO 16': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 2.4L (2.4kg CO2)',
    volumeTotal: '16.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'PLASTIMO-16-LEAFIELD'
  },
  'PLASTIMO 20': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.0L (3.0kg CO2)',
    volumeTotal: '20.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'PLASTIMO-20-LEAFIELD'
  },
  'PLASTIMO 25': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.75L (3.75kg CO2)',
    volumeTotal: '25.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'PLASTIMO-25-LEAFIELD'
  },

  // SEA-SAFE
  'SEA-SAFE 4': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.6L (0.6kg CO2)',
    volumeTotal: '4.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'SEA-SAFE-4-THANNER'
  },
  'SEA-SAFE 6': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.9L (0.9kg CO2)',
    volumeTotal: '6.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'SEA-SAFE-6-THANNER'
  },
  'SEA-SAFE 8': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.2L (1.2kg CO2)',
    volumeTotal: '8.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'SEA-SAFE-8-THANNER'
  },
  'SEA-SAFE 10': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.5L (1.5kg CO2)',
    volumeTotal: '10.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'SEA-SAFE-10-THANNER'
  },
  'SEA-SAFE 12': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.8L (1.8kg CO2)',
    volumeTotal: '12.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'SEA-SAFE-12-THANNER'
  },
  'SEA-SAFE 16': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 2.4L (2.4kg CO2)',
    volumeTotal: '16.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'SEA-SAFE-16-THANNER'
  },
  'SEA-SAFE 20': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.0L (3.0kg CO2)',
    volumeTotal: '20.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'SEA-SAFE-20-THANNER'
  },
  'SEA-SAFE 25': {
    sistemaInflacao: 'THANNER',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.75L (3.75kg CO2)',
    volumeTotal: '25.0m³',
    sistemaIluminacao: 'Sistema de iluminação LED integrado',
    referencia: 'SEA-SAFE-25-THANNER'
  },

  // EUROVINIL
  'EUROVINIL 4': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.6L (0.6kg CO2)',
    volumeTotal: '4.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'EUROVINIL-4-LEAFIELD'
  },
  'EUROVINIL 6': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 0.9L (0.9kg CO2)',
    volumeTotal: '6.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'EUROVINIL-6-LEAFIELD'
  },
  'EUROVINIL 8': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.2L (1.2kg CO2)',
    volumeTotal: '8.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'EUROVINIL-8-LEAFIELD'
  },
  'EUROVINIL 10': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.5L (1.5kg CO2)',
    volumeTotal: '10.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'EUROVINIL-10-LEAFIELD'
  },
  'EUROVINIL 12': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 1.8L (1.8kg CO2)',
    volumeTotal: '12.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'EUROVINIL-12-LEAFIELD'
  },
  'EUROVINIL 16': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 2.4L (2.4kg CO2)',
    volumeTotal: '16.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'EUROVINIL-16-LEAFIELD'
  },
  'EUROVINIL 20': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.0L (3.0kg CO2)',
    volumeTotal: '20.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'EUROVINIL-20-LEAFIELD'
  },
  'EUROVINIL 25': {
    sistemaInflacao: 'LEAFIELD',
    valvulas: 'Válvula de alívio de pressão automática',
    cilindroCO2: '1x 3.75L (3.75kg CO2)',
    volumeTotal: '25.0m³',
    sistemaIluminacao: 'Luz de localização LED',
    referencia: 'EUROVINIL-25-LEAFIELD'
  }
};

// === NOVAS LISTAS BASEADAS EM ESPECIFICAÇÕES TÉCNICAS DETALHADAS ===

// Sistemas de Insuflação
export const SISTEMAS_INSUFLACAO = [
  'THANNER',
  'Leafield',
  'VTE99',
  'HSR-OH-III',
  'NSS'
] as const;

// Válvulas de Insuflação
export const VALVULAS_INSUFLACAO = [
  'OTS65',
  'A10',
  'A6',
  'C7',
  'D7',
  'A5',
  'A7',
  'Supernova',
  'AQF-5-100',
  '71891'
] as const;

// Válvulas de Alívio
export const VALVULAS_ALIVIO = [
  'OTS65',
  'A10',
  'A6',
  'C7',
  'D7',
  'A5',
  'A7'
] as const;

// Cabeças de Disparo
export const CABECAS_DISPARO = [
  'THANNER',
  'Leafield',
  'VTE99',
  'HSR-OH-III',
  'NSS'
] as const;

// Baterias de Lítio
export const BATERIAS_LITIO = [
  'BAT-RL5-LITH',
  'SURV-BATT-LITH-01'
] as const;

// Sistemas de Iluminação
export const SISTEMAS_ILUMINACAO = [
  'LGT-RL5-INT',
  'LGT-RL5-EXT',
  'SURV-L-INT-01',
  'SURV-L-EXT-02'
] as const;

// Especificações detalhadas por marca e modelo (baseado no documento técnico)
export const ESPECIFICACOES_POR_MARCA_MODELO: Record<string, {
  marca: string;
  modelo: string;
  sistemaInsuflacao: string;
  valvulas: string[];
  capacidades: Array<{
    pessoas: number;
    cilindroCO2: string;
    cilindroN2?: string;
    volume: string;
    referencia?: string;
  }>;
  packs: string[];
}> = {
  // ZODIAC
  'ZODIAC_COASTER': {
    marca: 'ZODIAC',
    modelo: 'COASTER',
    sistemaInsuflacao: 'THANNER',
    valvulas: ['OTS65'],
    capacidades: [
      { pessoas: 4, cilindroCO2: '2.2kg CO2, 0.14kg N2', volume: '4L' },
      { pessoas: 6, cilindroCO2: '2.36kg CO2, 0.15kg N2', volume: '4L' },
      { pessoas: 8, cilindroCO2: '3.68kg CO2, 0.235kg N2', volume: '6.7L' }
    ],
    packs: ['SOLAS A', 'SOLAS B', 'ISO 9650-1']
  },
  'ZODIAC_PROPECHE_CLV': {
    marca: 'ZODIAC',
    modelo: 'PROPECHE CLV',
    sistemaInsuflacao: 'THANNER',
    valvulas: ['OTS65'],
    capacidades: [
      { pessoas: 6, cilindroCO2: '1.487kg CO2, 0.095kg N2', volume: '2.83L' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },
  'ZODIAC_PROPECHE_CLVI': {
    marca: 'ZODIAC',
    modelo: 'PROPECHE CLVI',
    sistemaInsuflacao: 'THANNER',
    valvulas: ['OTS65'],
    capacidades: [
      { pessoas: 6, cilindroCO2: '2.4kg CO2, 0.144kg N2', volume: '4L' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },
  'ZODIAC_MOR': {
    marca: 'ZODIAC',
    modelo: 'MOR',
    sistemaInsuflacao: 'THANNER',
    valvulas: ['OTS65'],
    capacidades: [
      { pessoas: 10, cilindroCO2: '13.2kg CO2, 0.792kg N2', volume: '24L' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },
  'ZODIAC_TO': {
    marca: 'ZODIAC',
    modelo: 'TO (Throw-Over)',
    sistemaInsuflacao: 'THANNER',
    valvulas: ['OTS65'],
    capacidades: [
      { pessoas: 6, cilindroCO2: '3.59kg CO2, 0.18kg N2', volume: '5.36L' },
      { pessoas: 8, cilindroCO2: '3.59kg CO2, 0.18kg N2', volume: '5.36L' },
      { pessoas: 10, cilindroCO2: '5.38kg CO2, 0.27kg N2', volume: '8.04L' },
      { pessoas: 12, cilindroCO2: '5.38kg CO2, 0.27kg N2', volume: '8.04L' },
      { pessoas: 16, cilindroCO2: '7.18kg CO2, 0.36kg N2', volume: '10.72L' },
      { pessoas: 20, cilindroCO2: '8.8kg CO2, 0.44kg N2', volume: '13.40L' },
      { pessoas: 25, cilindroCO2: '10.77kg CO2, 0.54kg N2', volume: '16.08L' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },
  'ZODIAC_TO_SR': {
    marca: 'ZODIAC',
    modelo: 'TO SR (Self-Righting)',
    sistemaInsuflacao: 'THANNER',
    valvulas: ['OTS65'],
    capacidades: [
      { pessoas: 6, cilindroCO2: '3.59kg CO2, 0.18kg N2', volume: '5.36L' },
      { pessoas: 8, cilindroCO2: '3.59kg CO2, 0.18kg N2', volume: '5.36L' },
      { pessoas: 10, cilindroCO2: '5.38kg CO2, 0.27kg N2', volume: '8.04L' },
      { pessoas: 12, cilindroCO2: '5.38kg CO2, 0.27kg N2', volume: '8.04L' },
      { pessoas: 25, cilindroCO2: '12.57kg CO2, 0.63kg N2', volume: '18.76L' },
      { pessoas: 37, cilindroCO2: '2x 8.8kg CO2, 0.44kg N2', volume: '13.4L' },
      { pessoas: 50, cilindroCO2: '2x 12.57kg CO2, 0.63kg N2', volume: '18.76L' },
      { pessoas: 100, cilindroCO2: '4x 12.57kg CO2, 0.63kg N2', volume: '18.76L' },
      { pessoas: 150, cilindroCO2: '4x 12.57kg CO2, 0.63kg N2', volume: '18.76L' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },
  'ZODIAC_MKIV': {
    marca: 'ZODIAC',
    modelo: 'ZODIAC MKIV',
    sistemaInsuflacao: 'Leafield',
    valvulas: ['A10', 'A6', 'C7', 'D7', 'A5', 'A7'],
    capacidades: [
      { pessoas: 6, cilindroCO2: 'Variável conforme capacidade', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: 'Variável conforme capacidade', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: 'Variável conforme capacidade', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: 'Variável conforme capacidade', volume: 'Variável' },
      { pessoas: 15, cilindroCO2: 'Variável conforme capacidade', volume: 'Variável' },
      { pessoas: 20, cilindroCO2: 'Variável conforme capacidade', volume: 'Variável' },
      { pessoas: 25, cilindroCO2: 'Variável conforme capacidade', volume: 'Variável' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },

  // RFD
  'RFD_SEASAVA_PLUS': {
    marca: 'RFD',
    modelo: 'SEASAVA PLUS',
    sistemaInsuflacao: 'Thanner',
    valvulas: ['OTS65', 'A10', 'A6', 'C7', 'D7', 'A5', 'A7'],
    capacidades: [
      { pessoas: 6, cilindroCO2: '3.38kg a 9.38kg CO2+N2', volume: 'Variável', referencia: '08719009' },
      { pessoas: 8, cilindroCO2: '3.38kg a 9.38kg CO2+N2', volume: 'Variável', referencia: '08719009' },
      { pessoas: 10, cilindroCO2: '3.38kg a 9.38kg CO2+N2', volume: 'Variável', referencia: '08719009' },
      { pessoas: 12, cilindroCO2: '3.38kg a 9.38kg CO2+N2', volume: 'Variável', referencia: '08719009' },
      { pessoas: 15, cilindroCO2: '3.38kg a 9.38kg CO2+N2', volume: 'Variável', referencia: '08719009' },
      { pessoas: 20, cilindroCO2: '3.38kg a 9.38kg CO2+N2', volume: 'Variável', referencia: '08719009' },
      { pessoas: 25, cilindroCO2: '3.38kg a 9.38kg CO2+N2', volume: 'Variável', referencia: '08719009' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },
  'RFD_SEASAVA_PRO_ISO': {
    marca: 'RFD',
    modelo: 'SEASAVA PRO-ISO',
    sistemaInsuflacao: 'Leafield',
    valvulas: ['A6', 'A7', 'A5', 'C7', 'D7', 'B10'],
    capacidades: [
      { pessoas: 4, cilindroCO2: '1.58kg a 4.17kg CO2+N2', volume: 'Variável' },
      { pessoas: 6, cilindroCO2: '1.58kg a 4.17kg CO2+N2', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: '1.58kg a 4.17kg CO2+N2', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: '1.58kg a 4.17kg CO2+N2', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: '1.58kg a 4.17kg CO2+N2', volume: 'Variável' }
    ],
    packs: ['ISO 9650-1 (>24h)', 'ISO 9650-1 (<24h)']
  },
  'RFD_SURVIVA_MKII': {
    marca: 'RFD',
    modelo: 'SURVIVA MKII',
    sistemaInsuflacao: 'VTE99',
    valvulas: ['Supernova'],
    capacidades: [
      { pessoas: 4, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 6, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 16, cilindroCO2: 'Variável', volume: 'Variável' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },
  'RFD_SURVIVA_MKIII': {
    marca: 'RFD',
    modelo: 'SURVIVA MKIII',
    sistemaInsuflacao: 'THANNER',
    valvulas: ['OTS65'],
    capacidades: [
      { pessoas: 6, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: '5.94kg CO2, 0.18kg N2', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 15, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 20, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 25, cilindroCO2: 'Variável', volume: 'Variável' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },
  'RFD_SURVIVA_MKIV_TO': {
    marca: 'RFD',
    modelo: 'SURVIVA MKIV TO',
    sistemaInsuflacao: 'Leafield',
    valvulas: ['A10', 'A6', 'C7', 'D7', 'A5', 'A7'],
    capacidades: [
      { pessoas: 6, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: '3.51kg CO2, 0.23kg N2', volume: 'Variável', referencia: '50463005' },
      { pessoas: 10, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 15, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 20, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 25, cilindroCO2: 'Variável', volume: 'Variável' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },
  'RFD_FERRYMAN': {
    marca: 'RFD',
    modelo: 'FERRYMAN',
    sistemaInsuflacao: 'THANNER',
    valvulas: ['OTS65'],
    capacidades: [
      { pessoas: 6, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: 'Variável', volume: 'Variável' }
    ],
    packs: ['E']
  },

  // DSB
  'DSB_LR97': {
    marca: 'DSB',
    modelo: 'LR97 / LR97 L',
    sistemaInsuflacao: 'THANNER',
    valvulas: ['OTS65'],
    capacidades: [
      { pessoas: 6, cilindroCO2: '3.59kg a 12.57kg CO2+N2', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: '3.59kg a 12.57kg CO2+N2', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: '3.59kg a 12.57kg CO2+N2', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: '3.59kg a 12.57kg CO2+N2', volume: 'Variável' },
      { pessoas: 15, cilindroCO2: '3.59kg a 12.57kg CO2+N2', volume: 'Variável' },
      { pessoas: 20, cilindroCO2: '3.59kg a 12.57kg CO2+N2', volume: 'Variável' },
      { pessoas: 25, cilindroCO2: '3.59kg a 12.57kg CO2+N2', volume: 'Variável' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },
  'DSB_LR07': {
    marca: 'DSB',
    modelo: 'LR07',
    sistemaInsuflacao: 'Leafield',
    valvulas: ['A10', 'A6', 'C7', 'D7', 'A5', 'A7'],
    capacidades: [
      { pessoas: 6, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 15, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 20, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 25, cilindroCO2: 'Variável', volume: 'Variável' }
    ],
    packs: ['SOLAS A', 'SOLAS B']
  },

  // LALIZAS
  'LALIZAS_ISO_RAFT': {
    marca: 'LALIZAS',
    modelo: 'ISO-RAFT',
    sistemaInsuflacao: 'HSR-OH-III',
    valvulas: ['AQF-5-100', '71891'],
    capacidades: [
      { pessoas: 4, cilindroCO2: '2.4kg a 6.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 6, cilindroCO2: '2.4kg a 6.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: '2.4kg a 6.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: '2.4kg a 6.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: '2.4kg a 6.0kg CO2+N2', volume: 'Variável' }
    ],
    packs: ['ISO 9650-1 (>24h)', 'ISO 9650-1 (<24h)']
  },

  // PLASTIMO
  'PLASTIMO_CRUISER': {
    marca: 'PLASTIMO',
    modelo: 'Cruiser',
    sistemaInsuflacao: 'Variável',
    valvulas: [],
    capacidades: [
      { pessoas: 4, cilindroCO2: '1.1kg a 2.2kg CO2+N2', volume: 'Variável' },
      { pessoas: 6, cilindroCO2: '1.1kg a 2.2kg CO2+N2', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: '1.1kg a 2.2kg CO2+N2', volume: 'Variável' }
    ],
    packs: ['Cruiser Standard', 'Cruiser ORC']
  },
  'PLASTIMO_TRANSOCEAN': {
    marca: 'PLASTIMO',
    modelo: 'Transocean ISO 9650-1',
    sistemaInsuflacao: 'Variável',
    valvulas: [],
    capacidades: [
      { pessoas: 4, cilindroCO2: '1.1kg a 3.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 6, cilindroCO2: '1.1kg a 3.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: '1.1kg a 3.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: '1.1kg a 3.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: '1.1kg a 3.0kg CO2+N2', volume: 'Variável' }
    ],
    packs: ['Transocean >24h', 'Transocean <24h']
  },
  'PLASTIMO_OFFSHORE': {
    marca: 'PLASTIMO',
    modelo: 'Offshore',
    sistemaInsuflacao: 'Variável',
    valvulas: [],
    capacidades: [
      { pessoas: 4, cilindroCO2: '1.1kg a 3.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 6, cilindroCO2: '1.1kg a 3.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: '1.1kg a 3.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: '1.1kg a 3.0kg CO2+N2', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: '1.1kg a 3.0kg CO2+N2', volume: 'Variável' }
    ],
    packs: ['Pack 2 (<24h)']
  },

  // Sea-Safe
  'SEA_SAFE_PRO_LIGHT': {
    marca: 'Sea-Safe',
    modelo: 'Pro-Light',
    sistemaInsuflacao: 'NSS',
    valvulas: [],
    capacidades: [
      { pessoas: 4, cilindroCO2: '1.28kg a 2.7kg CO2+N2', volume: 'Variável' },
      { pessoas: 6, cilindroCO2: '1.28kg a 2.7kg CO2+N2', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: '1.28kg a 2.7kg CO2+N2', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: '1.28kg a 2.7kg CO2+N2', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: '1.28kg a 2.7kg CO2+N2', volume: 'Variável' }
    ],
    packs: ['Pack 1 (>24h)', 'Pack 2 (<24h)']
  },
  'SEA_SAFE_ISO': {
    marca: 'Sea-Safe',
    modelo: 'ISO 9650-1',
    sistemaInsuflacao: 'Variável',
    valvulas: [],
    capacidades: [
      { pessoas: 4, cilindroCO2: 'Variável (12P >24h: 5.4kg CO2, <24h: 2.7kg CO2)', volume: 'Variável' },
      { pessoas: 6, cilindroCO2: 'Variável (12P >24h: 5.4kg CO2, <24h: 2.7kg CO2)', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: 'Variável (12P >24h: 5.4kg CO2, <24h: 2.7kg CO2)', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: 'Variável (12P >24h: 5.4kg CO2, <24h: 2.7kg CO2)', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: 'Variável (12P >24h: 5.4kg CO2, <24h: 2.7kg CO2)', volume: 'Variável' }
    ],
    packs: ['Pack 1 (>24h)', 'Pack 2 (<24h)']
  },

  // Eurovinil
  'EUROVINIL_LEISURE_SYNTHESY': {
    marca: 'Eurovinil',
    modelo: 'Leisure Syntesy',
    sistemaInsuflacao: 'Variável',
    valvulas: [],
    capacidades: [
      { pessoas: 4, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 6, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 8, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 10, cilindroCO2: 'Variável', volume: 'Variável' },
      { pessoas: 12, cilindroCO2: 'Variável', volume: 'Variável' }
    ],
    packs: ['Coastal']
  }
};

// Funções auxiliares para obter dados
export const getModelosPorMarca = (marca: string): string[] => {
  return Object.keys(ESPECIFICACOES_POR_MARCA_MODELO)
    .filter(key => ESPECIFICACOES_POR_MARCA_MODELO[key].marca === marca)
    .map(key => ESPECIFICACOES_POR_MARCA_MODELO[key].modelo);
};

export const getEspecificacaoPorMarcaModelo = (marca: string, modelo: string) => {
  const key = Object.keys(ESPECIFICACOES_POR_MARCA_MODELO)
    .find(k => ESPECIFICACOES_POR_MARCA_MODELO[k].marca === marca &&
              ESPECIFICACOES_POR_MARCA_MODELO[k].modelo === modelo);
  return key ? ESPECIFICACOES_POR_MARCA_MODELO[key] : null;
};

export const getSistemasInsuflacaoPorMarca = (marca: string): string[] => {
  const specs = Object.values(ESPECIFICACOES_POR_MARCA_MODELO)
    .filter(spec => spec.marca === marca);
  return [...new Set(specs.map(spec => spec.sistemaInsuflacao))];
};

export const getValvulasPorMarca = (marca: string): string[] => {
  const specs = Object.values(ESPECIFICACOES_POR_MARCA_MODELO)
    .filter(spec => spec.marca === marca);
  return [...new Set(specs.flatMap(spec => spec.valvulas))];
};