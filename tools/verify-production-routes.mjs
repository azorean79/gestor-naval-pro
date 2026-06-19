import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.argv[2] || 'https://oreyazores26.vercel.app').replace(/\/$/, '');
const rootDir = process.cwd();
const appDir = path.join(rootDir, 'src', 'app');

const LIST_KEYS = ['items', 'data', 'results', 'rows', 'packs'];

async function walk(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...await walk(fullPath));
			continue;
		}

		files.push(fullPath);
	}

	return files;
}

function normalizeRoutePattern(filePath) {
	const relative = path.relative(appDir, filePath).replace(/\\/g, '/');
	const isApi = relative.startsWith('api/');
	if (relative === 'page.tsx') return '/';
	const suffix = isApi ? '/route.ts' : '/page.tsx';
	const trimmed = relative.endsWith(suffix) ? relative.slice(0, -suffix.length) : relative.replace(/\/(page|route)\.tsx$/, '');
	if (!trimmed) return '/';
	return `/${trimmed}`;
}

function extractArray(payload) {
	if (Array.isArray(payload)) return payload;
	if (payload && typeof payload === 'object') {
		for (const key of LIST_KEYS) {
			if (Array.isArray(payload[key])) return payload[key];
		}
	}
	return [];
}

function pickFirstValue(item, keys) {
	if (!item || typeof item !== 'object') return null;
	for (const key of keys) {
		const value = item[key];
		if (value !== undefined && value !== null && String(value).trim()) {
			return String(value).trim();
		}
	}
	return null;
}

async function fetchJson(routePath) {
	try {
		const response = await fetch(`${baseUrl}${routePath}`, {
			headers: { accept: 'application/json,text/plain;q=0.9,*/*;q=0.8' },
			redirect: 'follow',
		});
		const text = await response.text();
		let json = null;
		try {
			json = JSON.parse(text);
		} catch {
			json = null;
		}

		return { ok: response.ok, status: response.status, json, text };
	} catch (error) {
		return { ok: false, status: 0, json: null, text: String(error || '') };
	}
}

async function findFirstFile(dir, extensions = []) {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isFile()) continue;
			if (extensions.length > 0 && !extensions.some((extension) => entry.name.toLowerCase().endsWith(extension))) continue;
			return entry.name;
		}
	} catch {
		return null;
	}
	return null;
}

async function fetchEntitySample(listRoute, keys) {
	const payload = await fetchJson(listRoute);
	const rows = extractArray(payload.json);
	if (rows.length === 0) return null;
	return pickFirstValue(rows[0], keys);
}

async function resolveDynamicRoute(pattern) {
	if (!pattern.includes('[')) return { path: pattern, reason: 'static' };

	if (pattern.includes('[...nextauth]')) {
		return { path: '/api/auth/session', reason: 'nextauth-sample' };
	}

	if (pattern.includes('/jangadas/serial/[serial]') || pattern.includes('/api/jangadas/serial/[serial]')) {
		const serial = await fetchEntitySample('/api/jangadas', ['serial', 'numeroSerie']);
		return serial ? { path: pattern.replace('[serial]', encodeURIComponent(serial)), reason: 'serial-from-api' } : null;
	}

	if (pattern.includes('/clientes/[id]') || pattern.includes('/api/clientes/[id]')) {
		const id = await fetchEntitySample('/api/clientes', ['id']);
		if (!id) return null;
		return { path: pattern.replace('[id]', id), reason: 'cliente-id-from-api' };
	}

	if (pattern.includes('/contactos-internos/[id]') || pattern.includes('/api/contactos-internos/[id]')) {
		const id = await fetchEntitySample('/api/contactos-internos', ['id']);
		if (!id) return null;
		return { path: pattern.replace('[id]', id), reason: 'contacto-id-from-api' };
	}

	if (pattern.includes('/epirbs/[id]') || pattern.includes('/api/epirbs/[id]')) {
		const id = await fetchEntitySample('/api/epirbs', ['id']);
		if (!id) return null;
		return { path: pattern.replace('[id]', id), reason: 'epirb-id-from-api' };
	}

	if (pattern.includes('/equipamentos/[id]')) {
		const id = await fetchEntitySample('/api/equipamento', ['id']);
		if (!id) return null;
		return { path: pattern.replace('[id]', id), reason: 'equipamento-id-from-api' };
	}

	if (pattern.includes('/navios/[id]') || pattern.includes('/api/navios/[id]')) {
		const id = await fetchEntitySample('/api/navios', ['id']);
		if (!id) return null;
		return { path: pattern.replace('[id]', id), reason: 'navio-id-from-api' };
	}

	if (pattern.includes('/jangadas/[id]') || pattern.includes('/api/jangadas/[id]')) {
		const id = await fetchEntitySample('/api/jangadas', ['id']);
		if (!id) return null;

		if (pattern.includes('[artigoId]')) {
			const artigosPayload = await fetchJson(`/api/jangadas/${id}/artigos`);
			const artigos = extractArray(artigosPayload.json);
			const artigoId = pickFirstValue(artigos[0], ['id', 'artigoId']);
			if (!artigoId) return null;
			return {
				path: pattern.replace('[id]', id).replace('[artigoId]', artigoId),
				reason: 'jangada-artigo-id-from-api',
			};
		}

		return { path: pattern.replace('[id]', id), reason: 'jangada-id-from-api' };
	}

	if (pattern.includes('/ordens-servico/[id]') || pattern.includes('/api/ordens-servico/[id]')) {
		const id = await fetchEntitySample('/api/ordens-servico', ['id']);
		if (!id) return null;
		return { path: pattern.replace('[id]', id), reason: 'ot-id-from-api' };
	}

	if (pattern.includes('/stock/[id]') || pattern.includes('/api/stock/[id]')) {
		const id = await fetchEntitySample('/api/stock?take=1', ['id']);
		if (!id) return null;
		return { path: pattern.replace('[id]', id), reason: 'stock-id-from-api' };
	}

	if (pattern.includes('/coletes/[id]') || pattern.includes('/api/coletes/[id]')) {
		const id = await fetchEntitySample('/api/coletes', ['id']);
		if (!id) return null;
		return { path: pattern.replace('[id]', id), reason: 'colete-id-from-api' };
	}

	if (pattern.includes('/api/boletins/[file]')) {
		const file = await findFirstFile(path.join(rootDir, 'public', 'boletins'));
		return file ? { path: `/api/boletins/${encodeURIComponent(file)}`, reason: 'local-boletim-file' } : null;
	}

	if (pattern.includes('/api/documentacao/[file]')) {
		const file = await findFirstFile(path.join(rootDir, 'documentacao'), ['.md', '.html', '.txt', '.json']);
		return file ? { path: `/api/documentacao/${encodeURIComponent(file)}`, reason: 'local-documentacao-file' } : null;
	}

	if (pattern.includes('/api/legislacao/[file]')) {
		const file = await findFirstFile(path.join(rootDir, 'legislacao'), ['.md', '.html', '.txt', '.pdf']);
		return file ? { path: `/api/legislacao/${encodeURIComponent(file)}`, reason: 'local-legislacao-file' } : null;
	}

	if (pattern.includes('/api/manuais/[file]')) {
		const file = await findFirstFile(path.join(rootDir, 'manuais'));
		return file ? { path: `/api/manuais/${encodeURIComponent(file)}`, reason: 'local-manual-file' } : null;
	}

	return null;
}

