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

const APPLY = (process.env.APPLY ?? '').toLowerCase() === 'true';

const CERT_ROWS_PATH = path.join(process.cwd(), 'scripts', 'jangadas_navios_associadas_2025.json');
const OWNERS_RAW_PATH = path.join(process.cwd(), 'jangadas_certificados_2025.json');
const REPORT_PATH = path.join(process.cwd(), 'tmp_reconciliacao_clientes_navios_az25.json');

type CertRow = {
  file?: string;
  shipName?: string;
};

type CertRowsFile = {
  rows?: CertRow[];
};

type OwnerRawRow = {
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

function normalizeText(value: string | undefined | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeCompact(value: string | undefined | null): string {
  return normalizeText(value).replace(/\s+/g, '');
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
  if (n.includes('CERTIFICATE')) return true;
  if (n.includes('CERTIFICADO')) return true;
  if (n.includes('SERVICE STATION')) return true;
  if (n.includes('NAME OF SHIP') || n.includes('NOME DO NAVIO')) return true;
  if (n.includes('FLAG OF SHIP') || n.includes('NACIONALIDADE')) return true;
  if (n.includes('SERIAL NO') || n.includes('NO SERIE')) return true;
  if (n.includes('DATE OF INSPECTION') || n.includes('DATA DA INSPE')) return true;
  if (n.includes('DATE NEXT INSPECTION') || n.includes('PROXIMA INSPE')) return true;
  return false;
}

function isLikelyOwnerName(value: string): boolean {
  const n = normalizeText(value);
  if (isBadOwner(value)) return false;
  const tokens = n.split(' ').filter(Boolean);
  if (tokens.length >= 2) return true;
  if (n.includes('LDA') || n.includes('UNIPESSOAL') || n.includes('SOCIEDADE')) return true;
  return false;
}

function extractOwnerFromFileRows(rows: OwnerRawRow[]): string | null {
  const sorted = [...rows].sort((a, b) => (a.linha ?? 0) - (b.linha ?? 0));
  const matrix = sorted.map((r) => (Array.isArray(r.dados) ? r.dados.map((d) => safeString(d)) : []));

  const candidates: string[] = [];

  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      if (!isOwnerLabel(row[c])) continue;

      // mesma linha, à direita do label
      for (let k = c + 1; k < Math.min(row.length, c + 8); k++) {
        const cand = row[k];
        if (isLikelyOwnerName(cand)) candidates.push(cand);
      }

      // próximas linhas (captura layouts verticais)
      for (let rr = r + 1; rr <= Math.min(matrix.length - 1, r + 6); rr++) {
        const nextRow = matrix[rr] ?? [];
        for (let cc = 0; cc < Math.min(nextRow.length, c + 8); cc++) {
          const cand = nextRow[cc];
          if (isLikelyOwnerName(cand)) candidates.push(cand);
        }
      }
    }
  }

  if (!candidates.length) return null;

  const byNorm = new Map<string, { display: string; count: number }>();
  for (const cand of candidates) {
    const key = normalizeCompact(cand);
    if (!key) continue;
    const cur = byNorm.get(key);
    if (!cur) {
      byNorm.set(key, { display: cand, count: 1 });
    } else {
      cur.count += 1;
      if (cand.length > cur.display.length) cur.display = cand;
      byNorm.set(key, cur);
    }
  }

  const ranked = [...byNorm.values()].sort((a, b) => b.count - a.count || b.display.length - a.display.length);
  return ranked[0]?.display ?? null;
}

function parseFilenameShipName(fileName: string): string {
  const base = fileName.replace(/\.xlsx$/i, '').trim();
  const m = base.match(/^AZ25-\d{3}\s*(.*)$/i);
  if (!m) return base;
  return (m[1] || '').trim();
}

function isGenericClienteName(name: string): boolean {
  const n = normalizeText(name);
  return n.startsWith('CLIENTE ');
}

function isJangadaOwnerPlaceholder(owner: string | null | undefined): boolean {
  const n = normalizeText(owner);
  return !n || n === 'N D' || n === 'N A' || n === 'ND' || n === 'NA';
}

