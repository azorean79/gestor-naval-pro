import { z } from 'zod';

// Esquemas de validação para Jangadas
export const jangadaSchema = z.object({
  numeroReferencia: z.string().min(1, 'Número de referência é obrigatório').max(50, 'Número de referência deve ter no máximo 50 caracteres').optional(),
  numeroSerie: z.string()
    .min(1, 'Número de série é obrigatório')
    .max(50, 'Número de série deve ter no máximo 50 caracteres')
    .regex(/^[A-Z0-9\-_]+$/, 'Número de série deve conter apenas letras maiúsculas, números, hífen e underscore'),

  marca: z.string()
    .min(1, 'Marca é obrigatória')
    .max(100, 'Marca deve ter no máximo 100 caracteres'),

  modelo: z.string()
    .min(1, 'Modelo é obrigatório')
    .max(100, 'Modelo deve ter no máximo 100 caracteres'),

  lotacao: z.number()
    .int('Lotação deve ser um número inteiro')
    .min(1, 'Lotação deve ser pelo menos 1')
    .max(1000, 'Lotação deve ser no máximo 1000'),

  tipoPack: z.string()
    .min(1, 'Tipo de pack é obrigatório')
    .max(50, 'Tipo de pack deve ter no máximo 50 caracteres'),

  dataFabrico: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((date) => {
      const d = new Date(date);
      return d <= new Date();
    }, 'Data de fabrico não pode ser no futuro'),

  estadoAtual: z.enum([
    'Em Stock',
    'Recebido',
    'Aguarda Inspeção',
    'Em Inspeção',
    'Aguarda Aprovação Técnica',
    'Reprovada',
    'Inspecionada',
    'Pronta a Enviar',
    'Aguarda Instruções',
    'Instalada',
    'Abatido',
    'Agendada',
    'Em Transito'
  ]),

  delegacao: z.enum([
    'Açores',
    'Norte',
    'Lisboa',
    'Algarve',
    'Todas'
  ]),

  navioId: z.string().optional(),
  navioNome: z.string().optional(),
  proprietarioNome: z.string().optional(),
  proximaInspecao: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional()
    .nullable(),

  modeloContentor: z.string().max(100, 'Modelo do contentor deve ter no máximo 100 caracteres').optional(),
  obraId: z.string().optional(),
  dataEntregaSolicitada: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional()
    .nullable(),

  historicoInspeccao: z.array(z.any()).optional(), // Será tipado adequadamente depois
});

export const jangadaCreateSchema = z.object({
    numeroReferencia: z.string().min(1, 'Número de referência é obrigatório').optional(),
  numeroSerie: z.string().min(1, 'Número de série é obrigatório'),
  marca: z.string().min(1, 'Marca é obrigatória'),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  lotacao: z.number().min(1, 'Lotação deve ser maior que 0'),
  tipoPack: z.string().min(1, 'Tipo de pack é obrigatório'),
  dataFabrico: z.string().min(1, 'Data de fabrico é obrigatória'),
  estadoAtual: z.enum(['Em Stock', 'Recebido', 'Aguarda Inspeção', 'Em Inspeção', 'Aguarda Aprovação Técnica', 'Reprovada', 'Inspecionada', 'Pronta a Enviar', 'Aguarda Instruções', 'Instalada', 'Abatido', 'Agendada', 'Em Transito']),
  delegacao: z.enum(['Açores', 'Norte', 'Lisboa', 'Algarve', 'Todas']),
  navioId: z.string().optional(),
  navioNome: z.string().optional(),
  proprietarioNome: z.string().optional(),
  dataEntregaSolicitada: z.string().optional(),
  proximaInspecao: z.string().optional(),
  modeloContentor: z.string().optional(),
  obraId: z.string().optional(),
});

