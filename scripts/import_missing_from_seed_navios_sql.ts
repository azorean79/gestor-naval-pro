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

function inferTipoPescaFromMatricula(matricula: string | undefined): string {
  const m = (matricula ?? '').trim().toUpperCase();
  if (m.endsWith('-L') || m.endsWith(' L') || m.endsWith('L')) return 'Pesca Local';
  if (m.endsWith('-C') || m.endsWith(' C') || m.endsWith('C')) return 'Pesca Costeira';
  return 'Marítimo Turística';
}

type SeedCliente = { nome: string; morada: string | null; ilha: string | null };
type SeedNavio = {
  nome: string;
  matricula: string;
  ilha: string | null;
  tipoPesca: string | null;
  clienteNome: string | null;
};

function loadSeedData(sqlFilePath: string): { clientes: SeedCliente[]; navios: SeedNavio[] } {
  const sql = fs.readFileSync(sqlFilePath, 'utf8');

  const clientesMap = new Map<string, SeedCliente>();
  const clientesRe = /INSERT INTO "Cliente" \(nome, morada, ilha\) SELECT\s+('(?:''|[^'])*')\s*,\s*(NULL|'(?:''|[^'])*')\s*,\s*(NULL|'(?:''|[^'])*')\s+WHERE NOT EXISTS/gi;
  let cMatch: RegExpExecArray | null;
  while ((cMatch = clientesRe.exec(sql)) !== null) {
    const nome = parseSqlString(cMatch[1]);
    const morada = parseSqlString(cMatch[2]);
    const ilha = parseSqlString(cMatch[3]);
    if (!nome) continue;

    const key = normalizeText(nome);
    const prev = clientesMap.get(key);
    if (!prev) {
      clientesMap.set(key, { nome, morada, ilha });
      continue;
    }

    clientesMap.set(key, {
      nome: prev.nome,
      morada: prev.morada ?? morada,
      ilha: prev.ilha ?? ilha,
    });
  }

  const navios: SeedNavio[] = [];
  const naviosRe = /INSERT INTO "Navio" \(nome, matricula, ilha, "tipoPesca", "clienteId"\) SELECT\s+('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*('(?:''|[^'])*'|NULL)\s*,\s*\(SELECT id FROM "Cliente" WHERE nome =\s*(NULL|'(?:''|[^'])*')\s*LIMIT 1\)\s+WHERE NOT EXISTS/gi;
  let nMatch: RegExpExecArray | null;
  while ((nMatch = naviosRe.exec(sql)) !== null) {
    const nome = parseSqlString(nMatch[1]);
    const matricula = parseSqlString(nMatch[2]);
    const ilha = parseSqlString(nMatch[3]);
    const tipoPesca = parseSqlString(nMatch[4]);
    const clienteNome = parseSqlString(nMatch[5]);

    if (!nome || !matricula) continue;

    navios.push({ nome, matricula, ilha, tipoPesca, clienteNome });
  }

  return { clientes: Array.from(clientesMap.values()), navios };
}

async function main() {
  const seedSqlPath = path.join(process.cwd(), 'prisma', 'seed_navios.sql');
  const { clientes: seedClientes, navios: seedNavios } = loadSeedData(seedSqlPath);

  const existingClientes = await prisma.cliente.findMany({
    select: { id: true, nome: true, morada: true, ilha: true },
    orderBy: { id: 'asc' },
  });

  const clienteByNorm = new Map<string, { id: number; nome: string; morada: string | null; ilha: string | null }>();
  for (const c of existingClientes) {
    const key = normalizeText(c.nome);
    if (!key) continue;
    if (!clienteByNorm.has(key)) {
      clienteByNorm.set(key, c);
    }
  }

  let clientesCriados = 0;
  let clientesAtualizados = 0;

  for (const sc of seedClientes) {
    const key = normalizeText(sc.nome);
    if (!key) continue;

    const existing = clienteByNorm.get(key);
    if (!existing) {
      const created = await prisma.cliente.create({
        data: {
          nome: sc.nome,
          morada: sc.morada,
          ilha: sc.ilha,
        },
        select: { id: true, nome: true, morada: true, ilha: true },
      });
      clienteByNorm.set(key, created);
      clientesCriados += 1;
      continue;
    }

    const newMorada = existing.morada ?? sc.morada ?? null;
    const newIlha = existing.ilha ?? sc.ilha ?? null;
    if (newMorada !== existing.morada || newIlha !== existing.ilha) {
      const updated = await prisma.cliente.update({
        where: { id: existing.id },
        data: { morada: newMorada, ilha: newIlha },
        select: { id: true, nome: true, morada: true, ilha: true },
      });
      clienteByNorm.set(key, updated);
      clientesAtualizados += 1;
    }
  }

  const existingNavios = await prisma.navio.findMany({
    select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true, clienteId: true },
    orderBy: { id: 'asc' },
  });

  const navioByMatriculaNorm = new Map<string, (typeof existingNavios)[number]>();
  for (const n of existingNavios) {
    const key = normalizeText(n.matricula);
    if (!key) continue;
    if (!navioByMatriculaNorm.has(key)) navioByMatriculaNorm.set(key, n);
  }

  let naviosCriados = 0;
  let naviosAtualizados = 0;

  for (const sn of seedNavios) {
    const matriculaNorm = normalizeText(sn.matricula);
    if (!matriculaNorm) continue;

    const existing = navioByMatriculaNorm.get(matriculaNorm);
    const clienteIdFromSeed = sn.clienteNome
      ? clienteByNorm.get(normalizeText(sn.clienteNome))?.id ?? null
      : null;

    const ilha = sn.ilha ?? 'N/A';
    const tipoPesca = sn.tipoPesca ?? inferTipoPescaFromMatricula(sn.matricula);

    if (!existing) {
      const created = await prisma.navio.create({
        data: {
          nome: sn.nome,
          matricula: sn.matricula,
          ilha,
          tipoPesca,
          clienteId: clienteIdFromSeed,
        },
        select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true, clienteId: true },
      });
      navioByMatriculaNorm.set(matriculaNorm, created);
      naviosCriados += 1;
      continue;
    }

    const newNome = existing.nome || sn.nome;
    const newIlha = existing.ilha || ilha;
    const newTipoPesca = existing.tipoPesca || tipoPesca;
    const newClienteId = existing.clienteId ?? clienteIdFromSeed;

    const needsUpdate =
      newNome !== existing.nome ||
      newIlha !== existing.ilha ||
      newTipoPesca !== existing.tipoPesca ||
      newClienteId !== existing.clienteId;

    if (!needsUpdate) continue;

    const updated = await prisma.navio.update({
      where: { id: existing.id },
      data: {
        nome: newNome,
        ilha: newIlha,
        tipoPesca: newTipoPesca,
        clienteId: newClienteId,
      },
      select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true, clienteId: true },
    });

    navioByMatriculaNorm.set(matriculaNorm, updated);
    naviosAtualizados += 1;
  }

  const adrianoClienteVariants = await prisma.cliente.findMany({
    where: {
      OR: [
        { nome: { contains: 'Adriano', mode: 'insensitive' } },
        { nome: { contains: 'Medeiros', mode: 'insensitive' } },
      ],
    },
    select: { id: true, nome: true, morada: true, ilha: true },
    orderBy: { id: 'asc' },
  });

  const ratinho = await prisma.navio.findMany({
    where: { nome: { equals: 'RATINHO', mode: 'insensitive' } },
    select: { id: true, nome: true, matricula: true, clienteId: true, cliente: { select: { nome: true } } },
  });

  console.log(JSON.stringify({
    seedClientes: seedClientes.length,
    seedNavios: seedNavios.length,
    clientesCriados,
    clientesAtualizados,
    naviosCriados,
    naviosAtualizados,
    adrianoClienteVariants,
    ratinho,
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
