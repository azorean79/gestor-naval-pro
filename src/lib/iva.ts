import { APP_CONFIG } from "@/lib/app-config";

export const getIvaRate = (): number => Number(APP_CONFIG.ivaRate) || 0.16;

export const round2 = (value: number): number => Math.round((Number(value) || 0) * 100) / 100;

export const calcSubtotal = (valorPecas: number, maoDeObra: number, desconto: number): number =>
  Math.max(0, (Number(valorPecas) || 0) + (Number(maoDeObra) || 0) - (Number(desconto) || 0));

export const calcIva = (subtotal: number, isIsentoIva: boolean): number =>
  isIsentoIva ? 0 : subtotal * getIvaRate();

export const calcTotal = (valorPecas: number, maoDeObra: number, desconto: number, isIsentoIva: boolean): number =>
  round2(calcSubtotal(valorPecas, maoDeObra, desconto) + calcIva(calcSubtotal(valorPecas, maoDeObra, desconto), isIsentoIva));
