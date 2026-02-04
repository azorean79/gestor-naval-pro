// ========== TIPOS DE LOGÍSTICA ==========

export interface TransporteJangada {
  id: string;
  jangadaId: string;
  jangadaNome: string;
  origemIlha: string;
  destinoIlha: string;
  dataTransporte: string;
  tipoTransporte: 'barco_transporte' | 'ferry' | 'reboque' | 'proprio';
  veiculoTransporte?: string;
  motorista?: string;
  custoTransporte?: number;
  status: 'agendado' | 'em_transito' | 'concluido' | 'cancelado';
  documentacao?: DocumentacaoTransporte;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentacaoTransporte {
  seguroTransporte?: boolean;
  certificadoInspecao?: boolean;
  autorizacaoTransito?: boolean;
  manifestoCarga?: boolean;
  documentacaoAduaneira?: boolean;
  observacoesDocumentacao?: string;
}

export interface Porto {
  id: string;
  nome: string;
  ilha: string;
  tipo: 'comercial' | 'pesca' | 'recreativo' | 'transporte';
  coordenadas?: string;
  capacidade?: number;
  servicos?: ServicosPorto;
  contacto?: string;
  status: 'ativo' | 'manutencao' | 'fechado';
  createdAt?: string;
  updatedAt?: string;
}

export interface ServicosPorto {
  reboque?: boolean;
  reparacao?: boolean;
  abastecimento?: boolean;
  limpeza?: boolean;
  armazenagem?: boolean;
  transporteTerrestre?: boolean;
}

export interface RotaTransporte {
  id: string;
  origemIlha: string;
  destinoIlha: string;
  distanciaKm: number;
  tempoEstimadoHoras: number;
  custoBase: number;
  frequencia?: 'diaria' | 'semanal' | 'mensal';
  transportadoras?: string[];
  observacoes?: string;
  status: 'ativo' | 'suspenso' | 'cancelado';
  createdAt?: string;
  updatedAt?: string;
}

// Ilhas dos Açores
export const ILHAS_ACORES = [
  'São Miguel',
  'Terceira',
  'São Jorge',
  'Pico',
  'Faial',
  'Flores',
  'Corvo',
  'Graciosa',
  'Santa Maria'
] as const;

export type IlhaAcores = typeof ILHAS_ACORES[number];

// Tipos de transporte disponíveis
export const TIPOS_TRANSPORTE = [
  { value: 'barco_transporte', label: 'Barco de Transporte' },
  { value: 'ferry', label: 'Ferry' },
  { value: 'reboque', label: 'Reboque' },
  { value: 'proprio', label: 'Transporte Próprio' }
] as const;

// Status dos transportes
export const STATUS_TRANSPORTE = [
  { value: 'agendado', label: 'Agendado', color: 'blue' },
  { value: 'em_transito', label: 'Em Trânsito', color: 'yellow' },
  { value: 'concluido', label: 'Concluído', color: 'green' },
  { value: 'cancelado', label: 'Cancelado', color: 'red' }
] as const;