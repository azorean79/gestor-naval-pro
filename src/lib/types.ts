// src/lib/types.ts

// ========== TIPOS BASE ==========
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========== JANGADAS ==========
export interface Jangada extends BaseEntity {
  numeroReferencia: string;
  numero: string;
  nome: string;
  proprietario: string;
  numeroSerie?: string;
  marca?: string;
  modelo?: string;
  lotacao?: number;
  dataFabricacao?: Date;
  cilindro?: string;
  tipoPack?: string;
  tipoPesca?: string;
  zonaPesca?: string;
  status: 'ativo' | 'inativo' | 'manutencao';
  ultimaInspecao?: Date;
  proximaInspecao?: Date;
  observacoes?: string;
  documentos: Documento[];
}

export interface Documento {
  id: string;
  tipo: 'licenca' | 'seguro' | 'certificado' | 'outro';
  numero: string;
  emissor: string;
  dataEmissao: Date;
  dataValidade: Date;
  arquivo?: string; // URL do arquivo no Firebase Storage
}

// ========== NAVIOS ==========
export interface Navio extends BaseEntity {
  numeroReferencia: string;
  nome: string;
  imo: string;
  mmsi: string;
  matricula: string;
  bandeira: string;
  tipo: string;
  comprimento: number;
  largura: number;
  calado: number;
  capacidade: number; // em toneladas
  proprietario: string;
  armador: string;
    // ...campo portoRegisto removido
  ultimaInspecao: Date;
  proximaInspecao: Date;
  certificados: Certificado[];
  equipamentos: Equipamento[];
  observacoes?: string;
}

export interface Certificado {
  id: string;
  tipo: string;
  numero: string;
  emissor: string;
  dataEmissao: Date;
  dataValidade: Date;
  status: 'valido' | 'expirando' | 'expirado';
}

export interface Equipamento {
  id: string;
  nome: string;
  tipo: string;
  fabricante: string;
  modelo: string;
  numeroSerie: string;
  dataInstalacao: Date;
    // ...campo portoRegisto removido
  ultimaManutencao?: Date;
  proximaManutencao?: Date;
}

// ========== CLIENTES ==========
export interface Cliente extends BaseEntity {
  numeroReferencia: string;
  nome: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  nif: string;
  email: string;
  telefone: string;
  morada: Morada;
  contactosEmergencia: ContactoEmergencia[];
  documentos: Documento[];
  status: 'ativo' | 'inativo' | 'suspenso';
  dataNascimento?: Date;
  profissao?: string;
  empresa?: string;
  observacoes?: string;
}

export interface Morada {
    // ...campo portoRegisto removido
  numero: string;
  complemento?: string;
  codigoPostal: string;
  localidade: string;
  concelho: string;
  distrito: string;
  pais: string;
}

export interface ContactoEmergencia {
  nome: string;
  parentesco: string;
  telefone: string;
  email?: string;
}

// ========== STOCK ==========
export interface ItemStock extends BaseEntity {
    precoCompra?: number;
    precoVenda?: number;
    codigoFabricante?: string;
  codigo?: string;
    stockMinimo?: number;
    quantidade?: number;
  numeroReferencia: string;
  nome: string;
  categoria: string;
  descricao: string;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  quantidadeMaxima: number;
  precoUnitario: number;
  fornecedor: string;
  localizacao: string;
  status: 'disponivel' | 'baixo' | 'esgotado';
  dataUltimaEntrada?: Date;
  dataUltimaSaida?: Date;
  observacoes?: string;
}

export interface MovimentacaoStock {
  id: string;
  itemId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  data: Date;
  responsavel: string;
  valorUnitario?: number;
  observacoes?: string;
}

