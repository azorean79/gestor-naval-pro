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

function safeString(value: unknown): string {
  if (value == null) return '';
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

function isLikelyFooterOwner(value: string): boolean {
  const v = normalizeText(value);
  return v.includes('OREY GROUP') || v.includes('OREY FINANCIAL') || v.length > 120;
}

function extractOwnerFromSheet(ws: XLSX.WorkSheet): string | null {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }) as unknown[][];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const cell = safeString(row[c]);
      if (!cell) continue;

      const n = normalizeText(cell);
      const isOwnerLabel = n.includes('SHIP OWNER') || n === 'ARMADOR' || n.startsWith('ARMADOR ');
      if (!isOwnerLabel) continue;

      const fromSameCell = safeString(cell.replace(/^.*[:\-]\s*/, ''));
      const candidates = [
        fromSameCell,
        safeString(row[c + 1]),
        safeString(row[c + 2]),
        safeString(rows[r + 1]?.[c]),
        safeString(rows[r + 1]?.[c + 1]),
      ];

      for (const candidate of candidates) {
        if (!candidate) continue;
        const cn = normalizeText(candidate);
        if (cn === 'SHIP OWNER' || cn === 'ARMADOR') continue;
        if (isLikelyFooterOwner(candidate)) continue;
        return candidate;
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

  const ownersByNorm = new Map<string, string>();
  let filesWithOwner = 0;

  for (const file of files) {
    const wb = XLSX.readFile(path.join(CERTIFICADOS_DIR, file), { cellDates: true });
    const certSheetName = wb.SheetNames.find((s) => normalizeText(s) === 'CERTIFICADO') ?? wb.SheetNames[0];
    if (!certSheetName) continue;

    const owner = extractOwnerFromSheet(wb.Sheets[certSheetName]);
    if (!owner) continue;

    const norm = normalizeText(owner);
    if (!norm) continue;
    ownersByNorm.set(norm, owner);
    filesWithOwner += 1;
  }

  const existingClients = await prisma.cliente.findMany({ select: { id: true, nome: true } });
  const clientsByNorm = new Map(existingClients.map((c) => [normalizeText(c.nome), c]));

  let created = 0;
  let matched = 0;

  for (const [norm, ownerName] of ownersByNorm.entries()) {
    if (clientsByNorm.has(norm)) {
      matched += 1;
      continue;
    }

    const createdClient = await prisma.cliente.create({
      data: { nome: ownerName },
      select: { id: true, nome: true },
    });

    clientsByNorm.set(norm, createdClient);
    created += 1;
  }

  console.log('Importação de ship owners concluída.');
  console.log(`Ficheiros .xlsx: ${files.length}`);
  console.log(`Ficheiros com owner detetado: ${filesWithOwner}`);
  console.log(`Owners únicos detetados: ${ownersByNorm.size}`);
  console.log(`Clientes já existentes (match): ${matched}`);
  console.log(`Clientes criados: ${created}`);
}

main()
  .catch((error: unknown) => {
    console.error('Erro na importação de ship owners:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