export const jangadaUpdateSchema = z.object({
  numeroReferencia: z.string().min(1, 'Número de referência é obrigatório').optional(),
  numeroSerie: z.string().min(1, 'Número de série é obrigatório').optional(),
  marca: z.string().min(1, 'Marca é obrigatória').optional(),
  modelo: z.string().min(1, 'Modelo é obrigatório').optional(),
  lotacao: z.number().min(1, 'Lotação deve ser maior que 0').optional(),
  tipoPack: z.string().min(1, 'Tipo de pack é obrigatório').optional(),
  dataFabrico: z.string().min(1, 'Data de fabrico é obrigatória').optional(),
  estadoAtual: z.enum(['Em Stock', 'Recebido', 'Aguarda Inspeção', 'Em Inspeção', 'Aguarda Aprovação Técnica', 'Reprovada', 'Inspecionada', 'Pronta a Enviar', 'Aguarda Instruções', 'Instalada', 'Abatido', 'Agendada', 'Em Transito']).optional(),
  delegacao: z.enum(['Açores', 'Norte', 'Lisboa', 'Algarve', 'Todas']).optional(),
  navioId: z.string().optional(),
  navioNome: z.string().optional(),
  proprietarioNome: z.string().optional(),
  dataEntregaSolicitada: z.string().optional(),
  proximaInspecao: z.string().optional(),
  modeloContentor: z.string().optional(),
  obraId: z.string().optional(),
  historicoInspeccao: z.array(z.any()).optional(),
});

// Esquemas de validação para Navios
export const navioSchema = z.object({
  numeroReferencia: z.string().min(1, 'Número de referência é obrigatório').max(50, 'Número de referência deve ter no máximo 50 caracteres').optional(),
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),

  clienteId: z.string().optional(),
  proprietarioNome: z.string().optional(),

  tipo: z.string()
    .min(1, 'Tipo é obrigatório')
    .max(100, 'Tipo deve ter no máximo 100 caracteres'),

  // ...campo portoRegisto removido

  delegacao: z.string()
    .min(1, 'Delegação é obrigatória')
    .max(50, 'Delegação deve ter no máximo 50 caracteres'),

  classe: z.string()
    .max(50, 'Classe deve ter no máximo 50 caracteres')
    .optional(),

  lotacao: z.number()
    .int('Lotação deve ser um número inteiro')
    .min(1, 'Lotação deve ser pelo menos 1')
    .max(10000, 'Lotação deve ser no máximo 10000')
    .optional(),

  matricula: z.string()
    .max(50, 'Matrícula deve ter no máximo 50 caracteres')
    .optional(),

  comprimento: z.number()
    .positive('Comprimento deve ser positivo')
    .max(1000, 'Comprimento deve ser no máximo 1000 metros')
    .optional(),

  largura: z.number()
    .positive('Largura deve ser positiva')
    .max(500, 'Largura deve ser no máximo 500 metros')
    .optional(),

  calado: z.number()
    .positive('Calado deve ser positivo')
    .max(100, 'Calado deve ser no máximo 100 metros')
    .optional(),

  arqueacaoBruta: z.number()
    .positive('Arqueação bruta deve ser positiva')
    .max(1000000, 'Arqueação bruta deve ser no máximo 1.000.000')
    .optional(),

  arqueacaoLiquida: z.number()
    .positive('Arqueação líquida deve ser positiva')
    .max(1000000, 'Arqueação líquida deve ser no máximo 1.000.000')
    .optional(),

  anoConstrucao: z.number()
    .int('Ano de construção deve ser um número inteiro')
    .min(1800, 'Ano de construção deve ser pelo menos 1800')
    .max(new Date().getFullYear() + 2, 'Ano de construção não pode ser muito no futuro')
    .optional(),

  portoAtual: z.string()
    .max(100, 'Porto atual deve ter no máximo 100 caracteres')
    .optional(),

  status: z.enum([
    'Ativo',
    'Em Manutenção',
    'Inativo'
  ]).optional(),

  proprietarioId: z.string().optional(),
  numeroSerie: z.string().optional(),
  proximaInspecao: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),

  estado: z.string().optional(),
  bandeira: z.string()
    .max(100, 'Bandeira deve ter no máximo 100 caracteres')
    .optional(),
});

