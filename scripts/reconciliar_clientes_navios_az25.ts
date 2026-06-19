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
  console.error('No database connection string found.');
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;
const prisma = new PrismaClient();

const APPLY = (process.env.APPLY ?? '').toLowerCase() === 'true';

const CERT_DIR = path.join(process.cwd(), 'CERTIFICADOS 2025');
const REPORT_FILE = path.join(process.cwd(), 'tmp_reconciliacao_clientes_navios_az25.json');

type Matrix = unknown[][];

type ParsedCert = {
  file: string;
  certNo: string;
  shipName: string;
  ownerName: string;
  ownerSource: 'cert' | 'fallback';
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

function isLikelyNoise(value: string): boolean {
  const n = normalizeText(value);
  if (!n) return true;
  if (n.length < 4) return true;
  if (n.includes('CERTIFICATE')) return true;
  if (n.includes('RE INSPECTION')) return true;
  if (n.includes('SIGNATURE')) return true;
  if (n.includes('STAMP')) return true;
  if (n.includes('OREY FINANCIAL')) return true;
  if (n.includes('OREY GROUP')) return true;
  if (n.includes('SERVICE STATION')) return true;
  if (n.includes('PORTUGAL')) return true;
  if (n.includes('CERTIFICADO')) return true;
  if (n.includes('ARMADOR') && n.length <= 15) return true;
  if (n.includes('SHIP OWNER') && n.length <= 20) return true;
  return false;
}

function toMatrix(sheet: XLSX.WorkSheet | undefined): Matrix {
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false }) as Matrix;
}

function getCell(rows: Matrix, r: number, c: number): string {
  if (r < 0 || c < 0) return '';
  return safeString(rows[r]?.[c]);
}

function parseFromFileName(fileName: string): { certNo: string; shipName: string } {
  const base = fileName.replace(/\.xlsx$/i, '').trim();
  const m = base.match(/^(AZ25-\d{3})\s*(.*)$/i);
  if (!m) return { certNo: '', shipName: base };
  return { certNo: m[1].toUpperCase(), shipName: (m[2] || '').trim() };
}

function findOwner(rows: Matrix): string {
  const ownerLabelMatchers = [
    (n: string) => n === 'SHIP OWNER' || n.startsWith('SHIP OWNER '),
    (n: string) => n === 'ARMADOR' || n.startsWith('ARMADOR '),
  ];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const raw = getCell(rows, r, c);
      const n = normalizeText(raw);
      if (!n) continue;

      const isLabel = ownerLabelMatchers.some((fn) => fn(n));
      if (!isLabel) continue;

      const candidates = [
        getCell(rows, r, c + 1),
        getCell(rows, r, c + 2),
        getCell(rows, r + 1, c),
        getCell(rows, r + 1, c + 1),
        getCell(rows, r + 1, c + 2),
        getCell(rows, r + 2, c),
        getCell(rows, r + 2, c + 1),
      ];

      for (const cand of candidates) {
        if (!cand || isLikelyNoise(cand)) continue;
        return cand;
      }
    }
  }

  return '';
}

function findShip(rows: Matrix): string {
  const shipLabelMatchers = [
    (n: string) => n === 'NAME OF SHIP' || n.startsWith('NAME OF SHIP '),
    (n: string) => n === 'NOME DO NAVIO' || n.startsWith('NOME DO NAVIO '),
    (n: string) => n === 'NAVIO' || n.startsWith('NAVIO '),
  ];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const raw = getCell(rows, r, c);
      const n = normalizeText(raw);
      if (!n) continue;

      const isLabel = shipLabelMatchers.some((fn) => fn(n));
      if (!isLabel) continue;

      const candidates = [
        getCell(rows, r, c + 1),
        getCell(rows, r, c + 2),
        getCell(rows, r + 1, c),
        getCell(rows, r + 1, c + 1),
      ];

      for (const cand of candidates) {
        if (!cand || isLikelyNoise(cand)) continue;
        return cand;
      }
    }
  }

  return '';
}

function isGenericClienteName(name: string): boolean {
  const n = normalizeText(name);
  return n.startsWith('CLIENTE SAO MIGUEL') || n.startsWith('CLIENTE SANTA MARIA') || n.startsWith('CLIENTE ') || n === 'N D' || n === 'N A';
}

