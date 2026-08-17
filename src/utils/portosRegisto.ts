/**
 * Extrai o porto de registo a partir da matrícula do navio
 * Exemplos de matrículas:
 * - PTHOR-1234567 → Horta
 * - PTPDL-123 → Ponta Delgada
 * - PTVFC-456 → Vila Franca do Campo
 * - PTSCF-789 → Santa Cruz das Flores
 */

export const PORTOS_REGISTO: Record<string, string> = {
  'HOR': 'Horta',
  'PDL': 'Ponta Delgada',
  'VFC': 'Vila Franca do Campo',
  'SCF': 'Santa Cruz das Flores',
  'ANG': 'Angra do Heroísmo',
  'ADH': 'Angra do Heroísmo',
  'MDA': 'Madalena',
  'LDP': 'Lajes do Pico',
  'SRP': 'São Roque do Pico',
  'VPT': 'Velas',
  'VEL': 'Velas',
  'SMA': 'Vila do Porto', // Santa Maria
  'VDP': 'Vila do Porto', // Santa Maria
  'CVO': 'Corvo',
  'GRA': 'Santa Cruz da Graciosa',
  'SCG': 'Santa Cruz da Graciosa',
  'PRV': 'Praia da Vitória',
  'AVE': 'Aveiro',
  'VDC': 'Viana do Castelo',
  'LEI': 'Leixões',
  'VRE': 'Vila Real de Santo António',
  'VIC': 'Vila do Conde',
  'PEN': 'Peniche',
  'ANC': 'Angra do Heroísmo',
  'SSB': 'Sesimbra',
  'PDV': 'Póvoa de Varzim',
  'SAG': 'Sagres',
  'PRM': 'Portimão',
  'SIE': 'Sines',
  'CAM': 'Caminha',
  'LOS': 'Lagos',
  'OLH': 'Olhão',
  'FNC': 'Funchal',
  'TBZ': 'Tavira',
};

/**
 * Extrai o código do porto de uma matrícula
 * @param matricula - Matrícula do navio (ex: "PTHOR-1234567" ou "PT-HOR-123")
 * @returns Porto de registo ou null se não for possível determinar
 */
export function extrairPortoDeMatricula(matricula?: string): string | null {
  if (!matricula) return null;
  
  const mat = matricula.trim().toUpperCase();

  // Remove separadores para cobrir formatos como PT-HOR-123, PT HOR 123, PTHOR-123
  const compact = mat.replace(/[^A-Z0-9]/g, '');

  // Padrão base: PT + código de 3 letras + restante matrícula
  // Ex: PTHOR1234567, PTPDL456, PTVEL118614L
  const match = compact.match(/^PT([A-Z]{3})/);
  
  if (match && match[1]) {
    const codigo = match[1];
    return PORTOS_REGISTO[codigo] || null;
  }
  
  return null;
}

/**
 * Obtém lista de todos os portos de registo disponíveis
 */
export function getPortosDisponiveis(): string[] {
  return Object.values(PORTOS_REGISTO).sort();
}

/**
 * Verifica se uma string é um porto de registo válido
 */
export function isPortoValido(porto: string): boolean {
  return Object.values(PORTOS_REGISTO).includes(porto);
}
