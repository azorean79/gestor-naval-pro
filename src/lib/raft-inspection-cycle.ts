function normalizeBrand(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

const ANNUAL_INSPECTION_BRANDS = ['RFD', 'DSB', 'ZODIAC'];

export function getRaftInspectionCycleYearsByBrand(brand?: string | null) {
  const normalized = normalizeBrand(brand);
  if (!normalized) return 3;
  return ANNUAL_INSPECTION_BRANDS.some((candidate) => normalized.includes(candidate)) ? 1 : 3;
}

export function getRaftInspectionCycleLabelByBrand(brand?: string | null) {
  const years = getRaftInspectionCycleYearsByBrand(brand);
  return years === 1
    ? '1 ano · periodicidade por marca (RFD / DSB / ZODIAC)'
    : '3 anos · periodicidade por marca';
}