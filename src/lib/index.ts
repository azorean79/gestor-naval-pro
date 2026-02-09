/**
 * Centralizado de exportações para sincronizar todos os módulos
 * Import tudo daqui para garantir consistência
 */

// ============================================================================
// TIPOS DE BANCO DE DADOS
// ============================================================================
export {
  type Cliente,
  type Navio,
  type Jangada,
  type Proprietario,
  type Pessoa,
  type Certificado,
  type Stock,
  type MovimentacaoStock,
  type Cilindro,
  type CilindroWithJangada,
  type TipoPack,
  type SistemaCilindro,
  type TipoCilindro,
  type TipoValvula,
  type Agendamento,
  type Fatura,
  type Notificacao,
  type Partner,
  type Obra,
  type PredictiveMaintenance,
  type Inspecao,
  type CustoInspecao,
  type HistoricoInspecao,
  type MarcaJangada,
  type ModeloJangada,
  type LotacaoJangada,
  type Relatorio,
} from './types';

// ============================================================================
// TIPOS DE FORMULÁRIO
// ============================================================================
export {
  type ClienteForm,
  type ProprietarioForm,
  type NavioForm,
  type JangadaForm,
  type StockForm,
  type CilindroForm,
} from './types';

// ============================================================================
// TIPOS DE FILTRO
// ============================================================================
export {
  type BaseFilters,
  type ClienteFilters,
  type ProprietarioFilters,
  type NavioFilters,
  type JangadaFilters,
  type StockFilters,
  type CilindroFilters,
  type AgendamentoFilters,
} from './types';

// ============================================================================
// TIPOS DE RESPOSTA DA API
// ============================================================================
export {
  type ApiResponse,
  type PaginatedResponse,
  type DashboardStats,
} from './types';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO ZODE
// ============================================================================
export {
  clienteSchema,
  proprietarioSchema,
  navioSchema,
  jangadaSchema,
  stockSchema,
  cilindroSchema,
  agendamentoSchema,
  faturaSchema,
} from './validation-schemas';

// ============================================================================
// FILTRO SCHEMAS
// ============================================================================
export {
  baseFiltersSchema,
  clienteFiltersSchema,
  navioFiltersSchema,
  jangadaFiltersSchema,
  stockFiltersSchema,
  cilindroFiltersSchema,
  agendamentoFiltersSchema,
} from './validation-schemas';

// ============================================================================
// TIPOS INFERIDOS DO ZOD (Type-safe)
// ============================================================================
export {
  type ClienteForm as ClienteFormType,
  type NavioForm as NavioFormType,
  type JangadaForm as JangadaFormType,
  type StockForm as StockFormType,
  type CilindroForm as CilindroFormType,
  type AgendamentoForm as AgendamentoFormType,
  type FaturaForm as FaturaFormType,
} from './validation-schemas';

// ============================================================================
// TIPOS DE FILTRO INFERIDOS
// ============================================================================
export {
  type ClienteFilters as ClienteFiltersType,
  type NavioFilters as NavioFiltersType,
  type JangadaFilters as JangadaFiltersType,
  type StockFilters as StockFiltersType,
  type CilindroFilters as CilindroFiltersType,
  type AgendamentoFilters as AgendamentoFiltersType,
} from './validation-schemas';

// ============================================================================
// UTILITÁRIOS
// ============================================================================
export * from './utils';
export * from './prisma';
export * from './query-client';

// ============================================================================
// OPÇÕES PADRÃO (para jangadas, cilindros, etc)
// ============================================================================
export * from './jangada-options';
