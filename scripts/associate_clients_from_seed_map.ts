import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import vm from 'vm';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.gestornavalpro_DATABASE_URL ??
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

type SeedEntry = { nome: string; navios: string[] };

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function readSeedMap(filePath: string): SeedEntry[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const startMarker = 'const clientesNavios = [';
  const start = content.indexOf(startMarker);
  if (start < 0) throw new Error('clientesNavios não encontrado em seed_navios.ts');

  const afterStart = content.slice(start + startMarker.length);
  const end = afterStart.indexOf('];');
  if (end < 0) throw new Error('fim de clientesNavios não encontrado em seed_navios.ts');

  const arrayCode = `[${afterStart.slice(0, end)}]`;
  const sandbox: { result?: unknown } = {};
  vm.createContext(sandbox);
  const script = new vm.Script(`result = ${arrayCode}`);
  script.runInContext(sandbox);

  const result = sandbox.result;
  if (!Array.isArray(result)) {
    throw new Error('clientesNavios extraído não é array');
  }

  const parsed: SeedEntry[] = [];
  for (const item of result) {
    if (!item || typeof item !== 'object') continue;
    const nome = (item as { nome?: unknown }).nome;
    const navios = (item as { navios?: unknown }).navios;
    if (typeof nome !== 'string' || !Array.isArray(navios)) continue;
    parsed.push({ nome, navios: navios.filter((n): n is string => typeof n === 'string') });
  }

  return parsed;
}

async function ensureClienteIdByName(nome: string, cache: Map<string, number>): Promise<number> {
  const key = normalizeName(nome);
  const cached = cache.get(key);
  if (cached) return cached;

  const exact = await prisma.cliente.findFirst({ where: { nome }, select: { id: true, tipoCliente: true } });
  if (exact) {
    // Atualiza tipoCliente se necessário
    if (!exact.tipoCliente) {
      await prisma.cliente.update({ where: { id: exact.id }, data: { tipoCliente: inferTipoCliente(nome) } });
    }
    cache.set(key, exact.id);
    return exact.id;
  }

  const created = await prisma.cliente.create({ data: { nome, tipoCliente: inferTipoCliente(nome) } , select: { id: true } });
  cache.set(key, created.id);
  return created.id;
}

function inferTipoCliente(nome: string): string {
  // Lógica simples: se nome contém "turismo" ou "turístico" => operador, senão armador
  const n = nome.toLowerCase();
  if (n.includes("turismo") || n.includes("turístico") || n.includes("turistic")) return "operador";
  return "armador";
}

async function main() {
  const seedPath = path.join(process.cwd(), 'prisma', 'seed_navios.ts');
  const seedEntries = readSeedMap(seedPath);

  const navioToCliente = new Map<string, string>();
  for (const entry of seedEntries) {
    for (const navioName of entry.navios) {
      const key = normalizeName(navioName);
      if (!key) continue;
      if (!navioToCliente.has(key)) navioToCliente.set(key, entry.nome);
    }
  }

  const existingClientes = await prisma.cliente.findMany({ select: { id: true, nome: true } });
  const clienteIdCache = new Map<string, number>(existingClientes.map((c) => [normalizeName(c.nome), c.id]));

  const navios = await prisma.navio.findMany({ select: { id: true, nome: true, clienteId: true, tipoNavio: true, ilha: true, matricula: true, tipoPesca: true } });

  let matchedByMap = 0;
  let updated = 0;
  let createdClients = 0;

  for (const navio of navios) {
    const key = normalizeName(navio.nome);
    const clienteNome = navioToCliente.get(key);
    if (!clienteNome) continue;
    matchedByMap += 1;

    const beforeSize = clienteIdCache.size;
    const clienteId = await ensureClienteIdByName(clienteNome, clienteIdCache);
    if (clienteIdCache.size > beforeSize) createdClients += 1;

    // Atualiza tipoNavio, ilha, matricula e tipoPesca se necessário
    let tipoNavio = navio.tipoNavio;
    if (!tipoNavio) tipoNavio = inferTipoNavio(navio.nome);
    let ilha = navio.ilha;
    if (!ilha) ilha = inferIlha(navio.nome);
    let matricula = navio.matricula;
    if (!matricula) matricula = inferMatricula(navio.nome);
    let tipoPesca = navio.tipoPesca;
    if (!tipoPesca) tipoPesca = inferTipoPesca(navio.nome);
    await prisma.navio.update({ where: { id: navio.id }, data: { tipoNavio, ilha, matricula, tipoPesca, clienteId } });
    updated += 1;
  function inferIlha(nome: string): string {
    // Exemplo: busca por padrões de ilha no nome
    const ilhas = ["Faial", "Pico", "São Jorge", "Terceira", "Graciosa", "São Miguel", "Santa Maria", "Flores", "Corvo"];
    for (const ilha of ilhas) {
      if (nome.toLowerCase().includes(ilha.toLowerCase())) return ilha;
    }
    return "";
  }

  function inferMatricula(nome: string): string {
    // Exemplo: extrai matrícula se houver padrão típico (ex: "H-1234-L")
    const match = nome.match(/[A-Z]-\d{3,4}-[A-Z]/);
    return match ? match[0] : "";
  }

  function inferTipoPesca(nome: string): string {
    // Exemplo: busca por padrões comuns de tipo de pesca
    const tipos = ["Costeira", "Local", "Auxiliar", "Pesca local", "Auxiliar local", "Pesca costeira"];
    for (const tipo of tipos) {
      if (nome.toLowerCase().includes(tipo.toLowerCase())) return tipo;
    }
    return "Costeira";
  }
  }

function inferTipoNavio(nome: string): string {
  // Lógica simples: se nome contém "turismo" ou "turístico" => turistico, senão pesca
  const n = nome.toLowerCase();
  if (n.includes("turismo") || n.includes("turístico") || n.includes("turistic")) return "turistico";
  return "pesca";
  }

  const withClient = await prisma.navio.count({ where: { clienteId: { not: null } } });
  const withoutClient = await prisma.navio.count({ where: { clienteId: null } });

  console.log(JSON.stringify({
    seedEntries: seedEntries.length,
    navioMapEntries: navioToCliente.size,
    naviosTotal: navios.length,
    matchedByMap,
    updated,
    createdClients,
    withClient,
    withoutClient,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Erro ao associar clientes por seed map:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