export const navioCreateSchema = z.object({
    numeroReferencia: z.string().min(1, 'Número de referência é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  proprietarioNome: z.string().min(1, 'Proprietário é obrigatório'),
  tipo: z.enum(['Pesca Local', 'Pesca Costeira', 'Recreio', 'Marítimo-Turística', 'Outro']),
  // ...campo portoRegisto removido
  delegacao: z.enum(['Açores', 'Norte', 'Lisboa', 'Algarve', 'Todas']),
  classe: z.enum(['Classe A (até 6m)', 'Classe B (6-12m)', 'Classe C (12-24m)', 'Classe D (acima de 24m)']).optional(),
  lotacao: z.number().min(1, 'Lotação deve ser maior que 0').optional(),
  jangadasIds: z.array(z.string()).optional(),
});

export const navioUpdateSchema = z.object({
    numeroReferencia: z.string().min(1, 'Número de referência é obrigatório').optional(),
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  clienteId: z.string().min(1, 'Cliente é obrigatório').optional(),
  proprietarioNome: z.string().min(1, 'Proprietário é obrigatório').optional(),
  tipo: z.enum(['Pesca Local', 'Pesca Costeira', 'Recreio', 'Marítimo-Turística', 'Outro']).optional(),
  // ...campo portoRegisto removido
  delegacao: z.enum(['Açores', 'Norte', 'Lisboa', 'Algarve', 'Todas']).optional(),
  classe: z.enum(['Classe A (até 6m)', 'Classe B (6-12m)', 'Classe C (12-24m)', 'Classe D (acima de 24m)']).optional(),
  lotacao: z.number().min(1, 'Lotação deve ser maior que 0').optional(),
  jangadasIds: z.array(z.string()).optional(),
});

// Esquemas de validação para Clientes
export const clienteSchema = z.object({
    numeroReferencia: z.string().min(1, 'Número de referência é obrigatório').max(50, 'Número de referência deve ter no máximo 50 caracteres'),
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),

  nif: z.string()
    .regex(/^\d{9}$/, 'NIF deve ter exatamente 9 dígitos')
    .optional()
    .or(z.literal('')),

  email: z.string()
    .email('Email deve ser válido')
    .max(200, 'Email deve ter no máximo 200 caracteres')
    .optional()
    .or(z.literal('')),

  contacto: z.string()
    .regex(/^(\+351\s?)?[0-9\s\-\(\)]+$/, 'Contacto deve ser um número de telefone válido')
    .max(50, 'Contacto deve ter no máximo 50 caracteres')
    .optional()
    .or(z.literal('')),

  morada: z.string()
    .max(500, 'Morada deve ter no máximo 500 caracteres')
    .optional(),

  sector: z.enum([
    'Marítimo-Turística',
    'Recreio',
    'Outro'
  ]).optional(),

  ilha: z.string()
    .max(50, 'Ilha deve ter no máximo 50 caracteres')
    .optional(),

  concelho: z.string()
    .max(50, 'Concelho deve ter no máximo 50 caracteres')
    .optional(),
});

export const clienteCreateSchema = z.object({
    numeroReferencia: z.string().min(1, 'Número de referência é obrigatório'),
  numero: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  morada: z.string().optional(),
  contacto: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  nif: z.string().optional(),
  sector: z.enum(['Marítimo-Turística', 'Recreio', 'Outro']).optional(),
  condicaoPagamento: z.enum(['Pronto Pagamento', 'Crédito a 30 dias', 'Não Definido']).optional(),
  observacoes: z.string().optional(),
  saldoDevedor: z.number().optional(),
  delegacao: z.enum(['Açores', 'Norte', 'Lisboa', 'Algarve', 'Todas']),
  ilha: z.string().max(50, 'Ilha deve ter no máximo 50 caracteres').optional(),
  concelho: z.string().max(50, 'Concelho deve ter no máximo 50 caracteres').optional(),
});

