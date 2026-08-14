export const CLIENTE_PAYMENT_MODE_OPTIONS = [
  'Pronto Pagamento',
  'Crédito 30 dias',
  'Crédito 60 dias',
  'Crédito 90 dias',
  'Transferência Bancária',
] as const;

export type ClientePaymentModeOption = (typeof CLIENTE_PAYMENT_MODE_OPTIONS)[number];
