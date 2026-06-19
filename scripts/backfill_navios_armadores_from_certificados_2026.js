const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.gestornavalpro_DATABASE_URL ||
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env/.env.local');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const ROOT = process.cwd();
const CERT_DIR_2026 = path.join(ROOT, 'CERTIFICADOS 2026');
const REPORT_PATH = path.join(ROOT, 'scripts', 'backfill_navios_armadores_2026_report.json');

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function norm(value) {
  return clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function normalizeSerial(value) {
  return clean(value).replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function toMatrix(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  return rows.map((row) => row.map((cell) => clean(cell)));
}

function getCell(rows, r, c) {
  return rows[r]?.[c] || '';
}

function findLabel(rows, labels, maxRow) {
  const targets = labels.map(norm);
  for (let r = 0; r < rows.length; r += 1) {
    if (typeof maxRow === 'number' && r > maxRow) break;
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c += 1) {
      const cell = norm(row[c]);
      if (!cell) continue;
      if (targets.some((t) => cell === t || cell.startsWith(`${t} `))) {
        return { r, c };
      }
    }
  }
  return null;
}

function isLikelyLabel(text) {
  const v = clean(text);
  if (!v) return false;
  if (v.endsWith(':')) return true;
  const n = norm(v);
  return (
    n.includes('CERTIFICATE') ||
    n.includes('CERTIFICADO') ||
    n.includes('INSPECTION') ||
    n.includes('INSPECCAO') ||
    n.includes('INSPEÇÃO') ||
    n.includes('SERIAL NO') ||
    n.includes('NO. SERIE') ||
    n.includes('DATA DE FABR') ||
    n.includes('DATE OF MANUF') ||
    n.includes('NAME OF SHIP') ||
    n.includes('NOME DO NAVIO') ||
    n.includes('SHIP OWNER') ||
    n.includes('ARMADOR')
  );
}

function isShipLabelValue(value) {
  const n = norm(value);
  return n === 'NAME OF SHIP' || n === 'NAME OF SHIP:' || n === 'NOME DO NAVIO' || n === 'NOME DO NAVIO:';
}

function isOwnerLabelValue(value) {
  const n = norm(value);
  return n === 'SHIP OWNER' || n === 'SHIP OWNER:' || n === 'ARMADOR' || n === 'ARMADOR:';
}

function pickFieldValue(rows, pos, rejectFn) {
  if (!pos) return '';

  const coordinates = [
    [pos.r, pos.c + 1],
    [pos.r, pos.c + 2],
    [pos.r, pos.c + 3],
    [pos.r + 1, pos.c],
    [pos.r + 1, pos.c + 1],
    [pos.r + 1, pos.c + 2],
    [pos.r + 2, pos.c],
    [pos.r + 2, pos.c + 1],
    [pos.r + 2, pos.c + 2],
    [pos.r + 3, pos.c + 1],
  ];

  for (const [r, c] of coordinates) {
    const value = clean(getCell(rows, r, c));
    if (!value) continue;
    if (isLikelyLabel(value)) continue;
    if (rejectFn && rejectFn(value)) continue;
    return value;
  }

  return '';
}

function valueNear(rows, pos) {
  if (!pos) return '';
  const candidates = [
    getCell(rows, pos.r, pos.c + 1),
    getCell(rows, pos.r, pos.c + 2),
    getCell(rows, pos.r + 1, pos.c),
    getCell(rows, pos.r + 1, pos.c + 1),
    getCell(rows, pos.r + 1, pos.c + 2),
    getCell(rows, pos.r + 2, pos.c + 1),
  ].map(clean);

  return candidates.find(Boolean) || '';
}

function valueBelowSameColumn(rows, pos, maxLookahead = 4) {
  if (!pos) return '';
  for (let i = 1; i <= maxLookahead; i += 1) {
    const v = clean(getCell(rows, pos.r + i, pos.c));
    if (v && !isLikelyLabel(v)) return v;
  }
  return '';
}

function parseWorkbook(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const certSheetName = wb.SheetNames.find((s) => norm(s) === 'CERTIFICADO') || wb.SheetNames[0];
  const certRows = certSheetName ? toMatrix(wb.Sheets[certSheetName]) : [];

  const certNoPos = findLabel(certRows, ['CERTIFICATE NO.:', 'CERTIFICADO NO.:', 'CERTIFICADO NO']);
  const shipPos = findLabel(certRows, ['NAME OF SHIP:', 'NOME DO NAVIO']);
  const ownerPos = findLabel(certRows, ['SHIP OWNER:', 'ARMADOR:']);
  const identificationPos = findLabel(certRows, ['IDENTIFICATION:', 'IDENTIFICAÇÃO:', 'IDENTIFICACAO:']);

  const fileName = path.basename(filePath);
  const idValuesRow = typeof identificationPos?.r === 'number' ? identificationPos.r + 2 : -1;

  const certNo = clean(valueNear(certRows, certNoPos));
  const shipName =
    clean(pickFieldValue(certRows, shipPos, isShipLabelValue)) ||
    valueBelowSameColumn(certRows, shipPos, 3) ||
    clean(fileName.replace(/\.xlsx$/i, '').replace(/^AZ\d{2}-\d+\s*/i, ''));
  const owner = clean(pickFieldValue(certRows, ownerPos, isOwnerLabelValue)) || valueBelowSameColumn(certRows, ownerPos, 3);
  const serial = idValuesRow >= 0 ? clean(getCell(certRows, idValuesRow, 8)) : '';

  return {
    fileName,
    certNo,
    shipName,
    owner,
    serial,
  };
}

function isEmptyOwner(value) {
  const n = norm(value);
  return !n || n === 'N D' || n === 'ND' || n === 'N/A' || n === 'NA';
}

function isBadOwnerValue(value) {
  const n = norm(value);
  if (!n) return true;
  if (isOwnerLabelValue(value)) return true;
  if (n.includes('SIGNATURE')) return true;
  if (n.includes('FOR AUTHORIZED SERVICING STATION')) return true;
  return false;
}

async function main() {
  if (!fs.existsSync(CERT_DIR_2026)) {
    throw new Error(`Pasta não encontrada: ${CERT_DIR_2026}`);
  }

  const files = fs.readdirSync(CERT_DIR_2026).filter((f) => f.toLowerCase().endsWith('.xlsx')).sort((a, b) => a.localeCompare(b, 'pt'));

  const extracted = files.map((file) => parseWorkbook(path.join(CERT_DIR_2026, file)));

  const jangadas = await prisma.jangada.findMany({
    select: { id: true, serial: true, shipId: true, shipNameManual: true, owner: true },
  });
  const navios = await prisma.navio.findMany({ select: { id: true, nome: true, proprietario: true } });

  const byJangadaSerialExact = new Map(jangadas.map((j) => [clean(j.serial), j]));
  const byJangadaSerialNorm = new Map(jangadas.map((j) => [normalizeSerial(j.serial), j]));
  const byNavioNome = new Map(navios.map((n) => [norm(n.nome), n]));

  let extractedWithShip = 0;
  let extractedWithOwner = 0;
  let matchedJangada = 0;
  let updatedJangadaOwner = 0;
  let updatedJangadaShipName = 0;
  let ownerConflictsJangada = 0;
  let matchedNavio = 0;
  let updatedNavioOwner = 0;
  let ownerConflictsNavio = 0;

  const conflictSamples = [];

  // Aggregate best owner per ship from certificate frequency
  const shipOwnerFreq = new Map();
  for (const row of extracted) {
    const shipKey = norm(row.shipName);
    const ownerKey = norm(row.owner);
    if (!shipKey || !ownerKey) continue;
    if (isBadOwnerValue(row.owner)) continue;
    if (!shipOwnerFreq.has(shipKey)) shipOwnerFreq.set(shipKey, new Map());
    const bucket = shipOwnerFreq.get(shipKey);
    bucket.set(ownerKey, (bucket.get(ownerKey) || 0) + 1);
  }

  const bestOwnerByShip = new Map();
  for (const [shipKey, bucket] of shipOwnerFreq.entries()) {
    let bestOwnerKey = '';
    let bestCount = -1;
    for (const [ownerKey, count] of bucket.entries()) {
      if (count > bestCount) {
        bestCount = count;
        bestOwnerKey = ownerKey;
      }
    }
    if (bestOwnerKey) bestOwnerByShip.set(shipKey, bestOwnerKey);
  }

  // helper to recover original-cased owner from extracted rows
  const ownerOriginalByNorm = new Map();
  for (const row of extracted) {
    const ownerKey = norm(row.owner);
    if (!ownerKey || ownerOriginalByNorm.has(ownerKey)) continue;
    if (isBadOwnerValue(row.owner)) continue;
    ownerOriginalByNorm.set(ownerKey, clean(row.owner));
  }

  for (const row of extracted) {
    const shipName = clean(row.shipName);
    const owner = clean(row.owner);
    const serial = clean(row.serial);

    if (shipName) extractedWithShip += 1;
    if (owner && !isBadOwnerValue(owner)) extractedWithOwner += 1;

    const serialNorm = normalizeSerial(serial);
    const jangada = byJangadaSerialExact.get(serial) || byJangadaSerialNorm.get(serialNorm) || null;

    if (jangada) {
      matchedJangada += 1;

      if (shipName && !clean(jangada.shipNameManual)) {
        await prisma.jangada.update({ where: { id: jangada.id }, data: { shipNameManual: shipName } });
        jangada.shipNameManual = shipName;
        updatedJangadaShipName += 1;
      }

      if (owner && !isBadOwnerValue(owner)) {
        if (isEmptyOwner(jangada.owner) || isBadOwnerValue(jangada.owner)) {
          await prisma.jangada.update({ where: { id: jangada.id }, data: { owner } });
          jangada.owner = owner;
          updatedJangadaOwner += 1;
        } else if (norm(jangada.owner) !== norm(owner)) {
          ownerConflictsJangada += 1;
          if (conflictSamples.length < 30) {
            conflictSamples.push({
              type: 'jangada_owner_conflict',
              serial: jangada.serial,
              currentOwner: jangada.owner,
              certOwner: owner,
              fileName: row.fileName,
            });
          }
        }
      }
    }

    const shipKey = norm(shipName);
    const navio = byNavioNome.get(shipKey) || null;
    if (navio) matchedNavio += 1;
  }

  // Update navio.proprietario using best owner per ship
  for (const [shipKey, ownerKey] of bestOwnerByShip.entries()) {
    const navio = byNavioNome.get(shipKey);
    if (!navio) continue;

    const ownerText = ownerOriginalByNorm.get(ownerKey) || ownerKey;
    if (!ownerText) continue;

    if (isEmptyOwner(navio.proprietario)) {
      await prisma.navio.update({ where: { id: navio.id }, data: { proprietario: ownerText } });
      navio.proprietario = ownerText;
      updatedNavioOwner += 1;
    } else if (norm(navio.proprietario) !== ownerKey) {
      ownerConflictsNavio += 1;
      if (conflictSamples.length < 30) {
        conflictSamples.push({
          type: 'navio_owner_conflict',
          navioId: navio.id,
          navioNome: navio.nome,
          currentOwner: navio.proprietario,
          certOwner: ownerText,
        });
      }
    }
  }

  const certShipsNotInNavios = extracted
    .map((r) => clean(r.shipName))
    .filter(Boolean)
    .filter((name, idx, arr) => arr.indexOf(name) === idx)
    .filter((name) => !byNavioNome.has(norm(name)));

  const report = {
    timestamp: new Date().toISOString(),
    sourceDir: path.relative(ROOT, CERT_DIR_2026),
    filesProcessed: files.length,
    extractedWithShip,
    extractedWithOwner,
    matchedJangada,
    updatedJangadaOwner,
    updatedJangadaShipName,
    ownerConflictsJangada,
    matchedNavio,
    updatedNavioOwner,
    ownerConflictsNavio,
    uniqueShipsInCertificates: Object.keys(Object.fromEntries(extracted.map((r) => [norm(r.shipName), true]).filter(([k]) => k))).length,
    certShipsNotInNaviosCount: certShipsNotInNavios.length,
    certShipsNotInNaviosSample: certShipsNotInNavios.slice(0, 20),
    conflictSamples,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('Backfill navios/armadores de CERTIFICADOS 2026 concluído.');
  console.log(`Ficheiros processados: ${report.filesProcessed}`);
  console.log(`Extraídos com navio: ${report.extractedWithShip}`);
  console.log(`Extraídos com armador: ${report.extractedWithOwner}`);
  console.log(`Jangadas match por serial: ${report.matchedJangada}`);
  console.log(`Jangadas owner atualizadas: ${report.updatedJangadaOwner}`);
  console.log(`Jangadas shipNameManual atualizadas: ${report.updatedJangadaShipName}`);
  console.log(`Navios owner atualizados: ${report.updatedNavioOwner}`);
  console.log(`Conflitos owner (jangada/navio): ${report.ownerConflictsJangada}/${report.ownerConflictsNavio}`);
  console.log(`Navios em certificados sem match na tabela Navio: ${report.certShipsNotInNaviosCount}`);
  console.log(`Relatório: ${path.relative(ROOT, REPORT_PATH)}`);
}

main()
  .catch((error) => {
    console.error('Erro no backfill de navios/armadores 2026:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