// ========== CILINDROS ==========
export interface Cilindro extends BaseEntity {
  numeroSerie: string;
  pesoBruto?: number; // peso bruto em kg
  tara?: number; // tara em kg
  quantidadeCO2?: number; // quantidade de CO2 em kg
  quantidadeN2?: number; // quantidade de N2 em kg
  testeHidraulico?: Date; // data do último teste hidráulico
  proximoTesteHidraulico?: Date; // data do próximo teste hidráulico
  tipoSistemaInsuflacao?: string; // tipo de sistema de insuflação
  status: 'operacional' | 'manutencao' | 'defeituoso' | 'descartado';
  localizacao?: string;
  proprietario?: string;
  certificados: Certificado[];
  historicoInspecoes: InspecaoCilindro[];
  observacoes?: string;
  // Campos opcionais usados pela UI
  marca?: string;
  modelo?: string;
  dataValidade?: string;
  ultimaInspecao?: string;
  proximaInspecao?: string;
  dataFabricacao?: string;
}

export interface InspecaoCilindro {
  id: string;
  data: Date;
  tipo: 'periodica' | 'extraordinaria';
  resultado: 'aprovado' | 'reprovado';
  inspector: string;
  observacoes: string;
  proximaInspecao: Date;
}

// ========== AGENDA ==========
export interface Agendamento extends BaseEntity {
  titulo: string;
  descricao: string;
  tipo: 'inspecao' | 'manutencao' | 'reuniao' | 'treinamento' | 'outro';
  dataInicio: Date;
  dataFim: Date;
  local: string;
  responsavel: string;
  participantes: string[];
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  entidadeRelacionada?: {
    tipo: 'jangada' | 'navio' | 'cilindro' | 'cliente';
    id: string;
    nome: string;
  };
  lembretes: Lembrete[];
  observacoes?: string;
}

export interface Lembrete {
  id: string;
  data: Date;
  tipo: 'email' | 'sms' | 'notificacao';
  mensagem: string;
  enviado: boolean;
}

// ========== RELATÓRIOS ==========
export interface Relatorio {
  id: string;
  titulo: string;
  tipo: 'jangadas' | 'navios' | 'clientes' | 'stock' | 'cilindros' | 'agenda' | 'financeiro' | 'geral';
  periodo: {
    inicio: Date;
    fim: Date;
  };
  dados: Record<string, unknown>;
  geradoPor: string;
  dataGeracao: Date;
  formato: 'pdf' | 'excel' | 'json';
  arquivo?: string; // URL do arquivo no Firebase Storage
}

// ========== USUÁRIOS E AUTENTICAÇÃO ==========
export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'operador' | 'visualizador';
  permissoes: Permissao[];
  ativo: boolean;
  ultimoAcesso?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permissao {
  modulo: string;
  acoes: ('criar' | 'ler' | 'atualizar' | 'deletar')[];
}

// ========== BACKUP ==========
export interface Backup {
  id: string;
  nome: string;
  tipo: 'automatico' | 'manual';
  data: Date;
  tamanho: number; // em bytes
  status: 'em_andamento' | 'concluido' | 'falhou';
  localizacao: string; // URL do arquivo no Firebase Storage
  criadoPor: string;
  observacoes?: string;
}

// ========== CONFIGURAÇÕES ==========
export interface Configuracao {
  id: string;
  chave: string;
  valor: unknown;
  tipo: 'string' | 'number' | 'boolean' | 'object';
  descricao: string;
  categoria: string;
  editavel: boolean;
}

// ========== DASHBOARD ==========
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
    itensBaixo: number;
    itensEsgotados: number;
    valorTotal: number;
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

// ========== API RESPONSE TYPES ==========
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========== FORM TYPES ==========
export interface FormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
  isValid: boolean;
}

// ========== FILTER TYPES ==========
export interface FilterOptions {
  search?: string;
  status?: string;
  tipo?: string;
  dataInicio?: Date;
  dataFim?: Date;
  ordenacao?: {
    campo: string;
    direcao: 'asc' | 'desc';
  };
  pagina?: number;
  limite?: number;
}