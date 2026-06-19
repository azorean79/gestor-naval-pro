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

function normalizeText(value: string | undefined | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
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

type SeedCliente = { nome: string; morada: string | null; ilha: string | null };

type DBCliente = {
  id: number;
  nome: string;
  numeroCliente: string | null;
  nif: string | null;
  email: string | null;
  telefone: string | null;
  telmovel: string | null;
  morada: string | null;
  ilha: string | null;
};

function scoreCliente(c: DBCliente): number {
  let score = 0;
  if (c.numeroCliente) score += 5;
  if (c.nif) score += 5;
  if (c.email) score += 3;
  if (c.telefone) score += 1;
  if (c.telmovel) score += 1;
  if (c.morada && c.morada !== 'Morada não indicada') score += 2;
  if (c.ilha) score += 1;
  return score;
}

function chooseCanonical(group: DBCliente[]): DBCliente {
  return [...group].sort((a, b) => {
    const scoreDiff = scoreCliente(b) - scoreCliente(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.id - b.id;
  })[0];
}

function loadSeedClientes(sqlFilePath: string): SeedCliente[] {
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  const map = new Map<string, SeedCliente>();

  const re = /INSERT INTO "Cliente" \(nome, morada, ilha\) SELECT\s+('(?:''|[^'])*')\s*,\s*(NULL|'(?:''|[^'])*')\s*,\s*(NULL|'(?:''|[^'])*')\s+WHERE NOT EXISTS/gi;
  let match: RegExpExecArray | null;

  while ((match = re.exec(sql)) !== null) {
    const nome = parseSqlString(match[1]);
    const morada = parseSqlString(match[2]);
    const ilha = parseSqlString(match[3]);
    if (!nome) continue;

    const key = normalizeText(nome);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { nome, morada, ilha });
      continue;
    }

    map.set(key, {
      nome: prev.nome,
      morada: prev.morada ?? morada,
      ilha: prev.ilha ?? ilha,
    });
  }

  return Array.from(map.values());
}

async function main() {
  const seedSqlPath = path.join(process.cwd(), 'prisma', 'seed_navios.sql');
  const seedClientes = loadSeedClientes(seedSqlPath);

  const existing = await prisma.cliente.findMany({
    select: {
      id: true,
      nome: true,
      numeroCliente: true,
      nif: true,
      email: true,
      telefone: true,
      telmovel: true,
      morada: true,
      ilha: true,
    },
    orderBy: { id: 'asc' },
  });

  const byNorm = new Map<string, DBCliente[]>();
  for (const c of existing) {
    const key = normalizeText(c.nome);
    if (!key) continue;
    if (!byNorm.has(key)) byNorm.set(key, []);
    byNorm.get(key)!.push(c);
  }

  let created = 0;
  let updated = 0;
  let mergedGroups = 0;
  let mergedDeletedClientes = 0;
  let movedNavios = 0;
  let movedAgendas = 0;

  // 1) Importar todos os clientes do seed (incluindo os de 1 navio)
  for (const s of seedClientes) {
    const key = normalizeText(s.nome);
    const group = byNorm.get(key) ?? [];

    if (!group.length) {
      const newMorada = s.morada ?? 'Morada não indicada';
      const createdCliente = await prisma.cliente.create({
        data: {
          nome: s.nome,
          morada: newMorada,
          ilha: s.ilha,
        },
        select: {
          id: true,
          nome: true,
          numeroCliente: true,
          nif: true,
          email: true,
          telefone: true,
          telmovel: true,
          morada: true,
          ilha: true,
        },
      });
      byNorm.set(key, [createdCliente]);
      created += 1;
      continue;
    }

    const canonical = chooseCanonical(group);
    const newMorada =
      canonical.morada && canonical.morada !== 'Morada não indicada'
        ? canonical.morada
        : (s.morada ?? canonical.morada ?? 'Morada não indicada');
    const newIlha = canonical.ilha ?? s.ilha ?? null;

    if (newMorada !== canonical.morada || newIlha !== canonical.ilha) {
      const canonicalUpdated = await prisma.cliente.update({
        where: { id: canonical.id },
        data: { morada: newMorada, ilha: newIlha },
        select: {
          id: true,
          nome: true,
          numeroCliente: true,
          nif: true,
          email: true,
          telefone: true,
          telmovel: true,
          morada: true,
          ilha: true,
        },
      });

      const replaced = group.map((c) => (c.id === canonical.id ? canonicalUpdated : c));
      byNorm.set(key, replaced);
      updated += 1;
    }
  }

  // 2) Fusão de duplicados por nome normalizado (caixa/acentuação)
  for (const [key, group] of byNorm.entries()) {
    if (group.length <= 1) continue;

    const canonical = chooseCanonical(group);
    const duplicates = group.filter((c) => c.id !== canonical.id);
    if (!duplicates.length) continue;

    const duplicateIds = duplicates.map((d) => d.id);

    const txResult = await prisma.$transaction(async (tx) => {
      const nav = await tx.navio.updateMany({
        where: { clienteId: { in: duplicateIds } },
        data: { clienteId: canonical.id },
      });

      const ag = await tx.agenda.updateMany({
        where: { clienteId: { in: duplicateIds } },
        data: { clienteId: canonical.id },
      });

      await tx.cliente.deleteMany({ where: { id: { in: duplicateIds } } });

      return { navios: nav.count, agendas: ag.count };
    });

    movedNavios += txResult.navios;
    movedAgendas += txResult.agendas;
    mergedDeletedClientes += duplicateIds.length;
    mergedGroups += 1;

    byNorm.set(key, [canonical]);
  }

  // 3) Preencher moradas em falta para todos os restantes
  const afterAll = await prisma.cliente.findMany({
    select: { id: true, nome: true, morada: true, ilha: true },
    orderBy: { id: 'asc' },
  });

  const seedByNorm = new Map(seedClientes.map((s) => [normalizeText(s.nome), s]));
  let filledFallback = 0;
  let filledFromSeed = 0;

  for (const c of afterAll) {
    if (c.morada && c.morada.trim()) continue;

    const seed = seedByNorm.get(normalizeText(c.nome));
    const newMorada = seed?.morada ?? (c.ilha ? `Ilha ${c.ilha}` : 'Morada não indicada');
    const newIlha = c.ilha ?? seed?.ilha ?? null;

    await prisma.cliente.update({
      where: { id: c.id },
      data: { morada: newMorada, ilha: newIlha },
    });

    if (seed?.morada) filledFromSeed += 1;
    else filledFallback += 1;
  }

  const semMorada = await prisma.cliente.count({ where: { OR: [{ morada: null }, { morada: '' }] } });
  const totalClientes = await prisma.cliente.count();

  console.log(
    JSON.stringify(
      {
        seedClientes: seedClientes.length,
        created,
        updated,
        mergedGroups,
        mergedDeletedClientes,
        movedNavios,
        movedAgendas,
        filledFromSeed,
        filledFallback,
        totalClientes,
        clientesSemMorada: semMorada,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
