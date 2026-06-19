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
const REPORT_PATH = path.join(process.cwd(), 'tmp_reconciliacao_clientes_navios_az25_direct_xlsx.json');

type CertExtract = {
  file: string;
  certNo: string;
  shipName: string;
  ownerName: string;
};

function safe(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
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
  return String(v).replace(/\s+/g, ' ').trim();
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

function parseFilename(fileName: string): { certNo: string; shipName: string } {
  const base = fileName.replace(/\.xlsx$/i, '').trim();
  const m = base.match(/^(AZ25-\d{3})\s*(.*)$/i);
  if (!m) return { certNo: '', shipName: base };
  return { certNo: m[1].toUpperCase(), shipName: (m[2] || '').trim() };
}

function isBadNameOrOwner(value: string): boolean {
  const n = normalizeText(value);
  if (!n) return true;
  if (n.length < 3) return true;
  if (n.includes('NAME OF SHIP') || n.includes('NOME DO NAVIO')) return true;
  if (n.includes('SHIP OWNER') || n.includes('ARMADOR')) return true;
  if (n.includes('CERTIFICATE') || n.includes('CERTIFICADO')) return true;
  if (n.includes('OREY GROUP') || n.includes('OREY FINANCIAL') || n.includes('OREY SHIPPING') || n.includes('OREY TECNICA')) return true;
  if (n.includes('SERVICE STATION')) return true;
  if (n.includes('DELEGACAO') || n.includes('POLIGONO INDUSTRIAL')) return true;
  if (n.includes('TEL') || n.includes('FAX') || n.includes('EMAIL')) return true;
  return false;
}

function extractNearLabel(rows: unknown[][], labelMatchers: Array<(n: string) => boolean>): string {
  const rowCount = rows.length;

  for (let r = 0; r < rowCount; r++) {
    const row = rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const cell = safe(row[c]);
      const n = normalizeText(cell);
      if (!n) continue;

      const isLabel = labelMatchers.some((m) => m(n));
      if (!isLabel) continue;

      const candidates: string[] = [];

      // Same row to the right
      for (let cc = c + 1; cc <= c + 10; cc++) {
        candidates.push(safe(rows[r]?.[cc]));
      }

      // Next lines, same/right columns
      for (let rr = r + 1; rr <= Math.min(rowCount - 1, r + 5); rr++) {
        for (let cc = Math.max(0, c - 1); cc <= c + 10; cc++) {
          candidates.push(safe(rows[rr]?.[cc]));
        }
      }

      for (const cand of candidates) {
        if (!cand || isBadNameOrOwner(cand)) continue;
        return cand;
      }
    }
  }

  return '';
}

function shipVariants(name: string): string[] {
  const base = normalizeCompact(name);
  if (!base) return [];

  const variants = new Set<string>([base]);

  // remove leading article O/A/OS/AS
  const words = normalizeText(name).split(' ').filter(Boolean);
  if (words.length > 1 && ['O', 'A', 'OS', 'AS'].includes(words[0])) {
    variants.add(words.slice(1).join(''));
  }

  // common punctuation simplifications already normalized, but keep explicit variant with/without DE/DO/DA
  const withoutPrep = words.filter((w) => !['DE', 'DO', 'DA', 'DOS', 'DAS'].includes(w)).join('');
  if (withoutPrep) variants.add(withoutPrep);

  return [...variants];
}

function isGenericClienteName(name: string | null | undefined): boolean {
  return normalizeText(name).startsWith('CLIENTE ');
}

