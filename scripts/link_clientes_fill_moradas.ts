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

function normalizeText(value: string | undefined): string {
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

function loadClientesFromSeedSql(sqlFilePath: string): Map<string, SeedCliente> {
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  const map = new Map<string, SeedCliente>();

  const re = /INSERT INTO "Cliente" \(nome, morada, ilha\) SELECT\s+'((?:''|[^'])*)'\s*,\s*(NULL|'(?:''|[^'])*')\s*,\s*(NULL|'(?:''|[^'])*')\s+WHERE NOT EXISTS/gi;
  let match: RegExpExecArray | null;

  while ((match = re.exec(sql)) !== null) {
    const nome = parseSqlString(`'${match[1]}'`);
    const morada = parseSqlString(match[2]);
    const ilha = parseSqlString(match[3]);
    if (!nome) continue;

    const key = normalizeText(nome);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { nome, morada, ilha });
      continue;
    }

    // Preferir registo com morada/ilha mais completa
    map.set(key, {
      nome: prev.nome,
      morada: prev.morada ?? morada,
      ilha: prev.ilha ?? ilha,
    });
  }

  return map;
}

async function main() {
  const seedSqlPath = path.join(process.cwd(), 'prisma', 'seed_navios.sql');
  const seedClientesByNorm = loadClientesFromSeedSql(seedSqlPath);

  const clientes = await prisma.cliente.findMany({
    select: { id: true, nome: true, morada: true, ilha: true },
    orderBy: { id: 'asc' },
  });

  let clientesUpdated = 0;
  let moradasFromSeed = 0;
  let moradasFallback = 0;

  for (const c of clientes) {
    const norm = normalizeText(c.nome);
    const seed = seedClientesByNorm.get(norm);

    const newIlha = c.ilha ?? seed?.ilha ?? null;
    const newMorada =
      c.morada ??
      seed?.morada ??
      (newIlha ? `Ilha ${newIlha}` : 'Morada não indicada');

    const shouldUpdate = (c.ilha ?? null) !== (newIlha ?? null) || (c.morada ?? null) !== (newMorada ?? null);
    if (!shouldUpdate) continue;

    await prisma.cliente.update({
      where: { id: c.id },
      data: {
        ilha: newIlha,
        morada: newMorada,
      },
    });

    clientesUpdated += 1;
    if (!c.morada && seed?.morada) moradasFromSeed += 1;
    if (!c.morada && !seed?.morada && newMorada) moradasFallback += 1;
  }

  const clientesAfter = await prisma.cliente.findMany({
    select: { id: true, nome: true, ilha: true },
  });

  const clienteByNorm = new Map(clientesAfter.map((c) => [normalizeText(c.nome), c.id]));
  const clienteDefaultByIlha = new Map<string, number>();

  for (const c of clientesAfter) {
    if (!c.ilha) continue;
    const nomeEsperado = normalizeText(`Cliente ${c.ilha}`);
    if (normalizeText(c.nome) === nomeEsperado && !clienteDefaultByIlha.has(normalizeText(c.ilha))) {
      clienteDefaultByIlha.set(normalizeText(c.ilha), c.id);
    }
  }

  const naviosSemCliente = await prisma.navio.findMany({
    where: { clienteId: null },
    select: { id: true, nome: true, ilha: true },
  });

  let linksUpdated = 0;
  for (const n of naviosSemCliente) {
    const byName = clienteByNorm.get(normalizeText(n.nome));
    const byIslandDefault = n.ilha ? clienteDefaultByIlha.get(normalizeText(n.ilha)) : undefined;
    const clienteId = byName ?? byIslandDefault;
    if (!clienteId) continue;

    await prisma.navio.update({ where: { id: n.id }, data: { clienteId } });
    linksUpdated += 1;
  }

  const totalWithMorada = await prisma.cliente.count({ where: { morada: { not: null } } });
  const totalSemMorada = await prisma.cliente.count({ where: { morada: null } });
  const withClient = await prisma.navio.count({ where: { clienteId: { not: null } } });
  const withoutClient = await prisma.navio.count({ where: { clienteId: null } });

  console.log('Ligação de clientes e preenchimento de moradas concluídos.');
  console.log(`Clientes atualizados: ${clientesUpdated}`);
  console.log(`Moradas vindas do seed SQL: ${moradasFromSeed}`);
  console.log(`Moradas fallback por ilha (Ilha X): ${moradasFallback}`);
  console.log(`Ligações navio->cliente atualizadas agora: ${linksUpdated}`);
  console.log(`Clientes com morada: ${totalWithMorada}`);
  console.log(`Clientes sem morada: ${totalSemMorada}`);
  console.log(`Navios com cliente: ${withClient}`);
  console.log(`Navios sem cliente: ${withoutClient}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
