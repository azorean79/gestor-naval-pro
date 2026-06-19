import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.gestornavalpro_DATABASE_URL ??
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found.');
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;
const prisma = new PrismaClient();

type Ilha =
  | 'Santa Maria'
  | 'São Miguel'
  | 'Terceira'
  | 'Graciosa'
  | 'São Jorge'
  | 'Pico'
  | 'Faial'
  | 'Flores'
  | 'Corvo';

const validIlhas = new Set<Ilha>([
  'Santa Maria',
  'São Miguel',
  'Terceira',
  'Graciosa',
  'São Jorge',
  'Pico',
  'Faial',
  'Flores',
  'Corvo',
]);

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSqlString(token: string | null | undefined): string | null {
  if (!token) return null;
  const t = token.trim();
  if (t.toUpperCase() === 'NULL') return null;
  if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1).replace(/''/g, "'").trim();
  return t.trim();
}

function asValidIlha(value: string | null | undefined): Ilha | null {
  if (!value) return null;
  const norm = normalize(value);
  for (const i of validIlhas) {
    if (normalize(i) === norm) return i;
  }
  return null;
}

function isInvalidIlha(value: string | null | undefined): boolean {
  const v = normalize(value);
  return !v || v === 'N/A' || v === 'N D' || v === 'N/D' || v === 'DESCONHECIDA';
}

function extractPrefix(matricula: string | null | undefined): string | null {
  const m = normalize(matricula);
  if (!m) return null;

  const mPt = /^PT([A-Z]{3})-/.exec(m);
  if (mPt) return `PT${mPt[1]}`;

  const m2 = /^([A-Z]{2})-/.exec(m);
  if (m2) return m2[1];

  const m3 = /^([A-Z]{2,5})\d/.exec(m);
  if (m3) return m3[1];

  return null;
}

type PrefixDecision = { ilha: Ilha; confidence: number; total: number; topCount: number; evidence: Record<string, number> };

