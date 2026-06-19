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

const ilhaByPostalPrefix: Record<string, Ilha> = {
  '958': 'Santa Maria',
  '950': 'São Miguel',
  '956': 'São Miguel',
  '960': 'São Miguel',
  '962': 'São Miguel',
  '963': 'São Miguel',
  '965': 'São Miguel',
  '968': 'São Miguel',
  '970': 'Terceira',
  '976': 'Terceira',
  '988': 'Graciosa',
  '980': 'São Jorge',
  '985': 'São Jorge',
  '990': 'Faial',
  '993': 'Pico',
  '994': 'Pico',
  '995': 'Pico',
  '996': 'Flores',
  '997': 'Flores',
  '998': 'Corvo',
};

const directHints: Array<{ ilha: Ilha; patterns: string[] }> = [
  { ilha: 'Santa Maria', patterns: ['SANTA MARIA', 'VILA DO PORTO'] },
  { ilha: 'São Miguel', patterns: ['SAO MIGUEL', 'PONTA DELGADA', 'RIBEIRA GRANDE', 'LAGOA', 'VILA FRANCA DO CAMPO', 'NORDESTE', 'POVOACAO'] },
  { ilha: 'Terceira', patterns: ['TERCEIRA', 'ANGRA DO HEROISMO', 'PRAIA DA VITORIA'] },
  { ilha: 'Graciosa', patterns: ['GRACIOSA', 'SANTA CRUZ DA GRACIOSA', 'SAO MATEUS DA GRACIOSA'] },
  { ilha: 'São Jorge', patterns: ['SAO JORGE', 'VELAS', 'CALHETA', 'URZELINA'] },
  { ilha: 'Pico', patterns: ['PICO', 'MADALENA', 'LAJES DO PICO', 'SAO ROQUE DO PICO'] },
  { ilha: 'Faial', patterns: ['FAIAL', 'HORTA', 'PRAIA DO ALMOXARIFE', 'CASTELO BRANCO'] },
  { ilha: 'Flores', patterns: ['FLORES', 'SANTA CRUZ DAS FLORES', 'LAJES DAS FLORES'] },
  { ilha: 'Corvo', patterns: ['CORVO'] },
];

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

function isInvalidIlha(value: string | null | undefined): boolean {
  const v = normalize(value);
  return !v || v === 'N/A' || v === 'N D' || v === 'N/D' || v === 'DESCONHECIDA';
}

function asValidIlha(value: string | null | undefined): Ilha | null {
  if (!value) return null;
  const norm = normalize(value);
  for (const i of validIlhas) {
    if (normalize(i) === norm) return i;
  }
  return null;
}

function inferKeywordIlha(morada: string | null | undefined): Ilha | null {
  const m = normalize(morada);
  if (!m) return null;

  const hits = new Set<Ilha>();
  for (const item of directHints) {
    if (item.patterns.some((p) => m.includes(p))) hits.add(item.ilha);
  }

  if (hits.size === 1) return Array.from(hits)[0];
  return null;
}

function inferPostalIlha(morada: string | null | undefined): Ilha | null {
  const raw = morada ?? '';
  if (!raw.trim()) return null;

  const regex = /\b(\d{4})-\d{3}\b/g;
  const hits = new Set<Ilha>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const prefix = match[1].slice(0, 3);
    const ilha = ilhaByPostalPrefix[prefix];
    if (ilha) hits.add(ilha);
  }

  if (hits.size === 1) return Array.from(hits)[0];
  return null;
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

type PrefixDecision = { ilha: Ilha; confidence: number; total: number; topCount: number };