async function verifyRoute(pattern) {
	const resolved = await resolveDynamicRoute(pattern);
	if (!resolved) {
		return {
			pattern,
			resolvedPath: null,
			status: null,
			category: 'unresolved-dynamic',
			note: 'No sample parameter available',
		};
	}

	try {
		const response = await fetch(`${baseUrl}${resolved.path}`, {
			redirect: 'follow',
			headers: { accept: '*/*' },
		});
		const contentType = response.headers.get('content-type') || '';
		const text = await response.text();
		const normalizedText = text.toLowerCase();

		let category = 'ok';
		if (response.status === 401 || response.status === 403) category = 'auth-blocked';
		else if (response.status === 405) category = 'method-blocked';
		else if (response.status === 404) category = 'not-found';
		else if (response.status >= 500) category = 'server-error';
		else if (normalizedText.includes('esta area esta reservada') || normalizedText.includes('esta área está reservada')) category = 'protected-page';
		else if (normalizedText.includes('entrar') && normalizedText.includes('orey tecnica acores')) category = 'login-gated';

		return {
			pattern,
			resolvedPath: resolved.path,
			status: response.status,
			finalUrl: response.url,
			contentType,
			redirected: response.redirected,
			category,
			note: resolved.reason,
		};
	} catch (error) {
		return {
			pattern,
			resolvedPath: resolved.path,
			status: 0,
			category: 'request-failed',
			note: String(error || ''),
		};
	}
}

function summarize(results) {
	return results.reduce((acc, item) => {
		acc[item.category] = (acc[item.category] || 0) + 1;
		return acc;
	}, {});
}

const allFiles = await walk(appDir);
const routeFiles = allFiles.filter((filePath) => filePath.endsWith('page.tsx') || filePath.endsWith('route.ts'));
const patterns = Array.from(new Set(routeFiles.map(normalizeRoutePattern))).sort((a, b) => a.localeCompare(b));

const results = [];
for (const pattern of patterns) {
	results.push(await verifyRoute(pattern));
}

const summary = summarize(results);
const output = {
	baseUrl,
	generatedAt: new Date().toISOString(),
	total: results.length,
	summary,
	results,
};

const reportPath = path.join(rootDir, 'tools', 'production-route-report.json');
await fs.writeFile(reportPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
	baseUrl,
	total: results.length,
	summary,
	reportPath,
	unresolved: results.filter((item) => item.category === 'unresolved-dynamic').slice(0, 20),
	failures: results.filter((item) => ['not-found', 'server-error', 'request-failed'].includes(item.category)).slice(0, 30),
}, null, 2));