function loadSeedIlhaByMatricula(sqlPath: string): Map<string, Ilha> {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const navioInsertRe =
    /INSERT INTO "Navio" \(nome, matricula, ilha, "tipoPesca", "clienteId"\) SELECT\s+('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,/gi;

  const out = new Map<string, Ilha>();
  let match: RegExpExecArray | null;

  while ((match = navioInsertRe.exec(sql)) !== null) {
    const matricula = parseSqlString(match[2]);
    const ilha = asValidIlha(parseSqlString(match[3]));
    if (!matricula || !ilha) continue;

    const key = normalize(matricula);
    if (!key) continue;
    if (!out.has(key)) out.set(key, ilha);
  }

  return out;
}

function learnPrefixMap(sqlPath: string): Map<string, PrefixDecision> {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const navioInsertRe =
    /INSERT INTO "Navio" \(nome, matricula, ilha, "tipoPesca", "clienteId"\) SELECT\s+('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,/gi;

  const byPrefix = new Map<string, Map<Ilha, number>>();
  let match: RegExpExecArray | null;

  while ((match = navioInsertRe.exec(sql)) !== null) {
    const matricula = parseSqlString(match[2]);
    const ilha = asValidIlha(parseSqlString(match[3]));
    if (!matricula || !ilha) continue;

    const prefix = extractPrefix(matricula);
    if (!prefix) continue;

    if (!byPrefix.has(prefix)) byPrefix.set(prefix, new Map<Ilha, number>());
    const counts = byPrefix.get(prefix)!;
    counts.set(ilha, (counts.get(ilha) ?? 0) + 1);
  }

  const out = new Map<string, PrefixDecision>();
  for (const [prefix, counts] of byPrefix.entries()) {
    const ordered = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const total = ordered.reduce((acc, [, c]) => acc + c, 0);
    const [topIlha, topCount] = ordered[0];
    const secondCount = ordered[1]?.[1] ?? 0;
    const confidence = total > 0 ? topCount / total : 0;

    if (topCount >= 2 && topCount > secondCount && confidence >= 0.6) {
      out.set(prefix, {
        ilha: topIlha,
        confidence,
        total,
        topCount,
        evidence: Object.fromEntries(ordered),
      });
    }
  }

  return out;
}

type Priority = 'seed-exact' | 'prefix-strong' | 'prefix-weak' | 'no-hint';

type ReportRow = {
  clienteId: number;
  nome: string;
  nif: string | null;
  morada: string | null;
  naviosCount: number;
  priority: Priority;
  suggestedIlha: Ilha | null;
  suggestionScore: number;
  ranking: Array<{ ilha: Ilha; score: number; sources: string[] }>;
  navios: Array<{
    navioId: number;
    nome: string;
    matricula: string;
    ilhaAtual: string;
    seedIlha: Ilha | null;
    prefix: string | null;
    prefixHint: {
      ilha: Ilha;
      confidence: number;
      total: number;
      topCount: number;
    } | null;
  }>;
};

async function main() {
  const seedPath = path.join(process.cwd(), 'prisma', 'seed_navios.sql');
  const seedByMatricula = loadSeedIlhaByMatricula(seedPath);
  const prefixMap = learnPrefixMap(seedPath);

  const clientes = await prisma.cliente.findMany({
    where: { OR: [{ ilha: null }, { ilha: '' }] },
    select: { id: true, nome: true, nif: true, morada: true },
    orderBy: { id: 'asc' },
  });

  const rows: ReportRow[] = [];

  for (const c of clientes) {
    const navios = await prisma.navio.findMany({
      where: { clienteId: c.id },
      select: { id: true, nome: true, matricula: true, ilha: true },
      orderBy: { id: 'asc' },
    });

    if (!navios.length) continue;

    const hints: Array<{ ilha: Ilha; source: string; weight: number }> = [];
    const navioDetails = navios.map((n) => {
      const matriculaNorm = normalize(n.matricula);
      const seedIlha = seedByMatricula.get(matriculaNorm) ?? null;
      const prefix = extractPrefix(n.matricula);
      const prefixDecision = prefix ? prefixMap.get(prefix) ?? null : null;
      const navioIlhaValida = asValidIlha(n.ilha);

      if (seedIlha) hints.push({ ilha: seedIlha, source: 'seed_matricula_exact', weight: 1.0 });
      if (prefixDecision) {
        const w = prefixDecision.confidence >= 0.9 ? 0.75 : 0.5;
        hints.push({ ilha: prefixDecision.ilha, source: 'prefix_map', weight: w });
      }
      if (navioIlhaValida && !isInvalidIlha(n.ilha)) hints.push({ ilha: navioIlhaValida, source: 'navio_ilha_atual', weight: 0.6 });

      return {
        navioId: n.id,
        nome: n.nome,
        matricula: n.matricula,
        ilhaAtual: n.ilha,
        seedIlha,
        prefix,
        prefixHint: prefixDecision
          ? {
              ilha: prefixDecision.ilha,
              confidence: Number(prefixDecision.confidence.toFixed(3)),
              total: prefixDecision.total,
              topCount: prefixDecision.topCount,
            }
          : null,
      };
    });

    const scoreByIlha = new Map<Ilha, number>();
    const sourcesByIlha = new Map<Ilha, Set<string>>();

    for (const h of hints) {
      scoreByIlha.set(h.ilha, (scoreByIlha.get(h.ilha) ?? 0) + h.weight);
      if (!sourcesByIlha.has(h.ilha)) sourcesByIlha.set(h.ilha, new Set<string>());
      sourcesByIlha.get(h.ilha)!.add(h.source);
    }

    const ordered = Array.from(scoreByIlha.entries())
      .map(([ilha, score]) => ({
        ilha,
        score: Number(score.toFixed(3)),
        sources: Array.from(sourcesByIlha.get(ilha) ?? []),
      }))
      .sort((a, b) => b.score - a.score);

    const top = ordered[0] ?? null;
    const second = ordered[1] ?? null;
    const clearWinner = !!top && (!second || top.score > second.score + 0.4);

    const hasSeedExact = navioDetails.some((n) => !!n.seedIlha);
    const hasStrongPrefix = navioDetails.some((n) => n.prefixHint && n.prefixHint.confidence >= 0.9);

    let priority: Priority = 'no-hint';
    if (hasSeedExact) priority = 'seed-exact';
    else if (hasStrongPrefix) priority = 'prefix-strong';
    else if (top) priority = 'prefix-weak';

    rows.push({
      clienteId: c.id,
      nome: c.nome,
      nif: c.nif,
      morada: c.morada,
      naviosCount: navios.length,
      priority,
      suggestedIlha: clearWinner ? top?.ilha ?? null : null,
      suggestionScore: clearWinner && top ? top.score : 0,
      ranking: ordered,
      navios: navioDetails,
    });
  }

  const priorityOrder: Record<Priority, number> = {
    'seed-exact': 0,
    'prefix-strong': 1,
    'prefix-weak': 2,
    'no-hint': 3,
  };

  const orderedRows = rows.sort((a: ReportRow, b: ReportRow) => {
    const p = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (p !== 0) return p;
    return b.suggestionScore - a.suggestionScore;
  });

  const summary = {
    totalClientesSemIlhaComNavios: orderedRows.length,
    seedExact: orderedRows.filter((r) => r.priority === 'seed-exact').length,
    prefixStrong: orderedRows.filter((r) => r.priority === 'prefix-strong').length,
    prefixWeak: orderedRows.filter((r) => r.priority === 'prefix-weak').length,
    noHint: orderedRows.filter((r) => r.priority === 'no-hint').length,
    comSugestaoClara: orderedRows.filter((r) => !!r.suggestedIlha).length,
  };

  const output = {
    generatedAt: new Date().toISOString(),
    summary,
    top30: orderedRows.slice(0, 30),
    all: orderedRows,
  };

  const outPath = path.join(process.cwd(), 'tmp_clientes_sem_ilha_com_navios_prioridade.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        summary,
        outputFile: outPath,
        top15: orderedRows.slice(0, 15).map((r) => ({
          clienteId: r.clienteId,
          nome: r.nome,
          naviosCount: r.naviosCount,
          priority: r.priority,
          suggestedIlha: r.suggestedIlha,
          suggestionScore: r.suggestionScore,
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
