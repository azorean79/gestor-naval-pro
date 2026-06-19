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

const APPLY = (process.env.APPLY ?? '').toLowerCase() === 'true';

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeCompact(value: string | null | undefined): string {
  return normalizeText(value).replace(/\s+/g, '');
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

function isGenericClienteName(name: string | null | undefined): boolean {
  const n = normalizeText(name);
  return n.startsWith('CLIENTE ');
}

type SeedNavio = {
  nome: string;
  matricula: string | null;
  clienteNome: string | null;
};

function loadSeedNavios(seedSqlPath: string): SeedNavio[] {
  const sql = fs.readFileSync(seedSqlPath, 'utf8');
  const navios: SeedNavio[] = [];

  const naviosRe =
    /INSERT INTO "Navio" \(nome, matricula, ilha, "tipoPesca", "clienteId"\) SELECT\s+('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*\(SELECT id FROM "Cliente" WHERE nome =\s*(NULL|'(?:''|[^'])*')\s*LIMIT 1\)\s+WHERE NOT EXISTS/gi;

  let match: RegExpExecArray | null;
  while ((match = naviosRe.exec(sql)) !== null) {
    const nome = parseSqlString(match[1]);
    const matricula = parseSqlString(match[2]);
    const clienteNome = parseSqlString(match[5]);
    if (!nome) continue;
    navios.push({ nome, matricula, clienteNome });
  }

  return navios;
}

async function main() {
  const seedPath = path.join(process.cwd(), 'prisma', 'seed_navios.sql');
  const reportPath = path.join(process.cwd(), 'tmp_reconciliacao_navios_clientes_seed_sql.json');

  const seedNavios = loadSeedNavios(seedPath);

  // Build best cliente per ship by matricula and by nome
  const byMatFreq = new Map<string, Map<string, number>>();
  const byNameFreq = new Map<string, Map<string, number>>();
  const clienteDisplayByNorm = new Map<string, string>();

  for (const s of seedNavios) {
    const clienteNorm = normalizeCompact(s.clienteNome);
    if (!clienteNorm) continue;
    if (!clienteDisplayByNorm.has(clienteNorm) && s.clienteNome) {
      clienteDisplayByNorm.set(clienteNorm, s.clienteNome);
    }

    const matNorm = normalizeCompact(s.matricula);
    if (matNorm) {
      const bucket = byMatFreq.get(matNorm) ?? new Map<string, number>();
      bucket.set(clienteNorm, (bucket.get(clienteNorm) ?? 0) + 1);
      byMatFreq.set(matNorm, bucket);
    }

    const nameNorm = normalizeCompact(s.nome);
    if (nameNorm) {
      const bucket = byNameFreq.get(nameNorm) ?? new Map<string, number>();
      bucket.set(clienteNorm, (bucket.get(clienteNorm) ?? 0) + 1);
      byNameFreq.set(nameNorm, bucket);
    }
  }

  function pickBest(freq: Map<string, number> | undefined): string | null {
    if (!freq || !freq.size) return null;
    let best = '';
    let bestCount = -1;
    for (const [k, v] of freq.entries()) {
      if (v > bestCount) {
        best = k;
        bestCount = v;
      }
    }
    return best || null;
  }

  const clientes = await prisma.cliente.findMany({ select: { id: true, nome: true } });
  const clienteByNorm = new Map(clientes.map((c) => [normalizeCompact(c.nome), c.id]));

  async function getOrCreateClienteId(clienteNorm: string): Promise<number | null> {
    const found = clienteByNorm.get(clienteNorm);
    if (found) return found;

    const display = clienteDisplayByNorm.get(clienteNorm) || clienteNorm;

    if (!APPLY) {
      const fakeId = -(clienteByNorm.size + 1);
      clienteByNorm.set(clienteNorm, fakeId);
      return fakeId;
    }

    const created = await prisma.cliente.create({ data: { nome: display }, select: { id: true } });
    clienteByNorm.set(clienteNorm, created.id);
    return created.id;
  }

  const navios = await prisma.navio.findMany({
    select: {
      id: true,
      nome: true,
      matricula: true,
      clienteId: true,
      cliente: { select: { nome: true } },
    },
  });

  const beforeSemCliente = await prisma.navio.count({ where: { clienteId: null } });

  let candidates = 0;
  let updated = 0;
  let already = 0;
  let createdClientes = 0;
  let byMat = 0;
  let byName = 0;
  let skippedNoMap = 0;
  let skippedSpecific = 0;

  for (const n of navios) {
    const isTarget = !n.clienteId || isGenericClienteName(n.cliente?.nome);
    if (!isTarget) continue;

    const matNorm = normalizeCompact(n.matricula);
    const nameNorm = normalizeCompact(n.nome);

    let clienteNorm: string | null = null;
    if (matNorm) {
      clienteNorm = pickBest(byMatFreq.get(matNorm));
      if (clienteNorm) byMat += 1;
    }
    if (!clienteNorm && nameNorm) {
      clienteNorm = pickBest(byNameFreq.get(nameNorm));
      if (clienteNorm) byName += 1;
    }

    if (!clienteNorm) {
      skippedNoMap += 1;
      continue;
    }

    candidates += 1;

    const clienteId = await getOrCreateClienteId(clienteNorm);
    if (!clienteId) {
      skippedNoMap += 1;
      continue;
    }
    if (clienteId < 0) createdClientes += 1;

    if (n.clienteId === clienteId) {
      already += 1;
      continue;
    }

    if (n.clienteId && n.cliente?.nome && !isGenericClienteName(n.cliente.nome)) {
      skippedSpecific += 1;
      continue;
    }

    if (APPLY && clienteId > 0) {
      await prisma.navio.update({ where: { id: n.id }, data: { clienteId } });
    }

    updated += 1;
  }

  if (APPLY) {
    const clientesAfter = await prisma.cliente.count();
    createdClientes = Math.max(0, clientesAfter - clientes.length);
  }

  const afterSemCliente = await prisma.navio.count({ where: { clienteId: null } });

  const genericRows = await prisma.navio.findMany({
    where: { clienteId: { not: null } },
    select: { cliente: { select: { nome: true } } },
  });
  let afterGeneric = 0;
  for (const row of genericRows) {
    if (isGenericClienteName(row.cliente?.nome)) afterGeneric += 1;
  }

  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    timestamp: new Date().toISOString(),
    totals: {
      seedNavios: seedNavios.length,
      mapByMat: byMatFreq.size,
      mapByName: byNameFreq.size,
      candidates,
      updated,
      already,
      createdClientes,
      byMatHits: byMat,
      byNameHits: byName,
      skippedNoMap,
      skippedSpecific,
      beforeSemCliente,
      afterSemCliente,
      afterGeneric,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Modo: ${report.mode}`);
  console.log(`Seed navios lidos: ${seedNavios.length}`);
  console.log(`Candidatos: ${candidates}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Criados clientes: ${createdClientes}`);
  console.log(`Hit por matrícula: ${byMat}`);
  console.log(`Hit por nome: ${byName}`);
  console.log(`Sem mapa: ${skippedNoMap}`);
  console.log(`Ignorados por cliente específico: ${skippedSpecific}`);
  console.log(`Sem cliente (antes/depois): ${beforeSemCliente} -> ${afterSemCliente}`);
  console.log(`Com cliente genérico após execução: ${afterGeneric}`);
  console.log(`Relatório: ${reportPath}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
