import { findRaftTechnicalModel } from '@/modules/rafts/raftModelData';

type TestResult = 'YES' | 'NO' | 'N/A';

export type AutomaticRaftTests = {
  testeWP: TestResult;
  testeNAP: TestResult;
  testeFS: TestResult;
  testeGI: TestResult;
  testeDL: TestResult;
  ageYears: number | null;
  source: 'manufacturer' | 'age' | 'unknown-age';
  technicalModelName: string | null;
};

type ManufacturerRuleContext = {
  brand?: string | null;
  model?: string | null;
  launchType?: string | null;
  dataFabrico?: string | null;
  inspectionDate?: string | null;
  ageYears: number | null;
  technicalModelName: string | null;
};

type ManufacturerRule = {
  technicalModels: string[];
  resolve: (context: ManufacturerRuleContext) => Partial<AutomaticRaftTests> | null;
};

const MANUFACTURER_RULES: ManufacturerRule[] = [];

function normalizeText(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildSafeDate(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function parseFlexibleDate(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const monthYearMatch = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYearMatch) {
    const month = Number(monthYearMatch[1]);
    const year = Number(monthYearMatch[2]);
    return buildSafeDate(year, month, 1);
  }

  const isoMonthMatch = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMonthMatch) {
    const year = Number(isoMonthMatch[1]);
    const month = Number(isoMonthMatch[2]);
    return buildSafeDate(year, month, 1);
  }

  const isoLikeMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (isoLikeMatch) {
    const year = Number(isoLikeMatch[1]);
    const second = Number(isoLikeMatch[2]);
    const third = Number(isoLikeMatch[3]);
    return buildSafeDate(year, second, third) || (second > 12 ? buildSafeDate(year, third, second) : null);
  }

  const dmyMatch = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[T\s].*)?$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    return buildSafeDate(year, month, day);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function calculateFullYears(manufactureDate: Date | null, referenceDate: Date | null) {
  if (!manufactureDate || !referenceDate) return null;
  if (referenceDate.getTime() < manufactureDate.getTime()) return 0;

  let years = referenceDate.getFullYear() - manufactureDate.getFullYear();
  const monthDelta = referenceDate.getMonth() - manufactureDate.getMonth();
  const dayDelta = referenceDate.getDate() - manufactureDate.getDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    years -= 1;
  }

  return Math.max(0, years);
}

function normalizeLaunchType(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  if (normalized.includes('davit') || normalized === 'dl') return 'DL';
  if (normalized.includes('throw') || normalized.includes('over') || normalized === 'to') return 'TO';
  return String(value || '').trim().toUpperCase();
}

function getFallbackTests(ageYears: number | null, launchType?: string | null): AutomaticRaftTests {
  const normalizedLaunchType = normalizeLaunchType(launchType);
  const hasKnownAge = ageYears !== null;
  const giDue = hasKnownAge && ageYears >= 5 && ageYears % 5 === 0;
  const napAndFsDue = hasKnownAge && ageYears >= 11;

  return {
    testeWP: 'YES',
    testeNAP: napAndFsDue ? 'YES' : 'NO',
    testeFS: napAndFsDue ? 'YES' : 'NO',
    testeGI: giDue ? 'YES' : 'NO',
    testeDL: normalizedLaunchType === 'DL' ? 'NO' : 'N/A',
    ageYears,
    source: hasKnownAge ? 'age' : 'unknown-age',
    technicalModelName: null,
  };
}

function resolveManufacturerRule(context: ManufacturerRuleContext) {
  const normalizedTechnicalModel = normalizeText(context.technicalModelName);
  if (!normalizedTechnicalModel) return null;

  const rule = MANUFACTURER_RULES.find((candidate) =>
    candidate.technicalModels.some((model) => normalizeText(model) === normalizedTechnicalModel)
  );

  if (!rule) return null;
  return rule.resolve(context);
}

export function getAutomaticRaftTests(args: {
  brand?: string | null;
  model?: string | null;
  launchType?: string | null;
  dataFabrico?: string | null;
  inspectionDate?: string | null;
}): AutomaticRaftTests {
  const technicalModel = findRaftTechnicalModel(args.brand, args.model);
  const technicalModelName = String(technicalModel?.name || '').trim() || null;
  const manufactureDate = parseFlexibleDate(args.dataFabrico);
  const referenceDate = parseFlexibleDate(args.inspectionDate) || new Date();
  const ageYears = calculateFullYears(manufactureDate, referenceDate);

  const fallback = getFallbackTests(ageYears, args.launchType);
  const manufacturerOverride = resolveManufacturerRule({
    ...args,
    ageYears,
    technicalModelName,
  });

  if (!manufacturerOverride) {
    return {
      ...fallback,
      technicalModelName,
    };
  }

  return {
    ...fallback,
    ...manufacturerOverride,
    source: 'manufacturer',
    ageYears,
    technicalModelName,
  };
}