export const clienteUpdateSchema = z.object({
    numeroReferencia: z.string().min(1, 'Número de referência é obrigatório').optional(),
  
  numero: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  morada: z.string().optional(),
  contacto: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  nif: z.string().optional(),
  sector: z.enum(['Marítimo-Turística', 'Recreio', 'Outro']).optional(),
  condicaoPagamento: z.enum(['Pronto Pagamento', 'Crédito a 30 dias', 'Não Definido']).optional(),
  observacoes: z.string().optional(),
  saldoDevedor: z.number().optional(),
  delegacao: z.enum(['Açores', 'Norte', 'Lisboa', 'Algarve', 'Todas']).optional(),
  ilha: z.string().max(50, 'Ilha deve ter no máximo 50 caracteres').optional(),
  concelho: z.string().max(50, 'Concelho deve ter no máximo 50 caracteres').optional(),
});

// Esquema de validação para ItemStock (definido em separado)
export const itemStockSchema = z.object({
  numeroReferencia: z.string().min(1, 'Número de referência é obrigatório').max(50, 'Número de referência deve ter no máximo 50 caracteres'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  descricao: z.string().optional(),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  quantidadeAtual: z.number().min(0, 'Quantidade atual deve ser não negativa'),
  quantidadeMinima: z.number().min(0, 'Quantidade mínima deve ser não negativa'),
  quantidadeMaxima: z.number().min(0, 'Quantidade máxima deve ser não negativa').optional(),
  precoUnitario: z.number().min(0, 'Preço unitário deve ser não negativo').optional(),
  precoCompra: z.number().min(0, 'Preço de compra deve ser não negativo').optional(),
  precoVenda: z.number().min(0, 'Preço de venda deve ser não negativo').optional(),
  codigoFabricante: z.string().optional(),
  stockMinimo: z.number().min(0, 'Stock mínimo deve ser não negativo').optional(),
  quantidade: z.number().min(0, 'Quantidade deve ser não negativa').optional(),
  fornecedor: z.string().optional(),
  localizacao: z.string().optional(),
  status: z.enum(['disponivel', 'baixo', 'esgotado']),
  dataUltimaEntrada: z.string().optional(),
  dataUltimaSaida: z.string().optional(),
  observacoes: z.string().optional(),
});

// Esquemas de validação para Certificados
export const certificadoSchema = z.object({
  numero: z.string()
    .min(1, 'Número é obrigatório')
    .max(100, 'Número deve ter no máximo 100 caracteres'),

  tipo: z.string()
    .min(1, 'Tipo é obrigatório')
    .max(100, 'Tipo deve ter no máximo 100 caracteres'),

  navioId: z.string().optional(),
  dataEmissao: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),

  dataValidade: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),

  certificadoUrl: z.string().url('URL do certificado deve ser válida').optional().or(z.literal('')),
});

export const certificadoCreateSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório').max(100, 'Número deve ter no máximo 100 caracteres'),
  tipo: z.string().min(1, 'Tipo é obrigatório').max(100, 'Tipo deve ter no máximo 100 caracteres'),
  navioId: z.string().optional(),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional().or(z.literal('')),
  dataValidade: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional().or(z.literal('')),
  certificadoUrl: z.string().url('URL do certificado deve ser válida').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.dataValidade && data.dataEmissao) {
    if (new Date(data.dataValidade) <= new Date(data.dataEmissao)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data de validade deve ser posterior à data de emissão',
        path: ['dataValidade'],
      });
    }
  }
});

