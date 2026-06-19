import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

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

const CERTIFICADOS_DIR = path.join(process.cwd(), 'CERTIFICADOS 2025');
const REPORT_FILE = path.join(process.cwd(), 'scripts', 'import_clientes_todos_certificados_report.json');

type Matrix = string[][];

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

function toMatrix(ws: XLSX.WorkSheet): Matrix {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }) as unknown[][];
  return rows.map((row) => row.map((c) => safeString(c)));
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

function parseShipFromFilename(file: string): string {
  return file.replace(/\.xlsx$/i, '').replace(/^AZ\d{2}-\d+\s*/i, '').trim();
}

function extractOwner(rows: Matrix): string | null {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const cell = safeString(row[c]);
      if (!cell || !isOwnerLabel(cell)) continue;

      const candidates = [
        safeString(cell.replace(/^.*[:\-]\s*/, '')),
        safeString(row[c + 1]),
        safeString(row[c + 2]),
        safeString(row[c + 3]),
        safeString(rows[r + 1]?.[c]),
        safeString(rows[r + 1]?.[c + 1]),
        safeString(rows[r + 1]?.[c + 2]),
      ];

      for (const cand of candidates) {
        if (!cand || isBadOwner(cand)) continue;
        return cand;
      }
    }
  }

  return null;
}

async function main() {
  const files = fs
    .readdirSync(CERTIFICADOS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.xlsx'))
    .sort((a, b) => a.localeCompare(b));

  const existing = await prisma.cliente.findMany({ select: { id: true, nome: true } });
  const byNorm = new Map(existing.map((c) => [normalizeText(c.nome), c]));

  let created = 0;
  let matched = 0;
  let withOwner = 0;
  let fallbackShipName = 0;

  const missingOwners: string[] = [];

  for (const file of files) {
    const wb = XLSX.readFile(path.join(CERTIFICADOS_DIR, file), { cellDates: true });
    const certSheetName = wb.SheetNames.find((s) => normalizeText(s) === 'CERTIFICADO') ?? wb.SheetNames[0];
    if (!certSheetName) {
      missingOwners.push(file);
      continue;
    }

    const rows = toMatrix(wb.Sheets[certSheetName]);
    let owner = extractOwner(rows);

    if (owner) {
      withOwner += 1;
    } else {
      owner = parseShipFromFilename(file);
      fallbackShipName += 1;
      missingOwners.push(file);
    }

    const norm = normalizeText(owner);
    if (!norm) continue;

    const found = byNorm.get(norm);
    if (found) {
      matched += 1;
      continue;
    }

    const createdCliente = await prisma.cliente.create({ data: { nome: owner }, select: { id: true, nome: true } });
    byNorm.set(norm, createdCliente);
    created += 1;
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    filesWithOwner: withOwner,
    filesFallbackShipName: fallbackShipName,
    clientsMatched: matched,
    clientsCreated: created,
    clientsTotalAfter: await prisma.cliente.count(),
    missingOwnersSample: missingOwners.slice(0, 50),
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('Importação de clientes (todos os certificados) concluída.');
  console.log(`Ficheiros: ${files.length}`);
  console.log(`Com owner extraído: ${withOwner}`);
  console.log(`Com fallback por nome do navio (ficheiro): ${fallbackShipName}`);
  console.log(`Clientes já existentes (match): ${matched}`);
  console.log(`Clientes criados: ${created}`);
  console.log(`Total de clientes após importação: ${report.clientsTotalAfter}`);
  console.log(`Relatório: ${path.relative(process.cwd(), REPORT_FILE)}`);
}

main()
  .catch((error: unknown) => {
    console.error('Erro na importação de clientes:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
