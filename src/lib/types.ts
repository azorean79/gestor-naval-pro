import { Prisma } from '@prisma/client';

// Database types
export type Cliente = Prisma.ClienteGetPayload<Record<string, unknown>>;
export type Navio = Prisma.NavioGetPayload<Record<string, unknown>>;
export type Jangada = Prisma.JangadaGetPayload<{
  include: {
    cliente: true;
    navio: true;
    proprietario: true;
    marca: true;
    modelo: true;
    lotacao: true;
    tipoPackRef: true;
  }
}>;
export type Proprietario = Prisma.ProprietarioGetPayload<Record<string, unknown>>;
export type Pessoa = Prisma.PessoaGetPayload<Record<string, unknown>>;
export type Certificado = Prisma.CertificadoGetPayload<Record<string, unknown>>;
export type Stock = Prisma.StockGetPayload<Record<string, unknown>>;
export type MovimentacaoStock = Prisma.MovimentacaoStockGetPayload<Record<string, unknown>>;
export type Cilindro = Prisma.CilindroGetPayload<Record<string, unknown>>;
export type CilindroWithJangada = Prisma.CilindroGetPayload<{
  include: {
    sistema: {
      select: {
        id: true;
        nome: true;
      };
    };
    agendamentos: {
      orderBy: { dataInicio: 'desc' };
      take: 5;
    };
    notificacoes: {
      where: { lida: false };
      orderBy: { createdAt: 'desc' };
    };
  };
}>;
export type TipoPack = Prisma.TipoPackGetPayload<Record<string, unknown>>;
export type SistemaCilindro = Prisma.SistemaCilindroGetPayload<Record<string, unknown>>;
export type TipoCilindro = Prisma.TipoCilindroGetPayload<Record<string, unknown>>;
export type TipoValvula = Prisma.TipoValvulaGetPayload<Record<string, unknown>>;
export type Agendamento = Prisma.AgendamentoGetPayload<Record<string, unknown>>;
export type Fatura = Prisma.FaturaGetPayload<Record<string, unknown>>;
export type Notificacao = Prisma.NotificacaoGetPayload<Record<string, unknown>>;
export type Partner = Prisma.PartnerGetPayload<Record<string, unknown>>;
export type Obra = Prisma.ObraGetPayload<Record<string, unknown>>;
export type PredictiveMaintenance = Prisma.PredictiveMaintenanceGetPayload<Record<string, unknown>>;
export type Inspecao = Prisma.InspecaoGetPayload<Record<string, unknown>>;
export type CustoInspecao = Prisma.CustoInspecaoGetPayload<Record<string, unknown>>;
export type HistoricoInspecao = Prisma.HistoricoInspecaoGetPayload<Record<string, unknown>>;
// ...existing code...
  // boletinsAplicados property removed
// End of type/interface
export type MarcaJangada = Prisma.MarcaJangadaGetPayload<Record<string, unknown>>;
export type ModeloJangada = Prisma.ModeloJangadaGetPayload<Record<string, unknown>>;
export type LotacaoJangada = Prisma.LotacaoJangadaGetPayload<Record<string, unknown>>;
export type Relatorio = Prisma.RelatorioGetPayload<Record<string, unknown>>;

// Form types
export interface ClienteForm {
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  nif?: string;
}

export interface ProprietarioForm {
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  nif?: string;
}

export interface NavioForm {
  nome: string;
  tipo: string;
  matricula?: string; // Agora opcional
  imo?: string;
  mmsi?: string;
  callSign?: string;
  bandeira: string; // Obrigatório
  comprimento?: number;
  largura?: number;
  calado?: number;
  capacidade?: number;
  anoConstrucao?: number;
  status: string;
  dataInspecao?: string;
  dataProximaInspecao?: string;
  clienteId?: string;
  proprietarioId?: string;
}