function learnPrefixIlhaMap(seedSqlPath: string): Map<string, PrefixDecision> {
  const sql = fs.readFileSync(seedSqlPath, 'utf8');
  const navioInsertRe =
    /INSERT INTO "Navio" \(nome, matricula, ilha, "tipoPesca", "clienteId"\) SELECT\s+('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,/gi;

  const byPrefix = new Map<string, Map<Ilha, number>>();
  let match: RegExpExecArray | null;

  while ((match = navioInsertRe.exec(sql)) !== null) {
    const matricula = parseSqlString(match[2]);
    const ilhaRaw = parseSqlString(match[3]);
    const ilha = asValidIlha(ilhaRaw);
    if (!matricula || !ilha) continue;

    const prefix = extractPrefix(matricula);
    if (!prefix) continue;

    if (!byPrefix.has(prefix)) byPrefix.set(prefix, new Map<Ilha, number>());
    const bucket = byPrefix.get(prefix)!;
    bucket.set(ilha, (bucket.get(ilha) ?? 0) + 1);
  }

  const result = new Map<string, PrefixDecision>();
  for (const [prefix, bucket] of byPrefix.entries()) {
    const ordered = Array.from(bucket.entries()).sort((a, b) => b[1] - a[1]);
    const total = ordered.reduce((acc, [, c]) => acc + c, 0);
    const [topIlha, topCount] = ordered[0];
    const secondCount = ordered[1]?.[1] ?? 0;
    const confidence = total > 0 ? topCount / total : 0;

    if (topCount >= 3 && topCount > secondCount && confidence >= 0.8) {
      result.set(prefix, { ilha: topIlha, confidence, total, topCount });
    }
  }

  return result;
}

function loadSeedClienteIlhaMap(seedSqlPath: string): Map<string, Ilha> {
  const sql = fs.readFileSync(seedSqlPath, 'utf8');
  const clienteInsertRe =
    /INSERT INTO "Cliente" \(nome, morada, ilha\) SELECT\s+('(?:''|[^'])*')\s*,\s*(NULL|'(?:''|[^'])*')\s*,\s*(NULL|'(?:''|[^'])*')\s+WHERE NOT EXISTS/gi;

  const out = new Map<string, Ilha>();
  let match: RegExpExecArray | null;

  while ((match = clienteInsertRe.exec(sql)) !== null) {
    const nome = parseSqlString(match[1]);
    const ilha = asValidIlha(parseSqlString(match[3]));
    if (!nome || !ilha) continue;

    const key = normalize(nome);
    if (!key) continue;
    if (!out.has(key)) out.set(key, ilha);
  }

  return out;
}

type Candidate = {
  ilha: Ilha;
  score: number;
  source: string;
  reason: string;
};

type Priority = 'high' | 'medium' | 'low';

type ReportRow = {
  clienteId: number;
  nome: string;
  nif: string | null;
  morada: string | null;
  naviosCount: number;
  naviosComIlhaValida: number;
  recommendedIlha: Ilha | null;
  recommendedScore: number;
  priority: Priority;
  hasConflict: boolean;
  canAutoApply: boolean;
  candidates: Array<{ ilha: Ilha; score: number; sources: string[]; reasons: string[] }>;
};

function addCandidate(target: Candidate[], candidate: Candidate) {
  target.push(candidate);
}

function rankPriority(score: number, hasConflict: boolean): Priority {
  if (hasConflict) return 'low';
  if (score >= 0.9) return 'high';
  if (score >= 0.8) return 'medium';
  return 'low';
}

