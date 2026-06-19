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

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function parseSqlString(token: string | null | undefined): string | null {
  if (!token) return null;
  const t = token.trim();
  if (t.toUpperCase() === 'NULL') return null;
  if (t.startsWith("'") && t.endsWith("'")) {
    return t.slice(1, -1).replace(/''/g, "'").trim();
  }
  return t.trim();
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

type SeedRow = { matricula: string; ilha: string };

function loadSeedRows(sqlPath: string): SeedRow[] {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const rows: SeedRow[] = [];

  const navioInsertRe =
    /INSERT INTO "Navio" \(nome, matricula, ilha, "tipoPesca", "clienteId"\) SELECT\s+('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,/gi;

  let match: RegExpExecArray | null;
  while ((match = navioInsertRe.exec(sql)) !== null) {
    const matricula = parseSqlString(match[2]);
    const ilha = parseSqlString(match[3]);
    if (!matricula || !ilha || isInvalidIlha(ilha)) continue;
    rows.push({ matricula, ilha });
  }

  return rows;
}

type PrefixDecision = {
  prefix: string;
  ilha: string;
  total: number;
  topCount: number;
  confidence: number;
  evidence: Record<string, number>;
};

function buildPrefixMap(seedRows: SeedRow[]): Map<string, PrefixDecision> {
  const countByPrefix = new Map<string, Map<string, number>>();

  for (const row of seedRows) {
    const prefix = extractPrefix(row.matricula);
    if (!prefix) continue;

    const ilhaNorm = row.ilha.trim();
    if (!countByPrefix.has(prefix)) countByPrefix.set(prefix, new Map<string, number>());
    const ilhaCounts = countByPrefix.get(prefix)!;
    ilhaCounts.set(ilhaNorm, (ilhaCounts.get(ilhaNorm) ?? 0) + 1);
  }

  const result = new Map<string, PrefixDecision>();

  for (const [prefix, ilhaCounts] of countByPrefix.entries()) {
    const ordered = Array.from(ilhaCounts.entries()).sort((a, b) => b[1] - a[1]);
    const total = ordered.reduce((acc, [, c]) => acc + c, 0);
    const [topIlha, topCount] = ordered[0];
    const secondCount = ordered[1]?.[1] ?? 0;
    const confidence = total > 0 ? topCount / total : 0;

    const hasClearWinner = topCount > secondCount;
    const enoughEvidence = topCount >= 3;
    const highConfidence = confidence >= 0.8;

    if (hasClearWinner && enoughEvidence && highConfidence) {
      result.set(prefix, {
        prefix,
        ilha: topIlha,
        total,
        topCount,
        confidence,
        evidence: Object.fromEntries(ordered),
      });
    }
  }

  return result;
}

async function main() {
  const seedPath = path.join(process.cwd(), 'prisma', 'seed_navios.sql');
  const seedRows = loadSeedRows(seedPath);
  const prefixMap = buildPrefixMap(seedRows);

  const invalidFilter = {
    OR: [
      { ilha: '' },
      { ilha: 'N/A' },
      { ilha: 'N/D' },
      { ilha: 'N D' },
      { ilha: 'Desconhecida' },
    ],
  };

  const navios = await prisma.navio.findMany({
    where: invalidFilter,
    select: { id: true, nome: true, matricula: true, ilha: true },
    orderBy: { id: 'asc' },
  });

  let updated = 0;
  const detalhes: Array<{ id: number; nome: string; matricula: string; ilhaNova: string; prefix: string }> = [];
  const unmappedPrefixes = new Map<string, number>();

  for (const n of navios) {
    const prefix = extractPrefix(n.matricula);
    if (!prefix) continue;

    const decision = prefixMap.get(prefix);
    if (!decision) {
      unmappedPrefixes.set(prefix, (unmappedPrefixes.get(prefix) ?? 0) + 1);
      continue;
    }

    await prisma.navio.update({
      where: { id: n.id },
      data: { ilha: decision.ilha },
    });

    updated += 1;
    detalhes.push({
      id: n.id,
      nome: n.nome,
      matricula: n.matricula,
      ilhaNova: decision.ilha,
      prefix,
    });
  }

  const invalidAfter = await prisma.navio.count({ where: invalidFilter });

  const prefixDecisions = Array.from(prefixMap.values())
    .sort((a, b) => a.prefix.localeCompare(b.prefix))
    .map((d) => ({
      prefix: d.prefix,
      ilha: d.ilha,
      total: d.total,
      topCount: d.topCount,
      confidence: Number(d.confidence.toFixed(3)),
      evidence: d.evidence,
    }));

  console.log(
    JSON.stringify(
      {
        seedRowsWithIlha: seedRows.length,
        learnedPrefixMappings: prefixDecisions.length,
        prefixDecisions,
        naviosSemIlhaAntes: navios.length,
        updated,
        naviosSemIlhaDepois: invalidAfter,
        unmappedPrefixes: Object.fromEntries(Array.from(unmappedPrefixes.entries()).sort((a, b) => b[1] - a[1])),
        detalhes,
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
