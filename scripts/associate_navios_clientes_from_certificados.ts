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

type CertRow = {
  file: string;
  shipName?: string;
};

type CertRowsFile = {
  rows?: CertRow[];
};

type OwnerRawRow = {
  arquivo?: string;
  dados?: unknown[];
};

function safeString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.result === 'string') return obj.result.trim();
    if (typeof obj.text === 'string') return obj.text.trim();
    if (Array.isArray(obj.richText)) {
      const text = obj.richText
        .map((x) => (x && typeof x === 'object' && 'text' in x ? String((x as { text?: unknown }).text ?? '') : ''))
        .join('')
        .trim();
      if (text) return text;
    }
  }
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeText(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function readJsonWithEncodingFallback<T>(filePath: string): T {
  const rawBuffer = fs.readFileSync(filePath);
  let rawUtf8 = rawBuffer.toString('utf8');
  if (rawUtf8.charCodeAt(0) === 0xfeff) rawUtf8 = rawUtf8.slice(1);
  try {
    return JSON.parse(rawUtf8) as T;
  } catch {
    const rawUtf16 = rawBuffer.toString('utf16le').replace(/^\uFEFF/, '');
    return JSON.parse(rawUtf16) as T;
  }
}

function isOwnerLabel(value: string): boolean {
  const n = normalizeText(value);
  return n === 'SHIP OWNER' || n.startsWith('SHIP OWNER ') || n === 'ARMADOR' || n.startsWith('ARMADOR ');
}

function isBadOwner(value: string): boolean {
  const n = normalizeText(value);
  if (!n) return true;
  if (n.length < 4) return true;
  if (isOwnerLabel(value)) return true;
  if (n.includes('SIGNATURE')) return true;
  if (n.includes('OREY GROUP') || n.includes('OREY FINANCIAL')) return true;
  return false;
}

function extractOwnerFromDados(dados: unknown[]): string | null {
  const cells = dados.map((d) => safeString(d));
  let labelIdx = -1;
  for (let i = 0; i < cells.length; i++) {
    if (isOwnerLabel(cells[i])) {
      labelIdx = i;
      break;
    }
  }

  if (labelIdx < 0) return null;

  const candidates: string[] = [];
  for (let i = labelIdx + 1; i < cells.length; i++) {
    const c = cells[i];
    if (!c || isBadOwner(c)) continue;
    candidates.push(c);
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] ?? null;
}

async function main() {
  const certRowsPath = path.join(process.cwd(), 'scripts', 'jangadas_navios_associadas_2025.json');
  const ownersRawPath = path.join(process.cwd(), 'jangadas_certificados_2025.json');

  const certRowsJson = readJsonWithEncodingFallback<CertRowsFile>(certRowsPath);
  const certRows = Array.isArray(certRowsJson.rows) ? certRowsJson.rows : [];

  const ownerRawRows = readJsonWithEncodingFallback<OwnerRawRow[]>(ownersRawPath);
  const ownerByFileNorm = new Map<string, string>();

  for (const row of ownerRawRows) {
    const file = safeString(row.arquivo);
    const dados = Array.isArray(row.dados) ? row.dados : [];
    if (!file || !dados.length) continue;

    const owner = extractOwnerFromDados(dados);
    if (!owner || isBadOwner(owner)) continue;

    const fileNorm = normalizeText(file);
    if (!ownerByFileNorm.has(fileNorm)) ownerByFileNorm.set(fileNorm, owner);
  }

  // shipNorm -> ownerNorm frequency
  const shipOwnerFreq = new Map<string, Map<string, number>>();
  for (const row of certRows) {
    const fileNorm = normalizeText(safeString(row.file));
    const shipNorm = normalizeText(safeString(row.shipName));
    const owner = ownerByFileNorm.get(fileNorm);
    const ownerNorm = normalizeText(owner);
    if (!shipNorm || !ownerNorm) continue;

    const bucket = shipOwnerFreq.get(shipNorm) ?? new Map<string, number>();
    bucket.set(ownerNorm, (bucket.get(ownerNorm) ?? 0) + 1);
    shipOwnerFreq.set(shipNorm, bucket);
  }

  const shipToOwnerNorm = new Map<string, string>();
  for (const [shipNorm, bucket] of shipOwnerFreq.entries()) {
    let bestOwner = '';
    let bestCount = -1;
    for (const [ownerNorm, count] of bucket.entries()) {
      if (count > bestCount) {
        bestCount = count;
        bestOwner = ownerNorm;
      }
    }
    if (bestOwner) shipToOwnerNorm.set(shipNorm, bestOwner);
  }

  const clientes = await prisma.cliente.findMany({ select: { id: true, nome: true } });
  const clienteByNorm = new Map(clientes.map((c) => [normalizeText(c.nome), c.id]));

  const navios = await prisma.navio.findMany({ select: { id: true, nome: true, clienteId: true } });

  let matchedShip = 0;
  let updated = 0;
  let alreadyCorrect = 0;
  let missingClient = 0;

  for (const navio of navios) {
    const shipNorm = normalizeText(navio.nome);
    const ownerNorm = shipToOwnerNorm.get(shipNorm);
    if (!ownerNorm) continue;

    matchedShip += 1;
    const clienteId = clienteByNorm.get(ownerNorm);
    if (!clienteId) {
      missingClient += 1;
      continue;
    }

    if (navio.clienteId === clienteId) {
      alreadyCorrect += 1;
      continue;
    }

    await prisma.navio.update({ where: { id: navio.id }, data: { clienteId } });
    updated += 1;
  }

  const withClient = await prisma.navio.count({ where: { clienteId: { not: null } } });
  const withoutClient = await prisma.navio.count({ where: { clienteId: null } });

  console.log('Associação navio->cliente por certificados concluída.');
  console.log(`Navios com match de ship nos certificados: ${matchedShip}`);
  console.log(`Atualizados agora: ${updated}`);
  console.log(`Já corretos: ${alreadyCorrect}`);
  console.log(`Owner sem cliente correspondente: ${missingClient}`);
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
