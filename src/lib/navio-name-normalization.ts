const NAVIO_LOWERCASE_PARTICLES = new Set([
  'a', 'as', 'o', 'os', 'de', 'da', 'das', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos', 'por'
]);

function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isRomanNumeral(value: string) {
  return /^(?=[ivxlcdm]+$)m{0,4}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/i.test(value);
}

function capitalizeSegment(segment: string, shouldLowercaseParticle: boolean) {
  const trimmed = segment.trim();
  if (!trimmed) return '';

  if (/^\d+$/.test(trimmed)) return trimmed;
  if (isRomanNumeral(trimmed)) return trimmed.toUpperCase();

  const lower = trimmed.toLowerCase();
  if (shouldLowercaseParticle && NAVIO_LOWERCASE_PARTICLES.has(lower)) return lower;

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function capitalizeCompoundWord(word: string, isFirstWord: boolean) {
  return word
    .split(/([-'])/)
    .map((segment, index) => {
      if (segment === '-' || segment === "'") return segment;
      return capitalizeSegment(segment, !(isFirstWord && index === 0));
    })
    .join('');
}

export function normalizeNavioNameKey(value?: string | null) {
  return stripDiacritics(String(value || ''))
    .toLowerCase()
    .replace(/\.\s+/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeNavioDisplayName(value?: string | null) {
  const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  const dotsCleaned = cleaned.replace(/\.\s+/g, '.');

  return dotsCleaned
    .split(' ')
    .map((word, index) => capitalizeCompoundWord(word, index === 0))
    .join(' ');
}

export function isEquivalentNavioName(a?: string | null, b?: string | null) {
  const left = normalizeNavioNameKey(a);
  const right = normalizeNavioNameKey(b);
  return !!left && left === right;
}