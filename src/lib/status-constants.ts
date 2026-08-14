export const TEST_RESULTS = {
  PASSOU: 'PASSOU',
  REPROVOU: 'REPROVOU',
  N_A: 'N/A',
  APROVOU: 'APROVOU',
} as const;

export type TestResult = typeof TEST_RESULTS[keyof typeof TEST_RESULTS];

export const JANGADA_STATUS = {
  ATIVA: 'Ativa',
  INATIVA: 'Inativa',
  CONDENADA: 'Condenada',
  CONCLUIDA: 'Concluída',
  DRAFT: 'Draft',
  PENDENTE: 'Pendente',
  EM_INSPECAO: 'Em Inspeção',
} as const;

export type JangadaStatus = typeof JANGADA_STATUS[keyof typeof JANGADA_STATUS];

export const ORDEM_SERVICO_STATUS = {
  RASCUNHO: 'rascunho',
  PENDENTE: 'pendente',
  AGENDADA: 'agendada',
  CONFIRMADA: 'confirmada',
  EM_PROGRESSO: 'em_progresso',
  PAUSADA: 'pausada',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
  FATURADA: 'faturada',
} as const;

export type OrdemServicoStatus = typeof ORDEM_SERVICO_STATUS[keyof typeof ORDEM_SERVICO_STATUS];

export const ORCAMENTO_STATUS = {
  RASCUNHO: 'rascunho',
  PENDENTE: 'pendente',
  APROVADO: 'aprovado',
  REJEITADO: 'rejeitado',
  EM_EXECUCAO: 'em_execucao',
  CONCLUIDO: 'concluido',
} as const;

export type OrcamentoStatus = typeof ORCAMENTO_STATUS[keyof typeof ORCAMENTO_STATUS];

export const INSPECAO_STATUS = {
  AGENDADA: 'Agendada',
  EM_CURSO: 'Em Curso',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
} as const;

export type InspecaoStatus = typeof INSPECAO_STATUS[keyof typeof INSPECAO_STATUS];

export const COLETE_STATUS = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  EM_SERVICO: 'Em Serviço',
  MANUTENCAO: 'Manutenção',
  CONDENADO: 'Condenado',
} as const;

export type ColeteStatus = typeof COLETE_STATUS[keyof typeof COLETE_STATUS];

export const FATO_IMERSAO_STATUS = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  EM_SERVICO: 'Em Serviço',
  MANUTENCAO: 'Manutenção',
  CONDENADO: 'Condenado',
} as const;

export type FatoImersaoStatus = typeof FATO_IMERSAO_STATUS[keyof typeof FATO_IMERSAO_STATUS];

export const STOCK_ESTADO = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  BLOQUEADO: 'BLOQUEADO',
} as const;

export type StockEstado = typeof STOCK_ESTADO[keyof typeof STOCK_ESTADO];

export const TEST_LABELS: Record<string, string> = {
  testeWP: 'Working Pressure',
  testeGI: 'Gas Inflation',
  testeFS: 'Floor Seam',
  testeNAP: 'Necessary Additional Pressure',
  testeDL: 'Davit Load',
};

export const TEST_SHORT_LABELS: Record<string, string> = {
  testeWP: 'WP',
  testeGI: 'GI',
  testeFS: 'FS',
  testeNAP: 'NAP',
  testeDL: 'DL',
};

export function isTestPassed(result?: string | null): boolean {
  return result === TEST_RESULTS.PASSOU || result === TEST_RESULTS.APROVOU;
}

export function isTestFailed(result?: string | null): boolean {
  return result === TEST_RESULTS.REPROVOU;
}

export function isTestNA(result?: string | null): boolean {
  return result === TEST_RESULTS.N_A;
}

export function getTestResultLabel(result?: string | null): string {
  if (!result) return 'N/D';
  if (isTestPassed(result)) return 'Aprovado';
  if (isTestFailed(result)) return 'Reprovado';
  if (isTestNA(result)) return 'N/A';
  return result;
}

export function getTestResultColor(result?: string | null): string {
  if (isTestPassed(result)) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (isTestFailed(result)) return 'text-rose-600 bg-rose-50 border-rose-200';
  if (isTestNA(result)) return 'text-slate-500 bg-slate-50 border-slate-200';
  return 'text-slate-400 bg-slate-50 border-slate-200';
}
