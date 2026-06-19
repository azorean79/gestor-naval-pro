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
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env/.env.local');
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;
const prisma = new PrismaClient();

type JsonRow = {
  arquivo?: string;
  linha?: number;
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

function isLabel(text: string): boolean {
  const n = normalizeText(text);
  return n === 'SHIP OWNER' || n === 'ARMADOR' || n.startsWith('SHIP OWNER ') || n.startsWith('ARMADOR ');
}

function isBadOwner(text: string): boolean {
  const n = normalizeText(text);
  if (!n) return true;
  if (n.length < 5) return true;
  if (isLabel(text)) return true;
  if (n.includes('SIGNATURE')) return true;
  if (n.includes('OREY GROUP') || n.includes('OREY FINANCIAL')) return true;
  return false;
}

function extractOwnerFromDados(dados: unknown[]): string | null {
  const cells = dados.map((d) => safeString(d));

  let labelIndex = -1;
  for (let i = 0; i < cells.length; i++) {
    if (isLabel(cells[i])) {
      labelIndex = i;
      break;
    }
  }
  if (labelIndex < 0) return null;

  const candidates: string[] = [];
  for (let i = labelIndex + 1; i < cells.length; i++) {
    const c = cells[i];
    if (!c) continue;
    if (isBadOwner(c)) continue;
    candidates.push(c);
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] ?? null;
}

async function main() {
  const inputPath = path.join(process.cwd(), 'jangadas_certificados_2025.json');
  const reportPath = path.join(process.cwd(), 'scripts', 'import_ship_owners_from_json_2025_report.json');

  const rawBuffer = fs.readFileSync(inputPath);
  let raw = rawBuffer.toString('utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  let rows: JsonRow[];
  try {
    rows = JSON.parse(raw) as JsonRow[];
  } catch {
    const rawUtf16 = rawBuffer.toString('utf16le').replace(/^\uFEFF/, '');
    rows = JSON.parse(rawUtf16) as JsonRow[];
  }

  const ownersByNorm = new Map<string, { nome: string; arquivo?: string; linha?: number }>();

  for (const row of rows) {
    const dados = Array.isArray(row.dados) ? row.dados : [];
    const owner = extractOwnerFromDados(dados);
    if (!owner) continue;

    const norm = normalizeText(owner);
    if (!norm || isBadOwner(owner)) continue;

    if (!ownersByNorm.has(norm)) {
      ownersByNorm.set(norm, { nome: owner, arquivo: row.arquivo, linha: row.linha });
    }
  }

  const existingClients = await prisma.cliente.findMany({ select: { id: true, nome: true } });
  const existingByNorm = new Map(existingClients.map((c) => [normalizeText(c.nome), c]));

  const createdNames: string[] = [];
  const matchedNames: string[] = [];

  for (const [norm, owner] of ownersByNorm.entries()) {
    if (existingByNorm.has(norm)) {
      matchedNames.push(owner.nome);
      continue;
    }

    const created = await prisma.cliente.create({
      data: { nome: owner.nome },
      select: { id: true, nome: true },
    });

    existingByNorm.set(norm, created);
    createdNames.push(created.nome);
  }

  const report = {
    timestamp: new Date().toISOString(),
    source: 'jangadas_certificados_2025.json',
    ownersUnique: ownersByNorm.size,
    clientsAlreadyExisting: matchedNames.length,
    clientsCreated: createdNames.length,
    createdSample: createdNames.slice(0, 30),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Importação de ship owners via JSON concluída.');
  console.log(`Owners únicos encontrados: ${ownersByNorm.size}`);
  console.log(`Clientes já existentes: ${matchedNames.length}`);
  console.log(`Clientes criados agora: ${createdNames.length}`);
  console.log(`Relatório: ${path.relative(process.cwd(), reportPath)}`);
}

main()
  .catch((error: unknown) => {
    console.error('Erro na importação de ship owners via JSON:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
