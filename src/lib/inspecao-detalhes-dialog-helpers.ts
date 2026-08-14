export function formatDate(dateStr?: string | null) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-PT');
}

export function calculateQueda(inicio?: string | number | null, fim?: string | number | null) {
  const ini = parseFloat(String(inicio || '').replace(',', '.'));
  const f = parseFloat(String(fim || '').replace(',', '.'));
  if (isNaN(ini) || isNaN(f) || ini <= 0) return '0 hPa (0%)';
  const queda = ini - f;
  const percent = (queda / ini) * 100;
  return `${queda.toFixed(1).replace(/\.0+$/, '')} hPa (${percent.toFixed(1)}%)`;
}

export function formatMonthYear(val?: string | null) {
  if (!val) return '\u2014';
  const raw = String(val).trim();
  if (!raw) return '\u2014';
  const parts = raw.split('-');
  if (parts.length >= 2) {
    return `${parts[1]}/${parts[0]}`;
  }
  const slashMatch = raw.match(/^(\d{2})\/(\d{4})$/);
  if (slashMatch) return raw;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${yyyy}`;
}