async function main() {
  const files = fs
    .readdirSync(CERT_DIR)
    .filter((f) => /^AZ25-\d{3}.*\.xlsx$/i.test(f))
    .sort((a, b) => a.localeCompare(b, 'pt'));

  const extracted: CertExtract[] = [];

  for (const file of files) {
    const full = path.join(CERT_DIR, file);
    const wb = XLSX.readFile(full, { cellDates: true });

    const certSheetName = wb.SheetNames.find((s) => normalizeText(s).includes('CERTIFICADO')) ?? wb.SheetNames[0];
    const ws = wb.Sheets[certSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false }) as unknown[][];

    const fromFile = parseFilename(file);

    const ship =
      extractNearLabel(rows, [
        (n) => n === 'NAME OF SHIP' || n.startsWith('NAME OF SHIP '),
        (n) => n === 'NOME DO NAVIO' || n.startsWith('NOME DO NAVIO '),
      ]) || fromFile.shipName;

    const owner = extractNearLabel(rows, [
      (n) => n === 'SHIP OWNER' || n.startsWith('SHIP OWNER '),
      (n) => n === 'ARMADOR' || n.startsWith('ARMADOR '),
    ]);

    extracted.push({
      file,
      certNo: fromFile.certNo,
      shipName: ship,
      ownerName: owner,
    });
  }

  const extractedWithOwner = extracted.filter((e) => !!e.ownerName && !isBadNameOrOwner(e.ownerName));

  const clientes = await prisma.cliente.findMany({ select: { id: true, nome: true } });
  const clienteByNorm = new Map(clientes.map((c) => [normalizeCompact(c.nome), c.id]));

  async function getOrCreateCliente(owner: string): Promise<number | null> {
    const key = normalizeCompact(owner);
    if (!key) return null;

    const found = clienteByNorm.get(key);
    if (found) return found;

    if (!APPLY) {
      const fake = -(clienteByNorm.size + 1);
      clienteByNorm.set(key, fake);
      return fake;
    }

    const created = await prisma.cliente.create({ data: { nome: owner }, select: { id: true } });
    clienteByNorm.set(key, created.id);
    return created.id;
  }

  const navios = await prisma.navio.findMany({
    select: {
      id: true,
      nome: true,
      clienteId: true,
      cliente: { select: { nome: true } },
    },
  });

  const naviosByNorm = new Map<string, typeof navios>();
  for (const n of navios) {
    const key = normalizeCompact(n.nome);
    if (!key) continue;
    const arr = naviosByNorm.get(key) ?? [];
    arr.push(n);
    naviosByNorm.set(key, arr);
  }

  const beforeSemCliente = await prisma.navio.count({ where: { clienteId: null } });

  let candidates = 0;
  let updated = 0;
  let already = 0;
  let skippedSpecific = 0;
  let skippedAmbiguous = 0;
  let createdClientes = 0;
  let updatedFromGeneric = 0;

  const unresolved: Array<{ certNo: string; file: string; ship: string; owner: string; reason: string }> = [];

  for (const e of extractedWithOwner) {
    const ownerId = await getOrCreateCliente(e.ownerName);
    if (!ownerId) {
      unresolved.push({ certNo: e.certNo, file: e.file, ship: e.shipName, owner: e.ownerName, reason: 'owner-invalid' });
      continue;
    }
    if (ownerId < 0) createdClientes += 1;

    const variants = shipVariants(e.shipName);
    const hits = new Map<number, (typeof navios)[number]>();
    for (const v of variants) {
      for (const n of naviosByNorm.get(v) ?? []) {
        hits.set(n.id, n);
      }
    }

    if (!hits.size) {
      unresolved.push({ certNo: e.certNo, file: e.file, ship: e.shipName, owner: e.ownerName, reason: 'ship-not-found' });
      continue;
    }

    const candidatesArr = [...hits.values()];
    const updatable = candidatesArr.filter((n) => !n.clienteId || isGenericClienteName(n.cliente?.nome));

    if (!updatable.length) {
      // all have specific client; avoid override
      skippedSpecific += 1;
      unresolved.push({ certNo: e.certNo, file: e.file, ship: e.shipName, owner: e.ownerName, reason: 'specific-client-different' });
      continue;
    }

    if (updatable.length > 1) {
      skippedAmbiguous += 1;
      unresolved.push({ certNo: e.certNo, file: e.file, ship: e.shipName, owner: e.ownerName, reason: 'multiple-updatable-ships' });
      continue;
    }

    const navio = updatable[0];
    candidates += 1;

    if (navio.clienteId === ownerId) {
      already += 1;
      continue;
    }

    if (navio.cliente?.nome && isGenericClienteName(navio.cliente.nome)) updatedFromGeneric += 1;

    if (APPLY && ownerId > 0) {
      await prisma.navio.update({ where: { id: navio.id }, data: { clienteId: ownerId } });
    }
    updated += 1;
  }

  if (APPLY) {
    const afterClientesCount = await prisma.cliente.count();
    createdClientes = Math.max(0, afterClientesCount - clientes.length);
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
      filesAZ25: files.length,
      extractedRows: extracted.length,
      extractedWithOwner: extractedWithOwner.length,
      candidates,
      updated,
      already,
      skippedSpecific,
      skippedAmbiguous,
      updatedFromGeneric,
      createdClientes,
      beforeSemCliente,
      afterSemCliente,
      afterGeneric,
    },
    sampleExtracted: extracted.slice(0, 80),
    unresolved: unresolved.slice(0, 300),
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Modo: ${report.mode}`);
  console.log(`AZ25 ficheiros: ${files.length}`);
  console.log(`Com owner extraído: ${extractedWithOwner.length}`);
  console.log(`Candidatos de update: ${candidates}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Já corretos: ${already}`);
  console.log(`Ignorados (cliente específico): ${skippedSpecific}`);
  console.log(`Ignorados (ambíguos): ${skippedAmbiguous}`);
  console.log(`Atualizados a partir de cliente genérico: ${updatedFromGeneric}`);
  console.log(`Clientes criados: ${createdClientes}`);
  console.log(`Sem cliente (antes/depois): ${beforeSemCliente} -> ${afterSemCliente}`);
  console.log(`Com cliente genérico após execução: ${afterGeneric}`);
  console.log(`Relatório: ${REPORT_PATH}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
