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

export function parseFlexibleDateValue(value?: string | null) {
	const raw = String(value || '').trim();
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
				return buildSafeDate(year, month, 1);
			}
		} else if (/^\d{4}$/.test(p1) && /^\d{1,2}$/.test(p2)) {
			const year = parseInt(p1, 10);
			const month = parseInt(p2, 10);
			if (month >= 1 && month <= 12) {
				return buildSafeDate(year, month, 1);
			}
		}
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

export function formatDateDisplay(value?: string | null, fallback = '—') {
	if (!value) return fallback;
	const parsed = parseFlexibleDateValue(value);
	if (!parsed) return String(value || fallback);
	return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`;
}

export function formatDateTimeDisplay(value?: string | null, fallback = '—') {
	if (!value) return fallback;
	const parsed = new Date(String(value));
	if (Number.isNaN(parsed.getTime())) {
		const fallbackDate = parseFlexibleDateValue(value);
		return fallbackDate ? formatDateDisplay(value, fallback) : fallback;
	}

	return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()} ${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
}

export function normalizeMonthYearValue(value?: string | null) {
	const raw = String(value || '').trim();
	if (!raw) return '';
	if (/^\d{4}-\d{2}$/.test(raw)) return raw;
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);

	const monthYearMatch = raw.match(/^(\d{2})[\/-](\d{4})$/);
	if (monthYearMatch) {
		const month = Number(monthYearMatch[1]);
		if (Number.isInteger(month) && month >= 1 && month <= 12) {
			return `${monthYearMatch[2]}-${String(month).padStart(2, '0')}`;
		}
		return '';
	}

	const parsed = parseFlexibleDateValue(raw);
	if (!parsed) return '';
	return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthYearDisplay(value?: string | null, fallback = '—') {
	if (!value) return fallback;
	const normalized = normalizeMonthYearValue(value);
	if (!normalized) return String(value || fallback);
	const [year, month] = normalized.split('-');
	return `${month}/${year}`;
}

export function toLocalIsoDateValue(value?: string | null) {
	const parsed = parseFlexibleDateValue(value);
	if (!parsed) return '';
	return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}
