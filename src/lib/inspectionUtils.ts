// src/lib/inspectionUtils.ts

/**
 * Brands that are *exempt* from the 3‑year rule (SOLAS rafts).
 * All other brands require the next inspection to be scheduled three years later.
 */
const threeYearExemptBrands = ['RFD', 'DSB', 'ZODIAC'];

/**
 * Returns true if a given brand **needs** the 3‑year rule (non-SOLAS).
 */
export const needsThreeYearRule = (brand?: string): boolean => {
  if (!brand) return false;
  return !threeYearExemptBrands.includes(brand.toUpperCase());
};

/**
 * Adds a number of years to an ISO date string and returns a new ISO string.
 * The function keeps the original time component intact.
 */
export const addYears = (dateStr: string, years: number): string => {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
};

/**
 * Computes the next inspection date according to business rules.
 *
 * 1. If the inspection already has `dataProxInspecao`, return it unchanged.
 * 2. If the brand requires the 3‑year rule, return `dataInspecao` + 3 years.
 * 3. Otherwise return `null` (the UI will display the placeholder “—”).
 */
export const computeNextInspectionDate = (
  inspecao: { dataProxInspecao?: string | null; dataInspecao: string },
  brand?: string
): string | null => {
  if (inspecao.dataProxInspecao) return inspecao.dataProxInspecao;
  if (needsThreeYearRule(brand)) {
    return addYears(inspecao.dataInspecao, 3);
  }
  return null;
};
