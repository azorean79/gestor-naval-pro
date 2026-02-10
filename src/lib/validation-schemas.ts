import { z } from 'zod';

// Função para verificar se número de série já existe
export async function verificarNumeroSerieUnico(numeroSerie: string, excludeId?: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.append('numeroSerie', numeroSerie);
    if (excludeId) {
      params.append('excludeId', excludeId);
    }
    
    const response = await fetch(`/api/jangadas/verificar-numero-serie?${params}`);
    if (!response.ok) return false;
    
    const result = await response.json();
    return result.disponivel;
  } catch {
    return false;
  }
}

// Schema com validação assíncrona para número de série único
export const numeroSerieSchema = z.string()
  .min(1, 'Número de série é obrigatório')
  .refine(async (numeroSerie) => {
    return await verificarNumeroSerieUnico(numeroSerie);
  }, 'Este número de série já está em uso');

// Jangada validation schema - SIMPLIFICADO

// Cliente validation schema
export const clienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  nif: z.string().optional(),
});

// Proprietario validation schema
export const proprietarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  nif: z.string().optional(),
});

// Navio validation schema - SIMPLIFICADO
export const navioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.string(),
  matricula: z.string().optional(), // Agora opcional
  imo: z.string().optional(),
  mmsi: z.string().optional(),
  callSign: z.string().optional(),
  bandeira: z.string().min(1, 'Bandeira é obrigatória'), // Obrigatório
  comprimento: z.number().positive().optional(),
  largura: z.number().positive().optional(),
  calado: z.number().positive().optional(),
  capacidade: z.number().positive().optional(),
  status: z.enum(['ativo', 'manutencao', 'inativo']),
  dataInspecao: z.string().optional(),
  dataProximaInspecao: z.string().optional(),
  clienteId: z.string().optional(),
  proprietarioId: z.string().optional(),
});

// Jangada validation schema - SIMPLIFICADO
export const jangadaSchema = z.object({
  numeroSerie: numeroSerieSchema,
  marcaId: z.string().min(1, 'Marca é obrigatória'),
  modeloId: z.string(),
  tipo: z.string(),
  navioId: z.string(),
  status: z.enum(['ativo', 'manutencao', 'inativo']),
  // Informações técnicas - accept both Date and string
  dataFabricacao: z.union([z.date(), z.string()]).optional(),
  dataInspecao: z.union([z.date(), z.string()]).optional(),
  dataProximaInspecao: z.union([z.date(), z.string()]).optional(),
  capacidade: z.number().int().positive('Capacidade deve ser positiva').optional(),
  peso: z.number().positive('Peso deve ser positivo').optional(),
  dimensoes: z.string().optional(),
  numeroAprovacao: z.string().optional(),
  // Dados do cilindro (apenas o necessário para inspeção)
  cilindroNumeroSerie: z.string().optional(),
  cilindroTipo: z.string().optional(), // CO2, N2, ou misto
  cilindroSistema: z.string().optional(), // Sistema do cilindro
});

// Stock validation schema
export const stockSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  referenciaOrey: z.string().optional(),
  referenciaFabricante: z.string().optional(),
  lote: z.string().optional(),
  validade: z.date().optional(),
  quantidade: z.number().int().min(0, 'Quantidade não pode ser negativa'),
  quantidadeMinima: z.number().int().min(0, 'Quantidade mínima não pode ser negativa'),
  precoCompra: z.number().positive('Preço de compra deve ser positivo').optional(),
  precoVenda: z.number().positive('Preço de venda deve ser positivo').optional(),
  precoUnitario: z.number().positive('Preço deve ser positivo').optional(), // manter para compatibilidade
  fornecedor: z.string().optional(),
  localizacao: z.string().optional(),
  foto: z.string().optional().refine(
    (val) => !val || val.startsWith('/uploads/') || val.startsWith('http'),
    'URL da foto inválida'
  ),
  imagem: z.string().optional().refine(
    (val) => !val || val.startsWith('/uploads/') || val.startsWith('http'),
    'URL da imagem inválida'
  ),
  status: z.enum(['ativo', 'inativo']),
});