export interface JangadaForm {
  numeroSerie: string;
  marca?: string;
  modelo?: string;
  tipo: string;
  capacidade?: number;
  tipoPack?: string;
  itensTipoPack?: string;
  componentesSelecionados?: Record<string, string | { incluido: boolean; quantidade?: number; validade?: string; referencia?: string; pilhas?: number }>;
  validadeComponentes?: Record<string, string>;
  dataFabricacao?: string;
  dataInspecao?: string;
  dataProximaInspecao?: string;
  status: 'ativo' | 'manutencao' | 'inativo';
  navioId?: string;
  proprietarioId?: string;
  // Campos adicionais solicitados
  lotacao?: number;
  hru?: string;
  tubosAltaPressao?: number;
  validadeTubosAltaPressao?: string;
  valvulasAlivio?: number;
  validadeValvulasAlivio?: string;
  cabecasDisparo?: number;
  validadeCabecasDisparo?: string;
  valvulasInsuflacao?: number;
  bateriaLitio?: number;
  luzExterior?: number;
  // Campos do cilindro
  cilindroNumeroSerie?: string;
  cilindroTipo?: string;
  cilindroSistema?: string;
  tipoValvula?: string;
  cilindroCapacidade?: number;
  cilindroTara?: number;
  cilindroPesoBruto?: number;
  cilindroQuantidadeCO2?: number;
  cilindroQuantidadeN2?: number;
  cilindroTesteHidraulico?: Date;
  cilindroProximoTesteHidraulico?: Date;
  cilindroValidade?: string;
  // Campos de stock selecionado
  fachoDeMaoStockId?: string;
  paraquedasStockId?: string;
  aguaPotavelStockId?: string;
  racoesEmergenciaStockId?: string;
  comprimidosStockId?: string;
  outrosComponentesStockId?: string;
}

export interface StockForm {
  nome: string;
  descricao?: string;
  categoria: string;
  referenciaOrey?: string;
  referenciaFabricante?: string;
  lote?: string;
  validade?: Date;
  quantidade: number;
  quantidadeMinima: number;
  precoCompra?: number;
  precoVenda?: number;
  precoUnitario?: number; // manter para compatibilidade
  fornecedor?: string;
  localizacao?: string;
  foto?: string;
  status: string;
  descontinuado?: boolean; // Indica se o item foi descontinuado por boletim
}

export interface CilindroForm {
  numeroSerie: string;
  tipo: string;
  capacidade?: number;
  dataFabricacao?: Date;
  dataTeste?: Date;
  dataProximoTeste?: Date;
  status: string;
  pressaoTrabalho?: number;
  pressaoTeste?: number;
}

// Dashboard stats
export interface DashboardStats {
  jangadas: {
    total: number;
    ativas: number;
    manutencao: number;
    expirando: number;
  };
  navios: {
    total: number;
    ativas: number;
    manutencao: number;
    expirando: number;
  };
  clientes: {
    total: number;
    ativos: number;
    novosMes: number;
  };
  stock: {
    valorTotal: number;
    itensBaixo: number;
    itensEsgotados: number;
  };
  cilindros: {
    total: number;
    expirando: number;
    defeituosos: number;
  };
  agenda: {
    hoje: number;
    semana: number;
    mes: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter types
export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ClienteFilters extends BaseFilters {
  status?: string;
}

export interface ProprietarioFilters extends BaseFilters {
  status?: string;
}

export interface NavioFilters extends BaseFilters {
  status?: string;
  tipo?: string;
  clienteId?: string;
}

export interface JangadaFilters extends BaseFilters {
  status?: string;
  tipo?: string;
  clienteId?: string;
}

export interface StockFilters extends BaseFilters {
  categoria?: string;
  status?: string;
  fornecedor?: string;
}

export interface CilindroFilters extends BaseFilters {
  status?: string;
  tipo?: string;
  sistema?: string;
}

export interface AgendamentoFilters extends BaseFilters {
  status?: string;
  tipo?: string;
  dataInicio?: Date;
  dataFim?: Date;
}