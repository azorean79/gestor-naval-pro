export const AZORES_TECHNICIANS = [
  {
    id: 'julio-correia',
    name: 'Julio Correia',
    role: 'Principal',
    aliases: ['julio correia', 'julio correa'],
  },
  {
    id: 'alex-santos',
    name: 'Alex Santos',
    role: 'Auxiliar',
    aliases: ['alex santos', 'alexandre santos'],
  },
] as const;

export const MAX_ACTIVE_RAFTS_PER_TECHNICIAN = 2;
export const MAX_DAILY_SCHEDULED_EVENTS = AZORES_TECHNICIANS.length * MAX_ACTIVE_RAFTS_PER_TECHNICIAN;

function normalizeLoose(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function normalizeTechnicianName(input?: string | null) {
  const raw = String(input || '').trim();
  const lower = normalizeLoose(raw);
  if (!lower) return '';

  for (const technician of AZORES_TECHNICIANS) {
    const aliases = (technician.aliases as readonly string[]).map((alias) => normalizeLoose(alias));
    if (aliases.includes(lower)) {
      return technician.name;
    }
  }

  return raw;
}

export function getTechnicianKeyByName(input?: string | null) {
  const normalized = normalizeLoose(normalizeTechnicianName(input));
  if (!normalized) return '';

  for (const technician of AZORES_TECHNICIANS) {
    const canonical = normalizeLoose(technician.name);
    const aliases = (technician.aliases as readonly string[]).map((alias) => normalizeLoose(alias));
    if (normalized === canonical || aliases.includes(normalized)) {
      return technician.id;
    }
  }

  return normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getTechnicianNameByKey(key?: string | null) {
  const normalizedKey = normalizeLoose(key);
  if (!normalizedKey) return '';

  const found = AZORES_TECHNICIANS.find((technician) => normalizeLoose(technician.id) === normalizedKey);
  return found?.name || '';
}