// Cilindro validation schema
export const cilindroSchema = z.object({
  numeroSerie: z.string().min(1, 'Número de série é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  sistema: z.string().optional(),
  capacidade: z.number().positive('Capacidade deve ser positiva').optional(),
  tara: z.number().positive('Tara deve ser positiva').optional(),
  pesoBruto: z.number().positive('Peso bruto deve ser positivo').optional(),
  quantidadeCO2: z.number().min(0, 'Quantidade de CO2 não pode ser negativa').optional(),
  quantidadeN2: z.number().min(0, 'Quantidade de N2 não pode ser negativa').optional(),
  testeHidraulico: z.date().optional(),
  proximoTesteHidraulico: z.date().optional(),
  dataFabricacao: z.date().optional(),
  dataTeste: z.date().optional(),
  dataProximoTeste: z.date().optional(),
  status: z.enum(['ativo', 'defeituoso', 'expirado']),
  pressaoTrabalho: z.number().positive('Pressão deve ser positiva').optional(),
  pressaoTeste: z.number().positive('Pressão de teste deve ser positiva').optional(),
});

// Agendamento validation schema
export const agendamentoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  dataInicio: z.date(),
  dataFim: z.date(),
  tipo: z.enum(['inspecao', 'manutencao', 'teste', 'reuniao']),
  status: z.enum(['agendado', 'confirmado', 'realizado', 'cancelado']),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']),
  navioId: z.string().optional(),
  jangadaId: z.string().optional(),
  cilindroId: z.string().optional(),
  pessoaId: z.string().optional(),
  responsavel: z.string().optional(),
});

// Fatura validation schema
export const faturaSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  dataEmissao: z.date(),
  dataVencimento: z.date(),
  valor: z.number().positive('Valor deve ser positivo'),
  status: z.enum(['pendente', 'paga', 'atrasada', 'cancelada']),
  descricao: z.string().optional(),
  clienteId: z.string().optional(),
  navioId: z.string().optional(),
  jangadaId: z.string().optional(),
});

// Filter validation schemas
export const baseFiltersSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const clienteFiltersSchema = baseFiltersSchema.extend({
  status: z.string().optional(),
});

export const navioFiltersSchema = baseFiltersSchema.extend({
  status: z.string().optional(),
  tipo: z.string().optional(),
  clienteId: z.string().optional(),
});

export const jangadaFiltersSchema = baseFiltersSchema.extend({
  status: z.string().optional(),
  tipo: z.string().optional(),
  clienteId: z.string().optional(),
});

export const stockFiltersSchema = baseFiltersSchema.extend({
  categoria: z.string().optional(),
  status: z.string().optional(),
  fornecedor: z.string().optional(),
});

export const cilindroFiltersSchema = baseFiltersSchema.extend({
  status: z.string().optional(),
  tipo: z.string().optional(),
});

export const agendamentoFiltersSchema = baseFiltersSchema.extend({
  status: z.string().optional(),
  tipo: z.string().optional(),
  dataInicio: z.date().optional(),
  dataFim: z.date().optional(),
});

// Type exports
export type ClienteForm = z.infer<typeof clienteSchema>;
export type NavioForm = z.infer<typeof navioSchema>;
export type JangadaForm = z.infer<typeof jangadaSchema>;
export type StockForm = z.infer<typeof stockSchema>;
export type CilindroForm = z.infer<typeof cilindroSchema>;
export type AgendamentoForm = z.infer<typeof agendamentoSchema>;
export type FaturaForm = z.infer<typeof faturaSchema>;

export type ClienteFilters = z.infer<typeof clienteFiltersSchema>;
export type NavioFilters = z.infer<typeof navioFiltersSchema>;
export type JangadaFilters = z.infer<typeof jangadaFiltersSchema>;
export type StockFilters = z.infer<typeof stockFiltersSchema>;
export type CilindroFilters = z.infer<typeof cilindroFiltersSchema>;
export type AgendamentoFilters = z.infer<typeof agendamentoFiltersSchema>;