export const certificadoUpdateSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório').max(100, 'Número deve ter no máximo 100 caracteres').optional(),
  tipo: z.string().min(1, 'Tipo é obrigatório').max(100, 'Tipo deve ter no máximo 100 caracteres').optional(),
  navioId: z.string().optional(),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional().or(z.literal('')),
  dataValidade: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional().or(z.literal('')),
  certificadoUrl: z.string().url('URL do certificado deve ser válida').optional().or(z.literal('')),
});

// Esquemas de validação para Ordens de Serviço
export const ordemServicoSchema = z.object({
  numero: z.string()
    .min(1, 'Número é obrigatório')
    .max(50, 'Número deve ter no máximo 50 caracteres'),

  data: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),

  clienteId: z.string()
    .min(1, 'Cliente é obrigatório'),

  clienteNome: z.string()
    .min(1, 'Nome do cliente é obrigatório'),

  jangadaIds: z.array(z.string())
    .min(1, 'Pelo menos uma jangada deve ser selecionada'),

  estado: z.enum([
    'Aprovado',
    'Pendente',
    'Enviado',
    'Rejeitado'
  ]),

  isentoIva: z.boolean(),
  motivoIsencaoIva: z.string().optional(),
  observacoes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),

  items: z.array(z.object({
    ref: z.string().min(1, 'Referência é obrigatória'),
    designacao: z.string().min(1, 'Designação é obrigatória'),
    quantidade: z.number().int().positive('Quantidade deve ser positiva'),
    precoUnitario: z.number().positive('Preço unitário deve ser positivo'),
    desconto: z.number().min(0).max(100, 'Desconto deve ser entre 0 e 100'),
    itemDescription: z.string().min(1, 'Descrição é obrigatória'),
  })).min(1, 'Pelo menos um item deve ser adicionado'),

  descontoGlobal: z.number().min(0).max(100, 'Desconto global deve ser entre 0 e 100'),
  subtotal: z.number().positive('Subtotal deve ser positivo'),
  valorIva: z.number().min(0, 'IVA deve ser não negativo'),
  total: z.number().positive('Total deve ser positivo'),

  faturaId: z.string().optional(),
  numeroUltimaObra: z.string().optional(),
});

export const ordemServicoCreateSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  clienteNome: z.string().min(1, 'Nome do cliente é obrigatório'),
  jangadaIds: z.array(z.string()).min(1, 'Pelo menos uma jangada deve ser selecionada'),
  estado: z.enum(['Aprovado', 'Pendente', 'Enviado', 'Rejeitado']),
  isentoIva: z.boolean(),
  motivoIsencaoIva: z.string().optional(),
  observacoes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
  items: z.array(z.object({
    ref: z.string().min(1, 'Referência é obrigatória'),
    designacao: z.string().min(1, 'Designação é obrigatória'),
    quantidade: z.number().int().positive('Quantidade deve ser positiva'),
    precoUnitario: z.number().positive('Preço unitário deve ser positivo'),
    desconto: z.number().min(0).max(100, 'Desconto deve ser entre 0 e 100'),
    itemDescription: z.string().min(1, 'Descrição é obrigatória'),
  })).min(1, 'Pelo menos um item deve ser adicionado'),
  descontoGlobal: z.number().min(0).max(100, 'Desconto global deve ser entre 0 e 100'),
  subtotal: z.number().positive('Subtotal deve ser positivo'),
  valorIva: z.number().min(0, 'IVA deve ser não negativo'),
  total: z.number().positive('Total deve ser positivo'),
  faturaId: z.string().optional(),
  numeroUltimaObra: z.string().optional(),
});

