// Converte YYYY-MM-DD para dd/mm/aaaa
export function toDisplayDate(value: string | null | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return value;
}

// Converte dd/mm/aaaa para YYYY-MM-DD
export function toStorageDate(value: string | null | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  // se ja estiver em YYYY-MM-DD retorna como esta
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return value;
}

// Converte YYYY-MM-DD para MM/AAAA (validade)
export function toDisplayValidade(value: string | null | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})/);
  if (match) return `${match[2]}/${match[1]}`;
  // se ja estiver em MM/AAAA retorna como esta
  if (/^\d{2}\/\d{4}/.test(value)) return value;
  return value;
}

// Converte MM/AAAA para YYYY-MM-DD (primeiro dia do mes)
export function toStorageValidade(value: string | null | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{2})\/(\d{4})/);
  if (match) return `${match[2]}-${match[1]}-01`;
  // se ja estiver em YYYY-MM-DD retorna como esta
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return value;
}

// Normaliza input: aceita YYYY-MM-DD ou dd/mm/aaaa e retorna YYYY-MM-DD
export function normalizeDateInput(value: string): string {
  const ddmm = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ddmm) return `${ddmm[3]}-${ddmm[2]}-${ddmm[1]}`;
  const ymd = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  return value;
}
