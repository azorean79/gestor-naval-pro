import { normalizeText } from './text-normalization';

const THREE_YEAR_EXEMPT_BRANDS = ['RFD', 'DSB', 'ZODIAC'];

const THREE_YEAR_BY_MODEL: Record<string, number[]> = {
  RFD: [9650],
  DSB: [9650],
  ZODIAC: [9650],
};

function normalizeBrand(brand?: string | null): string {
  return normalizeText(brand).toUpperCase().trim();
}

function normalizeModel(model?: string | null): string {
  return normalizeText(model).trim();
}

export function isRecreio(brand?: string | null, model?: string | null, shipDetails?: any): boolean {
  if (shipDetails?.tipoEmbarcacao) {
    const tipo = String(shipDetails.tipoEmbarcacao).toLowerCase();
    if (tipo.includes('recreio') || tipo.includes('recreational') || tipo.includes('leisure')) {
      return true;
    }
  }

  const upperBrand = normalizeBrand(brand);
  const lowerModel = normalizeModel(model);

  if (upperBrand.includes('LALIZAS') && (lowerModel.includes('leisure') || lowerModel.includes('isoraft'))) {
    return true;
  }

  if (lowerModel.includes('recreio') || lowerModel.includes('recreational') || lowerModel.includes('leisure')) {
    return true;
  }

  if (lowerModel.includes('solas') || lowerModel.includes('commercial') || lowerModel.includes('offshore')) {
    return false;
  }

  return false;
}

export function getInspectionIntervalYears(
  brand?: string | null,
  model?: string | null,
  packType?: string | null,
  capacity?: number | null,
  shipDetails?: any
): number {
  const upperBrand = normalizeBrand(brand);
  const lowerModel = normalizeModel(model);
  const upperPack = normalizeText(packType).toUpperCase();

  const isDavit = upperPack.includes('DL') || upperPack.includes('DAVIT');

  if (isDavit) {
    return 1;
  }

  if (upperBrand.includes('EUROVINIL') && lowerModel.includes('easy')) {
    return 4;
  }

  if (shipDetails?.tipoEmbarcacao) {
    const tipo = String(shipDetails.tipoEmbarcacao).toLowerCase();
    if (tipo.includes('comercial') || tipo.includes('mercante') || tipo.includes('passageiros')) {
      return 1;
    }
  }

  if (isRecreio(brand, model, shipDetails)) {
    if (THREE_YEAR_EXEMPT_BRANDS.includes(upperBrand)) {
      if (lowerModel.includes('iso') || lowerModel.includes('9650')) {
        return 3;
      }
      return 1;
    }
    return 3;
  }

  if (lowerModel.includes('iso') || lowerModel.includes('9650')) {
    return 3;
  }

  if (THREE_YEAR_EXEMPT_BRANDS.includes(upperBrand)) {
    return 1;
  }

  return 3;
}

export function checkValidityWarning(
  validade: string | null | undefined,
  diasAlerta: number = 90
): { isWarning: boolean; isExpired: boolean; daysUntil: number | null; message: string } {
  if (!validade) {
    return { isWarning: false, isExpired: false, daysUntil: null, message: '' };
  }

  const date = new Date(validade);
  if (isNaN(date.getTime())) {
    return { isWarning: false, isExpired: false, daysUntil: null, message: '' };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = daysUntil < 0;
  const isWarning = daysUntil >= 0 && daysUntil <= diasAlerta;

  let message = '';
  if (isExpired) {
    message = `Expirado há ${Math.abs(daysUntil)} dia(s)`;
  } else if (isWarning) {
    message = `Expira em ${daysUntil} dia(s)`;
  } else {
    message = `Válido por mais ${daysUntil} dia(s)`;
  }

  return { isWarning, isExpired, daysUntil, message };
}

export function computeNextInspectionDate(
  inspecao: { dataProxInspecao?: string | null; dataInspecao: string },
  brand?: string,
  model?: string,
  packType?: string,
  capacity?: number,
  shipDetails?: any
): string | null {
  if (inspecao.dataProxInspecao) return inspecao.dataProxInspecao;

  const years = getInspectionIntervalYears(brand, model, packType, capacity, shipDetails);
  const d = new Date(inspecao.dataInspecao);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

export function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}
