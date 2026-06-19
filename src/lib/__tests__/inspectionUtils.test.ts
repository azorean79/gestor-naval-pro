import { computeNextInspectionDate, needsThreeYearRule } from '../../lib/inspectionUtils';

describe('Inspection Utils', () => {
  const baseInspection = {
    dataInspecao: '2022-04-01',
    dataProxInspecao: null as string | null,
    // other fields are irrelevant for the function
  } as any;

  test('returns existing dataProxInspecao if present', () => {
    const inspection = { ...baseInspection, dataProxInspecao: '2025-04-01' };
    const result = computeNextInspectionDate(inspection, 'RFD');
    expect(result).toBe('2025-04-01');
  });

  test('calculates +3 years for non‑exempt brands', () => {
    const inspection = { ...baseInspection, dataProxInspecao: null };
    const result = computeNextInspectionDate(inspection, 'OTHER');
    // Expected ISO string for 2025-04-01 (midnight UTC)
    expect(new Date(result!).toISOString()).toBe('2025-04-01T00:00:00.000Z');
  });

  test('returns null for exempt brands when no dataProxInspecao', () => {
    const inspection = { ...baseInspection, dataProxInspecao: null };
    const result = computeNextInspectionDate(inspection, 'RFD');
    expect(result).toBeNull();
  });

  test('needsThreeYearRule identifies exempt brands', () => {
    expect(needsThreeYearRule('RFD')).toBe(false);
    expect(needsThreeYearRule('DSB')).toBe(false);
    expect(needsThreeYearRule('ZODIAC')).toBe(false);
    expect(needsThreeYearRule('OTHER')).toBe(true);
  });
});