async function main() {
  const seedSqlPath = path.join(process.cwd(), 'prisma', 'seed_navios.sql');
  const prefixMap = learnPrefixIlhaMap(seedSqlPath);
  const seedClienteIlha = loadSeedClienteIlhaMap(seedSqlPath);

  const clientes = await prisma.cliente.findMany({
    where: { OR: [{ ilha: null }, { ilha: '' }] },
    select: {
      id: true,
      nome: true,
      morada: true,
      nif: true,
    },
    orderBy: { id: 'asc' },
  });

  const report: ReportRow[] = [];

  for (const c of clientes) {
    const candidates: Candidate[] = [];

    const navios = await prisma.navio.findMany({
      where: { clienteId: c.id },
      select: { id: true, nome: true, matricula: true, ilha: true },
    });

    const seedIlha = seedClienteIlha.get(normalize(c.nome));
    if (seedIlha) {
      addCandidate(candidates, {
        ilha: seedIlha,
        score: 0.98,
        source: 'seed_cliente_exact',
        reason: 'Nome exato encontrado no seed_navios.sql com ilha definida',
      });
    }

    const keywordIlha = inferKeywordIlha(c.morada);
    const postalIlha = inferPostalIlha(c.morada);

    if (keywordIlha && postalIlha) {
      if (keywordIlha === postalIlha) {
        addCandidate(candidates, {
          ilha: keywordIlha,
          score: 0.95,
          source: 'morada_keyword+postal',
          reason: 'Morada confirma mesma ilha por texto e código postal',
        });
      }
    } else if (keywordIlha) {
      addCandidate(candidates, {
        ilha: keywordIlha,
        score: 0.87,
        source: 'morada_keyword',
        reason: 'Morada contém localidade claramente associada à ilha',
      });
    } else if (postalIlha) {
      addCandidate(candidates, {
        ilha: postalIlha,
        score: 0.82,
        source: 'morada_postal',
        reason: 'Morada contém código postal com prefixo consistente',
      });
    }

    const validNavioIlhas = navios
      .map((n) => asValidIlha(n.ilha))
      .filter((v): v is Ilha => !!v);

    if (validNavioIlhas.length > 0) {
      const counts = new Map<Ilha, number>();
      for (const i of validNavioIlhas) counts.set(i, (counts.get(i) ?? 0) + 1);

      const ordered = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
      const [topIlha, topCount] = ordered[0];
      const secondCount = ordered[1]?.[1] ?? 0;
      const ratio = topCount / validNavioIlhas.length;

      if (topCount > secondCount) {
        const score = Math.min(0.9, 0.68 + ratio * 0.22);
        addCandidate(candidates, {
          ilha: topIlha,
          score,
          source: 'navio_ilha_majority',
          reason: `Maioria das ilhas dos navios associados (${topCount}/${validNavioIlhas.length})`,
        });
      }
    }

    const prefixVotes = new Map<Ilha, number>();
    let prefixTotal = 0;
    for (const n of navios) {
      const prefix = extractPrefix(n.matricula);
      if (!prefix) continue;
      const learned = prefixMap.get(prefix);
      if (!learned) continue;

      prefixVotes.set(learned.ilha, (prefixVotes.get(learned.ilha) ?? 0) + 1);
      prefixTotal += 1;
    }

    if (prefixTotal > 0) {
      const ordered = Array.from(prefixVotes.entries()).sort((a, b) => b[1] - a[1]);
      const [topIlha, topCount] = ordered[0];
      const secondCount = ordered[1]?.[1] ?? 0;
      if (topCount > secondCount) {
        const ratio = topCount / prefixTotal;
        const score = Math.min(0.84, 0.62 + ratio * 0.2);
        addCandidate(candidates, {
          ilha: topIlha,
          score,
          source: 'matricula_prefix_vote',
          reason: `Prefixos de matrícula dos navios apontam para ${topIlha} (${topCount}/${prefixTotal})`,
        });
      }
    }

    const byIlha = new Map<Ilha, { maxScore: number; sources: string[]; reasons: string[] }>();
    for (const cand of candidates) {
      const current = byIlha.get(cand.ilha);
      if (!current) {
        byIlha.set(cand.ilha, { maxScore: cand.score, sources: [cand.source], reasons: [cand.reason] });
      } else {
        current.maxScore = Math.max(current.maxScore, cand.score);
        if (!current.sources.includes(cand.source)) current.sources.push(cand.source);
        if (!current.reasons.includes(cand.reason)) current.reasons.push(cand.reason);
      }
    }

    const merged = Array.from(byIlha.entries())
      .map(([ilha, d]) => ({ ilha, score: Number(d.maxScore.toFixed(3)), sources: d.sources, reasons: d.reasons }))
      .sort((a, b) => b.score - a.score);

    const top = merged[0] ?? null;
    const second = merged[1] ?? null;
    const hasConflict = !!top && !!second && Math.abs(top.score - second.score) < 0.1;
    const recommendedIlha = top && !hasConflict ? top.ilha : null;
    const recommendedScore = top ? top.score : 0;

    const priority = rankPriority(recommendedScore, hasConflict);
    const canAutoApply = !!recommendedIlha && !hasConflict && recommendedScore >= 0.9;

    report.push({
      clienteId: c.id,
      nome: c.nome,
      nif: c.nif,
      morada: c.morada,
      naviosCount: navios.length,
      naviosComIlhaValida: validNavioIlhas.length,
      recommendedIlha,
      recommendedScore,
      priority,
      hasConflict,
      canAutoApply,
      candidates: merged,
    });
  }

  const summary = {
    totalSemIlha: report.length,
    highPriority: report.filter((r) => r.priority === 'high').length,
    mediumPriority: report.filter((r) => r.priority === 'medium').length,
    lowPriority: report.filter((r) => r.priority === 'low').length,
    canAutoApply: report.filter((r) => r.canAutoApply).length,
    withRecommendation: report.filter((r) => !!r.recommendedIlha).length,
    withConflict: report.filter((r) => r.hasConflict).length,
  };

  const ordered = report.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 } as const;
    if (p[a.priority] !== p[b.priority]) return p[a.priority] - p[b.priority];
    return b.recommendedScore - a.recommendedScore;
  });

  const output = {
    generatedAt: new Date().toISOString(),
    summary,
    top20: ordered.slice(0, 20),
    all: ordered,
  };

  const outPath = path.join(process.cwd(), 'tmp_cliente_ilha_sugestoes.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        summary,
        outputFile: outPath,
        top10: ordered.slice(0, 10).map((r) => ({
          clienteId: r.clienteId,
          nome: r.nome,
          recommendedIlha: r.recommendedIlha,
          recommendedScore: r.recommendedScore,
          priority: r.priority,
          canAutoApply: r.canAutoApply,
          hasConflict: r.hasConflict,
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