async function main() {
  if (!fs.existsSync(CERT_DIR)) {
    throw new Error(`Pasta não encontrada: ${CERT_DIR}`);
  }

  const certFiles = fs
    .readdirSync(CERT_DIR)
    .filter((f) => /^AZ25-\d{3}.*\.xlsx$/i.test(f))
    .sort((a, b) => a.localeCompare(b, 'pt'));

  const parsed: ParsedCert[] = [];

  for (const file of certFiles) {
    const fullPath = path.join(CERT_DIR, file);
    const wb = XLSX.readFile(fullPath, { cellDates: true });

    const certSheetName = wb.SheetNames.find((s) => normalizeText(s) === 'CERTIFICADO') ?? wb.SheetNames[0];
    const rows = toMatrix(wb.Sheets[certSheetName]);

    const fromName = parseFromFileName(file);
    const shipName = findShip(rows) || fromName.shipName;
    const ownerByLabel = findOwner(rows);

    const ownerName = ownerByLabel || '';
    parsed.push({
      file,
      certNo: fromName.certNo,
      shipName: shipName.trim(),
      ownerName: ownerName.trim(),
      ownerSource: ownerByLabel ? 'cert' : 'fallback',
    });
  }

  const ownerMissing = parsed.filter((p) => !p.ownerName).length;
  const shipMissing = parsed.filter((p) => !p.shipName).length;

  const clientes = await prisma.cliente.findMany({
    select: { id: true, nome: true },
    orderBy: { id: 'asc' },
  });

  const clienteByNorm = new Map<string, { id: number; nome: string }>();
  for (const c of clientes) {
    const key = normalizeCompact(c.nome);
    if (!key) continue;
    if (!clienteByNorm.has(key)) clienteByNorm.set(key, c);
  }

  const navios = await prisma.navio.findMany({
    select: {
      id: true,
      nome: true,
      clienteId: true,
      cliente: { select: { id: true, nome: true } },
    },
    orderBy: { id: 'asc' },
  });

  const naviosByNormName = new Map<string, Array<(typeof navios)[number]>>();
  for (const n of navios) {
    const key = normalizeCompact(n.nome);
    if (!key) continue;
    const arr = naviosByNormName.get(key) ?? [];
    arr.push(n);
    naviosByNormName.set(key, arr);
  }

  let clientesCreated = 0;
  let naviosMatched = 0;
  let naviosUpdatedCliente = 0;
  let naviosAlreadyCorrect = 0;
  let naviosSkippedAmbiguous = 0;
  let naviosWithoutOwner = 0;
  let naviosWithoutShip = 0;
  let updatedFromGenericCliente = 0;

  const unresolved: Array<{ file: string; certNo: string; reason: string; shipName: string; ownerName: string }> = [];

  async function getOrCreateCliente(ownerName: string): Promise<number | null> {
    const key = normalizeCompact(ownerName);
    if (!key) return null;

    const existing = clienteByNorm.get(key);
    if (existing) {
      return existing.id;
    }

    if (!APPLY) {
      // dry-run: reserve a fake id sentinel
      const fakeId = -(clienteByNorm.size + 1);
      clienteByNorm.set(key, { id: fakeId, nome: ownerName });
      clientesCreated += 1;
      return fakeId;
    }

    const created = await prisma.cliente.create({
      data: {
        nome: ownerName,
      },
      select: { id: true, nome: true },
    });
    clienteByNorm.set(key, created);
    clientesCreated += 1;
    return created.id;
  }

  for (const p of parsed) {
    if (!p.shipName) {
      naviosWithoutShip += 1;
      unresolved.push({ file: p.file, certNo: p.certNo, reason: 'sem-ship-name', shipName: p.shipName, ownerName: p.ownerName });
      continue;
    }

    if (!p.ownerName) {
      naviosWithoutOwner += 1;
      unresolved.push({ file: p.file, certNo: p.certNo, reason: 'sem-owner-name', shipName: p.shipName, ownerName: p.ownerName });
      continue;
    }

    const matches = naviosByNormName.get(normalizeCompact(p.shipName)) ?? [];
    if (matches.length === 0) {
      unresolved.push({ file: p.file, certNo: p.certNo, reason: 'navio-nao-encontrado', shipName: p.shipName, ownerName: p.ownerName });
      continue;
    }

    if (matches.length > 1) {
      naviosSkippedAmbiguous += 1;
      unresolved.push({ file: p.file, certNo: p.certNo, reason: 'navio-ambiguo-por-nome', shipName: p.shipName, ownerName: p.ownerName });
      continue;
    }

    const navio = matches[0];
    naviosMatched += 1;

    const clienteId = await getOrCreateCliente(p.ownerName);
    if (!clienteId) {
      unresolved.push({ file: p.file, certNo: p.certNo, reason: 'cliente-invalido', shipName: p.shipName, ownerName: p.ownerName });
      continue;
    }

    const currentClienteName = navio.cliente?.nome ?? '';
    const sameClient = navio.clienteId === clienteId;

    if (sameClient) {
      naviosAlreadyCorrect += 1;
      continue;
    }

    if (isGenericClienteName(currentClienteName)) {
      updatedFromGenericCliente += 1;
    }

    if (APPLY && clienteId > 0) {
      await prisma.navio.update({
        where: { id: navio.id },
        data: { clienteId },
      });
    }

    naviosUpdatedCliente += 1;
  }

  const naviosComCliente = await prisma.navio.count({ where: { clienteId: { not: null } } });
  const naviosSemCliente = await prisma.navio.count({ where: { clienteId: null } });

  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    timestamp: new Date().toISOString(),
    totals: {
      certFiles: certFiles.length,
      parsedRows: parsed.length,
      ownerMissing,
      shipMissing,
      naviosMatched,
      naviosUpdatedCliente,
      naviosAlreadyCorrect,
      naviosSkippedAmbiguous,
      naviosWithoutOwner,
      naviosWithoutShip,
      clientesCreated,
      updatedFromGenericCliente,
      naviosComCliente,
      naviosSemCliente,
    },
    sampleParsed: parsed.slice(0, 40),
    unresolved: unresolved.slice(0, 300),
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Modo: ${report.mode}`);
  console.log(`Certificados AZ25 analisados: ${certFiles.length}`);
  console.log(`Navios com match por nome: ${naviosMatched}`);
  console.log(`Navios atualizados (clienteId): ${naviosUpdatedCliente}`);
  console.log(`Navios já corretos: ${naviosAlreadyCorrect}`);
  console.log(`Navios ambíguos por nome: ${naviosSkippedAmbiguous}`);
  console.log(`Clientes armadores criados: ${clientesCreated}`);
  console.log(`Trocas a partir de cliente genérico ilha: ${updatedFromGenericCliente}`);
  console.log(`Navios com cliente: ${naviosComCliente}`);
  console.log(`Navios sem cliente: ${naviosSemCliente}`);
  console.log(`Relatório: ${REPORT_FILE}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
