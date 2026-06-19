import {
  certificateItemHasManagedValidity,
  certificateRowLooksLikeManufacturingDate,
} from '@/lib/certificate-validity';

export type ImportRow = Record<string, string | number | null>;

export type ImportDocumentKind = 'generated-certificate' | 'generated-quadro' | 'external-certificate' | 'unknown';

export type ImportRowAnalysis = {
  rowIndex: number;
  itemCandidate: string | null;
  rowText: string;
  looksLikeManufacturingDate: boolean;
  hasManagedValidity: boolean;
  shouldSkipValidity: boolean;
  reasons: string[];
};

export type ImportAnalysisSummary = {
  documentKind: ImportDocumentKind;
  totalRows: number;
  flaggedRowsCount: number;
  manufacturingDateRows: number;
  nonExpiringRows: number;
  flaggedRows: Array<{
    rowNumber: number;
    item: string | null;
    reasons: string[];
  }>;
  autoRules: string[];
};

const ITEM_KEYS = ['item', 'artigo', 'descricao', 'description', 'material', 'conteudo', 'content'];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function asImportString(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

export function joinImportRowText(row: ImportRow): string {
  return Object.entries(row)
    .map(([key, value]) => `${key} ${asImportString(value)}`.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

export function findImportRowItemCandidate(row: ImportRow): string | null {
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeText(key);
    if (!ITEM_KEYS.some((term) => normalizedKey.includes(term))) continue;
    const text = asImportString(value);
    if (text) return text;
  }

  if ('conteudo' in row) {
    const text = asImportString(row.conteudo);
    return text || null;
  }

  return null;
}

export function analyzeImportRow(row: ImportRow, rowIndex = 0): ImportRowAnalysis {
  const rowText = joinImportRowText(row);
  const itemCandidate = findImportRowItemCandidate(row);
  const looksLikeManufacturingDate = certificateRowLooksLikeManufacturingDate(rowText);
  const hasManagedValidity = certificateItemHasManagedValidity(itemCandidate || rowText);
  const reasons: string[] = [];

  if (looksLikeManufacturingDate) reasons.push('manufacturing-date');
  if (!hasManagedValidity) reasons.push('non-expiring-item');

  return {
    rowIndex,
    itemCandidate,
    rowText,
    looksLikeManufacturingDate,
    hasManagedValidity,
    shouldSkipValidity: reasons.length > 0,
    reasons,
  };
}

export function detectImportDocumentKind(rows: ImportRow[], fileName?: string | null, sourceSheetName?: string | null): ImportDocumentKind {
  const combined = [
    fileName || '',
    sourceSheetName || '',
    ...rows.slice(0, 20).map((row) => joinImportRowText(row)),
  ].join(' \n ');

  const normalized = normalizeText(combined);

  if (
    normalized.includes('certificado de inspecao') ||
    normalized.includes('certificate no') ||
    normalized.includes('certificate n') ||
    normalized.includes('inflation cylinder')
  ) {
    return 'generated-certificate';
  }

  if (
    normalized.includes('quadro de inspecao') ||
    normalized.includes('inspection worksheet') ||
    normalized.includes('inspection table')
  ) {
    return 'generated-quadro';
  }

  if (String(fileName || '').trim()) {
    return 'external-certificate';
  }

  return 'unknown';
}

export function summarizeImportRows(rows: ImportRow[], fileName?: string | null, sourceSheetName?: string | null): ImportAnalysisSummary {
  const analyzed = rows.map((row, index) => analyzeImportRow(row, index + 1));
  const flagged = analyzed.filter((row) => row.shouldSkipValidity);
  const manufacturingDateRows = analyzed.filter((row) => row.looksLikeManufacturingDate).length;
  const nonExpiringRows = analyzed.filter((row) => !row.hasManagedValidity).length;
  const autoRules = Array.from(new Set([
    manufacturingDateRows > 0 ? 'Linhas com DATA FABRICO / MANUF. DATE não contam como validade.' : null,
    nonExpiringRows > 0 ? 'Rampa / Boarding Ramp / Escada são itens sem validade gerida.' : null,
  ].filter((value): value is string => Boolean(value))));

  return {
    documentKind: detectImportDocumentKind(rows, fileName, sourceSheetName),
    totalRows: rows.length,
    flaggedRowsCount: flagged.length,
    manufacturingDateRows,
    nonExpiringRows,
    flaggedRows: flagged.slice(0, 25).map((row) => ({
      rowNumber: row.rowIndex,
      item: row.itemCandidate,
      reasons: row.reasons,
    })),
    autoRules,
  };
}