async function main() {
  const certRowsJson = readJsonWithEncodingFallback<CertRowsFile>(CERT_ROWS_PATH);
  const certRows = Array.isArray(certRowsJson.rows) ? certRowsJson.rows : [];

  const ownerRawRows = readJsonWithEncodingFallback<OwnerRawRow[]>(OWNERS_RAW_PATH);

  const ownerByFileNorm = new Map<string, string>();
  const groupedByFile = new Map<string, OwnerRawRow[]>();
  for (const row of ownerRawRows) {
    const file = safeString(row.arquivo);
    if (!file) continue;
    const key = normalizeText(file);
    const arr = groupedByFile.get(key) ?? [];
    arr.push(row);
    groupedByFile.set(key, arr);
  }

  for (const [fileNorm, rows] of groupedByFile.entries()) {
    const owner = extractOwnerFromFileRows(rows);
    if (!owner || isBadOwner(owner)) continue;
    ownerByFileNorm.set(fileNorm, owner);
  }

  // shipNorm -> ownerNorm frequency
  const shipOwnerFreq = new Map<string, Map<string, number>>();
  const ownerDisplayByNorm = new Map<string, string>();
  const certShipFiles: Array<{ file: string; shipName: string; ownerName: string }> = [];

  for (const row of certRows) {
    const file = safeString(row.file);
    if (!/^AZ25-\d{3}/i.test(file)) continue;

    const fileNorm = normalizeText(file);
    const ship = safeString(row.shipName) || parseFilenameShipName(file);
    const owner = ownerByFileNorm.get(fileNorm) ?? '';

    certShipFiles.push({ file, shipName: ship, ownerName: owner });

    const shipNorm = normalizeCompact(ship);
    const ownerNorm = normalizeCompact(owner);
    if (!shipNorm || !ownerNorm) continue;

    const bucket = shipOwnerFreq.get(shipNorm) ?? new Map<string, number>();
    bucket.set(ownerNorm, (bucket.get(ownerNorm) ?? 0) + 1);
    shipOwnerFreq.set(shipNorm, bucket);

    if (!ownerDisplayByNorm.has(ownerNorm)) ownerDisplayByNorm.set(ownerNorm, owner);
  }

  const selectedShipOwner = new Map<string, string>();
  for (const [shipNorm, bucket] of shipOwnerFreq.entries()) {
    let bestOwnerNorm = '';
    let bestCount = -1;
    for (const [ownerNorm, count] of bucket.entries()) {
      if (count > bestCount) {
        bestCount = count;
        bestOwnerNorm = ownerNorm;
      }
    }
    if (bestOwnerNorm) selectedShipOwner.set(shipNorm, bestOwnerNorm);
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

  const clientes = await prisma.cliente.findMany({
    select: { id: true, nome: true },
    orderBy: { id: 'asc' },
  });

  const naviosByName = new Map<string, typeof navios>();
  for (const n of navios) {
    const key = normalizeCompact(n.nome);
    if (!key) continue;
    const arr = naviosByName.get(key) ?? [];
    arr.push(n);
    naviosByName.set(key, arr);
  }

  const clienteByNorm = new Map<string, { id: number; nome: string }>();
  for (const c of clientes) {
    const key = normalizeCompact(c.nome);
    if (!key) continue;
    if (!clienteByNorm.has(key)) clienteByNorm.set(key, c);
  }

  async function getOrCreateCliente(ownerNorm: string): Promise<number | null> {
    const ownerDisplay = ownerDisplayByNorm.get(ownerNorm) ?? ownerNorm;
    const existing = clienteByNorm.get(ownerNorm);
    if (existing) return existing.id;

    if (!APPLY) {
      const fakeId = -(clienteByNorm.size + 1);
      clienteByNorm.set(ownerNorm, { id: fakeId, nome: ownerDisplay });
      return fakeId;
    }

    const created = await prisma.cliente.create({
      data: { nome: ownerDisplay },
      select: { id: true, nome: true },
    });
    clienteByNorm.set(ownerNorm, created);
    return created.id;
  }

  const beforeSemCliente = await prisma.navio.count({ where: { clienteId: null } });

  let shipsWithOwnerInCert = 0;
  let ownersResolved = 0;
  let clientesCreated = 0;
  let naviosUpdated = 0;
  let naviosAlreadyOk = 0;
  let naviosSkippedSpecificClient = 0;
  let naviosSkippedAmbiguous = 0;
  let updatedFromGeneric = 0;

  const unresolved: Array<{ ship: string; reason: string; owner?: string }> = [];

  for (const [shipNorm, ownerNorm] of selectedShipOwner.entries()) {
    shipsWithOwnerInCert += 1;

    const ownerId = await getOrCreateCliente(ownerNorm);
    const ownerDisplay = ownerDisplayByNorm.get(ownerNorm) ?? ownerNorm;

    if (ownerId == null) {
      unresolved.push({ ship: shipNorm, reason: 'owner-id-invalid', owner: ownerDisplay });
      continue;
    }

    if (ownerId < 0) clientesCreated += 1;

    const candidates = naviosByName.get(shipNorm) ?? [];
    if (!candidates.length) {
      unresolved.push({ ship: shipNorm, reason: 'ship-not-found', owner: ownerDisplay });
      continue;
    }

    if (candidates.length > 1) {
      // update only generic/null to avoid wrong overwrite
      const updatable = candidates.filter((n) => !n.clienteId || isGenericClienteName(n.cliente?.nome ?? ''));
      if (!updatable.length) {
        naviosSkippedAmbiguous += 1;
        unresolved.push({ ship: shipNorm, reason: 'ambiguous-all-specific-clients', owner: ownerDisplay });
        continue;
      }

      for (const navio of updatable) {
        if (navio.clienteId === ownerId) {
          naviosAlreadyOk += 1;
          continue;
        }
        if (navio.cliente?.nome && isGenericClienteName(navio.cliente.nome)) updatedFromGeneric += 1;
        if (APPLY && ownerId > 0) {
          await prisma.navio.update({ where: { id: navio.id }, data: { clienteId: ownerId } });
        }
        naviosUpdated += 1;
      }

      ownersResolved += 1;
      continue;
    }

    const navio = candidates[0];
    if (navio.clienteId === ownerId) {
      naviosAlreadyOk += 1;
      ownersResolved += 1;
      continue;
    }

    if (navio.clienteId && navio.cliente?.nome && !isGenericClienteName(navio.cliente.nome)) {
      naviosSkippedSpecificClient += 1;
      unresolved.push({ ship: shipNorm, reason: 'has-specific-different-client', owner: ownerDisplay });
      continue;
    }

    if (navio.cliente?.nome && isGenericClienteName(navio.cliente.nome)) updatedFromGeneric += 1;

    if (APPLY && ownerId > 0) {
      await prisma.navio.update({ where: { id: navio.id }, data: { clienteId: ownerId } });
    }

    naviosUpdated += 1;
    ownersResolved += 1;
  }

  // refresh and compute created clients in apply mode precisely
  if (APPLY) {
    const clientesAfter = await prisma.cliente.count();
    const clientesBefore = clientes.length;
    clientesCreated = Math.max(0, clientesAfter - clientesBefore);
  }

  // Optional: update Jangada.owner from owner mapping when missing/placeholder
  const jangadas = await prisma.jangada.findMany({
    select: { id: true, owner: true, shipNameManual: true },
  });

  let jangadasOwnerUpdated = 0;
  for (const j of jangadas) {
    const shipNorm = normalizeCompact(j.shipNameManual);
    if (!shipNorm) continue;
    const ownerNorm = selectedShipOwner.get(shipNorm);
    if (!ownerNorm) continue;
    if (!isJangadaOwnerPlaceholder(j.owner)) continue;

    const ownerDisplay = ownerDisplayByNorm.get(ownerNorm) ?? '';
    if (!ownerDisplay) continue;

    if (APPLY) {
      await prisma.jangada.update({ where: { id: j.id }, data: { owner: ownerDisplay } });
    }
    jangadasOwnerUpdated += 1;
  }

  const afterSemCliente = await prisma.navio.count({ where: { clienteId: null } });

  const genericClienteRows = await prisma.navio.findMany({
    where: { clienteId: { not: null } },
    select: { cliente: { select: { nome: true } } },
  });

  let afterGenericCliente = 0;
  for (const row of genericClienteRows) {
    if (row.cliente?.nome && isGenericClienteName(row.cliente.nome)) afterGenericCliente += 1;
  }

  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    timestamp: new Date().toISOString(),
    totals: {
      certRowsAZ25: certShipFiles.length,
      uniqueShipsWithOwner: selectedShipOwner.size,
      shipsWithOwnerInCert,
      ownersResolved,
      clientesCreated,
      naviosUpdated,
      naviosAlreadyOk,
      naviosSkippedSpecificClient,
      naviosSkippedAmbiguous,
      updatedFromGeneric,
      jangadasOwnerUpdated,
      beforeSemCliente,
      afterSemCliente,
      afterGenericCliente,
    },
    sampleCertRows: certShipFiles.slice(0, 50),
    unresolved: unresolved.slice(0, 300),
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Modo: ${report.mode}`);
  console.log(`Certificados AZ25 lidos: ${certShipFiles.length}`);
  console.log(`Ships únicos com owner resolvido: ${selectedShipOwner.size}`);
  console.log(`Clientes criados: ${clientesCreated}`);
  console.log(`Navios atualizados clienteId: ${naviosUpdated}`);
  console.log(`Navios já corretos: ${naviosAlreadyOk}`);
  console.log(`Navios ignorados (cliente específico diferente): ${naviosSkippedSpecificClient}`);
  console.log(`Navios ignorados (ambíguos): ${naviosSkippedAmbiguous}`);
  console.log(`Trocas a partir de cliente genérico: ${updatedFromGeneric}`);
  console.log(`Jangadas owner preenchido: ${jangadasOwnerUpdated}`);
  console.log(`Navios sem cliente (antes/depois): ${beforeSemCliente} -> ${afterSemCliente}`);
  console.log(`Navios com cliente genérico após execução: ${afterGenericCliente}`);
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