export const ordemServicoUpdateSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório').optional(),
  data: z.string().min(1, 'Data é obrigatória').optional(),
  clienteId: z.string().min(1, 'Cliente é obrigatório').optional(),
  clienteNome: z.string().min(1, 'Nome do cliente é obrigatório').optional(),
  jangadaIds: z.array(z.string()).min(1, 'Pelo menos uma jangada deve ser selecionada').optional(),
  estado: z.enum(['Aprovado', 'Pendente', 'Enviado', 'Rejeitado']).optional(),
  isentoIva: z.boolean().optional(),
  motivoIsencaoIva: z.string().optional(),
  observacoes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
  items: z.array(z.object({
    ref: z.string().min(1, 'Referência é obrigatória'),
    designacao: z.string().min(1, 'Designação é obrigatória'),
    quantidade: z.number().int().positive('Quantidade deve ser positiva'),
    precoUnitario: z.number().positive('Preço unitário deve ser positivo'),
    desconto: z.number().min(0).max(100, 'Desconto deve ser entre 0 e 100'),
    itemDescription: z.string().min(1, 'Descrição é obrigatória'),
  })).min(1, 'Pelo menos um item deve ser adicionado').optional(),
  descontoGlobal: z.number().min(0).max(100, 'Desconto global deve ser entre 0 e 100').optional(),
  subtotal: z.number().positive('Subtotal deve ser positivo').optional(),
  valorIva: z.number().min(0, 'IVA deve ser não negativo').optional(),
  total: z.number().positive('Total deve ser positivo').optional(),
  faturaId: z.string().optional(),
  numeroUltimaObra: z.string().optional(),
});

// Esquemas de validação para Usuários
export const userSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  email: z.string()
    .email('Email deve ser válido')
    .max(200, 'Email deve ter no máximo 200 caracteres'),

  roles: z.array(z.enum([
    'Administrador',
    'Diretor',
    'Comercial',
    'Administrativo',
    'Técnico Principal',
    'Técnico Certificado',
    'Técnico',
    'Logística',
    'Responsavel de Armazem',
    'Cliente',
    'Pendente'
  ])).min(1, 'Pelo menos um role deve ser selecionado'),

  localizacao: z.enum([
    'Açores',
    'Norte',
    'Lisboa',
    'Algarve',
    'Todas'
  ]),

  proprietarioId: z.string().optional(),
});

export const userCreateSchema = userSchema;

export const userUpdateSchema = userSchema.partial();

// Esquemas de validação para Faturas
export const faturaCreateSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  total: z.number().positive('Total deve ser positivo'),
  estado: z.enum(['POR PAGAR', 'PAGA', 'VENCIDA', 'ANULADA']),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  totalPago: z.number().min(0, 'Total pago deve ser não negativo'),
});

export const faturaUpdateSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório').optional(),
  data: z.string().min(1, 'Data é obrigatória').optional(),
  cliente: z.string().min(1, 'Cliente é obrigatório').optional(),
  total: z.number().positive('Total deve ser positivo').optional(),
  estado: z.enum(['POR PAGAR', 'PAGA', 'VENCIDA', 'ANULADA']).optional(),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória').optional(),
  totalPago: z.number().min(0, 'Total pago deve ser não negativo').optional(),
});

// Tipos inferidos
export type JangadaInput = z.infer<typeof jangadaCreateSchema>;
export type JangadaUpdate = z.infer<typeof jangadaUpdateSchema>;
export type NavioInput = z.infer<typeof navioCreateSchema>;
export type NavioUpdate = z.infer<typeof navioUpdateSchema>;
export type ClienteInput = z.infer<typeof clienteCreateSchema>;
export type ClienteUpdate = z.infer<typeof clienteUpdateSchema>;
export type CertificadoInput = z.infer<typeof certificadoCreateSchema>;
export type CertificadoUpdate = z.infer<typeof certificadoUpdateSchema>;
export type OrdemServicoInput = z.infer<typeof ordemServicoCreateSchema>;
export type OrdemServicoUpdate = z.infer<typeof ordemServicoUpdateSchema>;
export type UserInput = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type FaturaInput = z.infer<typeof faturaCreateSchema>;
export type FaturaUpdate = z.infer<typeof faturaUpdateSchema>;