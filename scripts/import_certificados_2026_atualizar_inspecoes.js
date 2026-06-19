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
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const ROOT = process.cwd();
const CERT_DIR_2025 = path.join(ROOT, 'CERTIFICADOS 2025');
const CERT_DIR_2026 = path.join(ROOT, 'CERTIFICADOS 2026');
const REPORT_PATH = path.join(ROOT, 'scripts', 'import_certificados_2026_report.json');

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

function valueBelowSameColumn(rows, pos, maxLookahead = 4) {
  if (!pos) return '';
  for (let i = 1; i <= maxLookahead; i += 1) {
    const v = clean(getCell(rows, pos.r + i, pos.c));
    if (v && !isLikelyLabel(v)) return v;
  }
  return '';
}

function parseDateToIso(raw) {
  const value = clean(raw);
  if (!value) return '';

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    let y = dmy[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }

  const dt = new Date(value);
  if (!Number.isNaN(dt.getTime())) {
    const y = String(dt.getUTCFullYear());
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

function parseCapacity(text) {
  const compact = norm(text);
  const m = compact.match(/\b(\d{1,2})\s*P\b/) || compact.match(/\b(\d{1,2})\b/);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : 0;
}

function inferBrand(typeText) {
  const t = norm(typeText);
  if (t.includes('ZODIAC')) return 'ZODIAC';
  if (t.includes('RFD')) return 'RFD';
  if (t.includes('PLASTIMO')) return 'PLASTIMO';
  if (t.includes('LALIZAS')) return 'LALIZAS';
  if (t.includes('EUROVINIL')) return 'EUROVINIL';
  if (t.includes('SEA-SAFE') || t.includes('SEA SAFE')) return 'SEA-SAFE';
  if (t.includes('DSB')) return 'DSB';
  return 'N/D';
}

function normalizePackType(value) {
  const normalized = norm(value);
  if (!normalized) return 'N/D';

  if (normalized.includes('SOLAS A')) return 'SOLAS A';
  if (normalized.includes('SOLAS B')) return 'SOLAS B';
  if (normalized.includes('ISO')) return 'ISO-RAFT';
  if (normalized.includes('OFFSHORE')) return 'OFFSHORE';
  if (normalized.includes('COASTAL')) return 'COASTAL';
  if (normalized.includes('ORC+')) return 'OFFSHORE';
  if (normalized.includes('ORC')) return 'COASTAL';
  if (normalized.includes('STD') || normalized.includes('STANDARD') || normalized === 'R') return 'R';

  return clean(value) || 'N/D';
}

function fallbackSerialFromFile(fileName, usedSerials) {
  const base = norm(fileName.replace(/\.xlsx$/i, '')).replace(/[^A-Z0-9]/g, '').slice(0, 18) || 'CERT2026';
  let idx = 1;
  let candidate = `AUTO26-${base}-${String(idx).padStart(3, '0')}`;
  while (usedSerials.has(candidate)) {
    idx += 1;
    candidate = `AUTO26-${base}-${String(idx).padStart(3, '0')}`;
  }
  return candidate;
}

function parseWorkbook(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const certSheetName = wb.SheetNames.find((s) => norm(s) === 'CERTIFICADO') || wb.SheetNames[0];
  const certRows = certSheetName ? toMatrix(wb.Sheets[certSheetName]) : [];

  const certNoPos = findLabel(certRows, ['CERTIFICATE NO.:', 'CERTIFICADO NO.:', 'CERTIFICADO NO']);
  const shipPos = findLabel(certRows, ['NAME OF SHIP:', 'NOME DO NAVIO']);
  const ownerPos = findLabel(certRows, ['SHIP OWNER:', 'ARMADOR:']);
  const identificationPos = findLabel(certRows, ['IDENTIFICATION:', 'IDENTIFICAÇÃO:', 'IDENTIFICACAO:']);
  const verificationPos = findLabel(certRows, ['VERIFICATION:', 'VERIFICAÇÃO:', 'VERIFICACAO:']);

  const fileName = path.basename(filePath);
  const idValuesRow = typeof identificationPos?.r === 'number' ? identificationPos.r + 2 : -1;
  const verValuesRow = typeof verificationPos?.r === 'number' ? verificationPos.r + 2 : -1;

  const certNo = clean(valueNear(certRows, certNoPos));
  const shipName =
    clean(valueNear(certRows, shipPos)) ||
    valueBelowSameColumn(certRows, shipPos, 3) ||
    clean(fileName.replace(/\.xlsx$/i, '').replace(/^AZ\d{2}-\d+\s*/i, ''));
  const owner = clean(valueNear(certRows, ownerPos)) || valueBelowSameColumn(certRows, ownerPos, 3);

  const type = idValuesRow >= 0 ? clean(getCell(certRows, idValuesRow, 2)) : '';
  const serial = idValuesRow >= 0 ? clean(getCell(certRows, idValuesRow, 8)) : '';
  const manufDate = parseDateToIso(idValuesRow >= 0 ? clean(getCell(certRows, idValuesRow, 10)) : '');

  const inspectionDate = parseDateToIso(verValuesRow >= 0 ? clean(getCell(certRows, verValuesRow, 2)) : '');
  const nextInspectionDate = parseDateToIso(verValuesRow >= 0 ? clean(getCell(certRows, verValuesRow, 10)) : '');

  return {
    fileName,
    certNo,
    shipName,
    serial,
    owner,
    type,
    manufDate,
    inspectionDate,
    nextInspectionDate,
  };
}

function pushBestCandidate(map, key, candidate) {
  if (!key) return;
  const prev = map.get(key);
  if (!prev || clean(candidate.dataInspecao) > clean(prev.dataInspecao) || candidate.fileName > prev.fileName) {
    map.set(key, candidate);
  }
}

function normalizeShipNameFromFilename(fileName) {
  return clean(fileName.replace(/\.xlsx$/i, '').replace(/^AZ\d{2}-\d+\s*/i, ''));
}

async function main() {
  if (!fs.existsSync(CERT_DIR_2026)) {
    throw new Error(`Pasta não encontrada: ${CERT_DIR_2026}`);
  }

  const files = fs.readdirSync(CERT_DIR_2026).filter((f) => f.toLowerCase().endsWith('.xlsx')).sort((a, b) => a.localeCompare(b, 'pt'));

  const navios = await prisma.navio.findMany({ select: { id: true, nome: true } });
  const naviosByName = new Map(navios.map((n) => [norm(n.nome), n]));

  const certs2025 = await prisma.certificadoExtraido.findMany({
    where: {
      sourceYear: 2025,
      certificadoNumero: { not: null },
      raftSerial: { not: null },
    },
    select: {
      certificadoNumero: true,
      raftSerial: true,
      dataInspecao: true,
      dataProxInspecao: true,
      fileName: true,
      shipName: true,
      id: true,
    },
  });

  const cert2025BySerialExact = new Map();
  const cert2025BySerialNorm = new Map();
  const cert2025ByShipName = new Map();
  for (const c of certs2025) {
    const keyExact = clean(c.raftSerial);
    const keyNorm = normalizeSerial(c.raftSerial);
    const keyShip = norm(c.shipName);

    const prevExact = cert2025BySerialExact.get(keyExact);
    if (!prevExact || clean(c.dataInspecao) > clean(prevExact.dataInspecao) || c.id > prevExact.id) {
      cert2025BySerialExact.set(keyExact, c);
    }

    const prevNorm = cert2025BySerialNorm.get(keyNorm);
    if (!prevNorm || clean(c.dataInspecao) > clean(prevNorm.dataInspecao) || c.id > prevNorm.id) {
      cert2025BySerialNorm.set(keyNorm, c);
    }

    const prevShip = cert2025ByShipName.get(keyShip);
    if (!prevShip || clean(c.dataInspecao) > clean(prevShip.dataInspecao) || c.id > prevShip.id) {
      cert2025ByShipName.set(keyShip, c);
    }
  }

  if (fs.existsSync(CERT_DIR_2025)) {
    const files2025 = fs
      .readdirSync(CERT_DIR_2025)
      .filter((f) => f.toLowerCase().endsWith('.xlsx'))
      .sort((a, b) => a.localeCompare(b, 'pt'));

    for (const file of files2025) {
      const parsed2025 = parseWorkbook(path.join(CERT_DIR_2025, file));
      const candidate = {
        certificadoNumero: clean(parsed2025.certNo) || `AUTO-2025-${file.replace(/\.xlsx$/i, '')}`,
        raftSerial: clean(parsed2025.serial) || null,
        dataInspecao: parsed2025.inspectionDate || '2025-01-01',
        dataProxInspecao: parsed2025.nextInspectionDate || null,
        fileName: parsed2025.fileName,
        shipName: parsed2025.shipName || normalizeShipNameFromFilename(file),
      };

      pushBestCandidate(cert2025BySerialExact, clean(candidate.raftSerial), candidate);
      pushBestCandidate(cert2025BySerialNorm, normalizeSerial(candidate.raftSerial), candidate);
      pushBestCandidate(cert2025ByShipName, norm(candidate.shipName), candidate);
    }
  }

  const jangadas = await prisma.jangada.findMany({
    select: { id: true, serial: true, shipId: true, shipNameManual: true, brand: true, model: true },
  });

  const jangadaBySerial = new Map(jangadas.map((j) => [clean(j.serial), j]));
  const jangadaBySerialNorm = new Map(
    jangadas
      .map((j) => [normalizeSerial(j.serial), j])
      .filter(([s]) => s),
  );

  const byShipName = new Map();
  for (const j of jangadas) {
    const shipName = clean(j.shipNameManual) || clean(navios.find((n) => n.id === j.shipId)?.nome);
    const key = norm(shipName);
    if (!key) continue;
    if (!byShipName.has(key)) byShipName.set(key, []);
    byShipName.get(key).push(j);
  }

  const usedSerials = new Set(jangadas.map((j) => clean(j.serial)).filter(Boolean));

  const report = {
    timestamp: new Date().toISOString(),
    sourceDir: path.relative(ROOT, CERT_DIR_2026),
    filesProcessed: files.length,
    inspections2026Upserted: 0,
    jangadasUpdatedDates: 0,
    jangadasCreated: 0,
    linkedBySerialExact: 0,
    linkedBySerialNormalized: 0,
    linkedByShipUnique: 0,
    linkedByShipRoundRobin: 0,
    history2025Ensured: 0,
    history2025AlreadyExisted: 0,
    createdWithoutCertNo: 0,
    createdWithoutSerial: 0,
    warnings: [],
  };

  const shipRoundRobinCursor = new Map();

  for (const file of files) {
    const parsed = parseWorkbook(path.join(CERT_DIR_2026, file));

    const serialClean = clean(parsed.serial);
    const serialNorm = normalizeSerial(serialClean);
    const shipKey = norm(parsed.shipName);
    const navio = naviosByName.get(shipKey) || null;

    let jangada = null;
    let matchMode = 'none';
    const byShip = byShipName.get(shipKey) || [];

    if (serialClean && jangadaBySerial.has(serialClean)) {
      jangada = jangadaBySerial.get(serialClean);
      matchMode = 'serial_exact';
      report.linkedBySerialExact += 1;
    } else if (serialNorm && jangadaBySerialNorm.has(serialNorm)) {
      jangada = jangadaBySerialNorm.get(serialNorm);
      matchMode = 'serial_norm';
      report.linkedBySerialNormalized += 1;
    } else {
      if (serialClean) {
        if (byShip.length === 1 && (isLikelyLabel(byShip[0].serial) || !clean(byShip[0].serial))) {
          jangada = byShip[0];
          matchMode = 'ship_unique';
          report.linkedByShipUnique += 1;
        }
      } else if (byShip.length === 1) {
        jangada = byShip[0];
        matchMode = 'ship_unique';
        report.linkedByShipUnique += 1;
      } else if (byShip.length > 1) {
        const cursor = shipRoundRobinCursor.get(shipKey) || 0;
        jangada = byShip[cursor % byShip.length];
        shipRoundRobinCursor.set(shipKey, cursor + 1);
        matchMode = 'ship_round_robin';
        report.linkedByShipRoundRobin += 1;
      }
    }

    if (!jangada) {
      const syntheticSerial = serialClean || fallbackSerialFromFile(file, usedSerials);
      if (!serialClean) report.createdWithoutSerial += 1;

      const createPayload = {
        brand: inferBrand(parsed.type),
        model: clean(parsed.type) || 'N/D',
        serial: syntheticSerial,
        dataFabrico: parsed.manufDate || parsed.inspectionDate || '2026-01-01',
        packType: normalizePackType(parsed.type),
        capacity: parseCapacity(parsed.type),
        owner: parsed.owner || parsed.shipName || 'N/D',
        shipId: navio?.id || null,
        shipNameManual: parsed.shipName || null,
        dataInspecao: parsed.inspectionDate || null,
        dataProxInspecao: parsed.nextInspectionDate || null,
        ultimoCertificadoNumero: clean(parsed.certNo) || null,
      };

      jangada = await prisma.jangada.create({ data: createPayload });
      usedSerials.add(syntheticSerial);
      report.jangadasCreated += 1;
      matchMode = 'created';

      jangadaBySerial.set(clean(jangada.serial), jangada);
      jangadaBySerialNorm.set(normalizeSerial(jangada.serial), jangada);
      if (shipKey) {
        if (!byShipName.has(shipKey)) byShipName.set(shipKey, []);
        byShipName.get(shipKey).push(jangada);
      }
    }

    if (
      serialClean &&
      jangada &&
      clean(jangada.serial) !== serialClean &&
      (isLikelyLabel(jangada.serial) || !clean(jangada.serial))
    ) {
      const existingWithSerial = await prisma.jangada.findUnique({
        where: { serial: serialClean },
        select: { id: true },
      });
      if (!existingWithSerial || existingWithSerial.id === jangada.id) {
        jangada = await prisma.jangada.update({
          where: { id: jangada.id },
          data: { serial: serialClean },
          select: { id: true, serial: true, shipId: true, shipNameManual: true, brand: true, model: true },
        });
        jangadaBySerial.set(clean(jangada.serial), jangada);
        jangadaBySerialNorm.set(normalizeSerial(jangada.serial), jangada);
      }
    }

    const certificadoNumero = clean(parsed.certNo) || `AUTO-2026-${file.replace(/\.xlsx$/i, '')}`;
    if (!clean(parsed.certNo)) report.createdWithoutCertNo += 1;

    await prisma.inspecao.upsert({
      where: { certificadoNumero },
      create: {
        certificadoNumero,
        navioNome: parsed.shipName || navio?.nome || '',
        navioId: navio?.id || null,
        jangadaId: jangada.id,
        jangadaSerial: jangada.serial,
        dataInspecao: parsed.inspectionDate || '2026-01-01',
        dataProxInspecao: parsed.nextInspectionDate || null,
        status: 'Concluída',
        sourceFile: parsed.fileName,
      },
      update: {
        navioNome: parsed.shipName || navio?.nome || '',
        navioId: navio?.id || null,
        jangadaId: jangada.id,
        jangadaSerial: jangada.serial,
        dataInspecao: parsed.inspectionDate || '2026-01-01',
        dataProxInspecao: parsed.nextInspectionDate || null,
        status: 'Concluída',
        sourceFile: parsed.fileName,
      },
    });
    report.inspections2026Upserted += 1;

    await prisma.jangada.update({
      where: { id: jangada.id },
      data: {
        dataInspecao: parsed.inspectionDate || undefined,
        dataProxInspecao: parsed.nextInspectionDate || undefined,
        ultimoCertificadoNumero: certificadoNumero,
        shipNameManual: parsed.shipName || undefined,
      },
    });
    report.jangadasUpdatedDates += 1;

    const cert2025 =
      cert2025BySerialExact.get(clean(jangada.serial)) ||
      cert2025BySerialNorm.get(normalizeSerial(jangada.serial)) ||
      cert2025ByShipName.get(shipKey) ||
      null;

    if (cert2025?.certificadoNumero) {
      const exists2025 = await prisma.inspecao.findUnique({
        where: { certificadoNumero: cert2025.certificadoNumero },
        select: { id: true },
      });

      if (exists2025) {
        report.history2025AlreadyExisted += 1;
      } else {
        await prisma.inspecao.create({
          data: {
            certificadoNumero: cert2025.certificadoNumero,
            navioNome: cert2025.shipName || parsed.shipName || navio?.nome || '',
            navioId: navio?.id || null,
            jangadaId: jangada.id,
            jangadaSerial: jangada.serial,
            dataInspecao: clean(cert2025.dataInspecao) || '2025-01-01',
            dataProxInspecao: clean(cert2025.dataProxInspecao) || null,
            status: 'Concluída',
            sourceFile: clean(cert2025.fileName) || null,
          },
        });
        report.history2025Ensured += 1;
      }
    } else {
      report.warnings.push({
        file: parsed.fileName,
        jangadaSerial: jangada.serial,
        mode: matchMode,
        warning: 'Sem certificado 2025 encontrado para inserir no histórico',
      });
    }
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('Importação/atualização CERTIFICADOS 2026 concluída.');
  console.log(`Ficheiros processados: ${report.filesProcessed}`);
  console.log(`Inspeções 2026 upserted: ${report.inspections2026Upserted}`);
  console.log(`Jangadas com datas atualizadas: ${report.jangadasUpdatedDates}`);
  console.log(`Jangadas criadas: ${report.jangadasCreated}`);
  console.log(`Histórico 2025 garantido (novos): ${report.history2025Ensured}`);
  console.log(`Histórico 2025 já existia: ${report.history2025AlreadyExisted}`);
  console.log(`Sem nº certificado no ficheiro 2026 (AUTO-*): ${report.createdWithoutCertNo}`);
  console.log(`Sem serial no ficheiro 2026 (criação AUTO26-*): ${report.createdWithoutSerial}`);
  console.log(`Relatório: ${path.relative(ROOT, REPORT_PATH)}`);
}

main()
  .catch((error) => {
    console.error('Erro na importação de certificados 2026:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
