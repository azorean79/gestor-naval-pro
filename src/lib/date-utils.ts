/**
 * Consolidated date utilities.
 * Single source of truth for date parsing, formatting, and timezone handling.
 *
 * TIMEZONE NOTE:
 * The app operates in Azores timezone (UTC-1 WET / UTC+0 WET winter).
 * All Date comparisons for "today" use local midnight via `getLocalDateKey()`.
 * Use `toLocalISO()` instead of `toISOString()` when serializing dates that
 * will be compared client-side with "today" or with date strings stored as
 * YYYY-MM-DD.
 */

const AZORES_TIMEZONE = 'Atlantic/Azores';

/* ──────────────────────────────────────────────────
 * Timezone-safe date helpers
 * ────────────────────────────────────────────────── */

/**
 * Get today's date as a YYYY-MM-DD string in the Azores timezone.
 * Avoids the UTC offset bug where after ~14h local time, toISOString()
 * produces the next UTC day.
 */
export function getLocalDateKey(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleDateString('sv-SE', { timeZone: AZORES_TIMEZONE });
}

/**
 * Get a Date object set to local midnight in the Azores timezone.
 * Safe for day-level comparisons.
 */
export function getLocalMidnight(date?: Date): Date {
  const d = date || new Date();
  const parts = d.toLocaleDateString('en-CA', {
    timeZone: AZORES_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

/**
 * Serialize a Date to a local YYYY-MM-DD string (not UTC).
 * Use this instead of date.toISOString().split('T')[0].
 */
export function toLocalDateStr(date: Date): string {
  return date.toLocaleDateString('sv-SE', { timeZone: AZORES_TIMEZONE });
}

/**
 * Serialize a Date to a local ISO-like datetime string (YYYY-MM-DDTHH:MM).
 * Use this for datetime-local inputs and server round-trips that expect local time.
 */
export function toLocalISO(date: Date): string {
  const datePart = date.toLocaleDateString('sv-SE', { timeZone: AZORES_TIMEZONE });
  const timePart = date.toLocaleTimeString('en-GB', {
    timeZone: AZORES_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart}T${timePart}`;
}

/**
 * Parse a date string and return a Date adjusted to Azores local midnight.
 * Useful when comparing YYYY-MM-DD strings from the database against "today".
 */
export function parseAsLocalDate(dateStr: string | Date | null | undefined): Date | null {
  if (dateStr instanceof Date) return Number.isNaN(dateStr.getTime()) ? null : dateStr;
  return parseFlexibleDate(dateStr);
}

/**
 * Parse a flexible date string into a Date object.
 * Handles: ISO dates, DD/MM/YYYY, MM/YYYY, MM/YY, YYYY-MM, and more.
 * Returns null if the input cannot be parsed.
 */
export function parseFlexibleDate(value: string | Date | null | undefined): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value || "").trim();
  if (!raw) return null;

  // Intercept MM/YY, MM/YYYY, YYYY-MM
  const parts = raw.split(/[\/-]/);
  if (parts.length === 2) {
    const p1 = parts[0].trim();
    const p2 = parts[1].trim();
    if (/^\d{1,2}$/.test(p1) && /^\d{2,4}$/.test(p2)) {
      const month = parseInt(p1, 10);
      let year = parseInt(p2, 10);
      if (year < 100) year += 2000;
      if (month >= 1 && month <= 12) {
        const parsed = new Date(year, month - 1, 1);
        if (!Number.isNaN(parsed.getTime())) return parsed;
      }
    } else if (/^\d{4}$/.test(p1) && /^\d{1,2}$/.test(p2)) {
      const year = parseInt(p1, 10);
      const month = parseInt(p2, 10);
      if (month >= 1 && month <= 12) {
        const parsed = new Date(year, month - 1, 1);
        if (!Number.isNaN(parsed.getTime())) return parsed;
      }
    }
  }

  const normalized = raw.replace(/\//g, "-");
  const directNormalized = new Date(normalized);
  if (!Number.isNaN(directNormalized.getTime())) return directNormalized;

  const dayFirstMatch = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (dayFirstMatch) {
    const [, dayText, monthText, yearText, hourText, minuteText] = dayFirstMatch;
    const parsed = new Date(
      Number(yearText),
      Number(monthText) - 1,
      Number(dayText),
      Number(hourText || 0),
      Number(minuteText || 0),
      0,
      0,
    );
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const isoDayMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDayMatch) {
    const year = Number(isoDayMatch[1]);
    const monthText = Number(isoDayMatch[2]);
    const dayText = Number(isoDayMatch[3]);
    let parsed = new Date(year, monthText - 1, dayText, 0, 0, 0, 0);
    const isWellFormed =
      !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === monthText - 1 &&
      parsed.getDate() === dayText;
    if (isWellFormed) return parsed;
    // Formato legado YYYY-DD-MM (dia no meio): reinterpretar quando o meio não é mês válido.
    if (monthText > 12 && dayText >= 1 && dayText <= 12) {
      parsed = new Date(year, dayText - 1, monthText, 0, 0, 0, 0);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  return null;
}

/**
 * Parse a validity string in formats like M/YYYY, MM/YYYY, M/YY, MM/YY, or full dates.
 * Returns the last day of the month for month-only formats.
 */
export function parseValidadeString(validadeStr: string): Date | null {
  if (!validadeStr) return null;
  const raw = String(validadeStr).trim();

  const mmYyyy = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyy) {
    const month = parseInt(mmYyyy[1], 10);
    const year = parseInt(mmYyyy[2], 10);
    if (month >= 1 && month <= 12) return new Date(year, month, 0);
  }

  const mmYy = raw.match(/^(\d{1,2})\/(\d{2})$/);
  if (mmYy) {
    const month = parseInt(mmYy[1], 10);
    const year = 2000 + parseInt(mmYy[2], 10);
    if (month >= 1 && month <= 12) return new Date(year, month, 0);
  }

  return parseFlexibleDate(raw);
}

/**
 * Calculate days until a given date from today.
 * Returns null if the date cannot be parsed.
 */
export function daysUntil(dateStr: string | Date | null | undefined): number | null {
  const d = parseFlexibleDate(dateStr);
  if (!d) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

/**
 * Check if a date is within N days from now.
 */
export function isWithinDays(dateText: string | Date | null | undefined, days: number): boolean {
  const parsed = parseFlexibleDate(dateText);
  if (!parsed) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);
  return parsed >= now && parsed <= limit;
}

/**
 * Get YYYY-MM key from a Date.
 */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Add months to a date.
 */
export function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

/* ──────────────────────────────────────────────────
 * Consolidated formatting functions
 *
 * Replaces 9 duplicate formatDate/formatDateTime implementations.
 * All return "—" for null/invalid inputs, use pt-PT locale,
 * and handle timezone safely.
 * ────────────────────────────────────────────────── */

const PT_LOCALE = 'pt-PT';

/**
 * Format a date string as DD/MM/YYYY (pt-PT).
 * Returns "—" for null/invalid input.
 * Safe replacement for the 6+ duplicated formatDate functions.
 */
export function formatDate(value: unknown): string {
  if (!value) return '—';
  const raw = String(value).trim();
  if (!raw) return '—';
  const d = parseFlexibleDate(raw);
  if (!d) return '—';
  return d.toLocaleDateString(PT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a date string as DD/MM (no year) for compact UI.
 * Returns "—" for null/invalid input.
 * Replacement for dashboard's formatDateLabel.
 */
export function formatDateCompact(value: unknown): string {
  if (!value) return '—';
  const raw = String(value).trim();
  if (!raw) return '—';
  const d = parseFlexibleDate(raw);
  if (!d) return '—';
  return d.toLocaleDateString(PT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Format a date string with time: DD/MM/YYYY às HH:MM (pt-PT).
 * Returns "—" for null/invalid input.
 * Replacement for alertas, contactos-internos, utilizadores formatDateTime.
 */
export function formatDateTime(value: unknown): string {
  if (!value) return '—';
  const raw = String(value).trim();
  if (!raw) return '—';
  const d = parseFlexibleDate(raw);
  if (!d) return '—';
  const dateStr = d.toLocaleDateString(PT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString(PT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${dateStr} às ${timeStr}`;
}

/**
 * Format a date string with time for display in tables (short format).
 * Returns "—" for null/invalid input.
 */
export function formatDateTimeShort(value: unknown): string {
  if (!value) return '—';
  const raw = String(value).trim();
  if (!raw) return '—';
  const d = parseFlexibleDate(raw);
  if (!d) return '—';
  return d.toLocaleString(PT_LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * Format only the time portion: HH:MM (pt-PT).
 * Returns "—" for null/invalid input.
 */
export function formatTime(value: unknown): string {
  if (!value) return '—';
  const raw = String(value).trim();
  if (!raw) return '—';
  const d = parseFlexibleDate(raw);
  if (!d) return '—';
  return d.toLocaleTimeString(PT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Conditional format: shows date+time if the input contains "T", date only otherwise.
 * Replacement for alertas/page.tsx's special formatDate that shows time for assistance requests.
 */
export function formatDateAuto(value: unknown): string {
  if (!value) return '—';
  const raw = String(value).trim();
  if (!raw) return '—';
  if (raw.includes('T')) return formatDateTime(raw);
  return formatDate(raw);
}
