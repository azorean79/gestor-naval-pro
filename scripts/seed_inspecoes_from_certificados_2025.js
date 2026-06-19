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
  console.error('No database connection string found.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const CERT_DIR = path.join(process.cwd(), 'CERTIFICADOS 2025');

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function norm(value) {
  return clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
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
    for (let c = 0; c < (rows[r] || []).length; c += 1) {
      const cell = norm(rows[r][c]);
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
    getCell(rows, pos.r + 2, pos.c),
  ].map(clean);
  return candidates.find(Boolean) || '';
}

function parseDate(raw) {
  const v = clean(raw);
  if (!v) return '';

  const dateObj = new Date(v);
  if (!Number.isNaN(dateObj.getTime())) {
    const y = dateObj.getFullYear();
    const m = `${dateObj.getMonth() + 1}`.padStart(2, '0');
    const d = `${dateObj.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const dmy = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${y}-${m}-${d}`;
  }

  return '';
}

function parseFile(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const certSheetName = wb.SheetNames.find((s) => norm(s) === 'CERTIFICADO') || wb.SheetNames[0];
  const certRows = certSheetName ? toMatrix(wb.Sheets[certSheetName]) : [];

  const certPos = findLabel(certRows, ['Certificate No.:', 'Certificado No.:'], 20);
  const shipPos = findLabel(certRows, ['Name of Ship:', 'Nome do navio']);
  const serialPos = findLabel(certRows, ['Serial No.', 'No. Série:', 'No. Serie:'], 24);
  const inspPos = findLabel(certRows, ['Date of inspection:', 'Data da inspecção:', 'Data da inspeção:']);
  const nextPos = findLabel(certRows, ['Date next inspection:', 'Data da próxima inspecção:', 'Data da próxima inspeção:']);

  const certificadoNumero = clean(valueNear(certRows, certPos));
  const navioNome = clean(valueNear(certRows, shipPos));
  const jangadaSerial = clean(valueNear(certRows, serialPos));
  const dataInspecao = parseDate(valueNear(certRows, inspPos));
  const dataProxInspecao = parseDate(valueNear(certRows, nextPos));

  return {
    sourceFile: path.basename(filePath),
    certificadoNumero,
    navioNome,
    jangadaSerial,
    dataInspecao,
    dataProxInspecao,
  };
}

function normalizeShipNameFromFilename(fileName) {
  return clean(fileName.replace(/\.xlsx$/i, '').replace(/^AZ\d{2}-\d+\s*/i, ''));
}

async function main() {
  const files = fs
    .readdirSync(CERT_DIR)
    .filter((f) => f.toLowerCase().endsWith('.xlsx'))
    .sort((a, b) => a.localeCompare(b));

  const navios = await prisma.navio.findMany({ select: { id: true, nome: true } });
  const jangadas = await prisma.jangada.findMany({ select: { id: true, serial: true, shipId: true, shipNameManual: true } });

  const naviosByNorm = new Map(navios.map((n) => [norm(n.nome), n]));
  const jangadasBySerial = new Map(jangadas.map((j) => [clean(j.serial), j]));

  const jangadasByShipNorm = new Map();
  for (const j of jangadas) {
    let shipName = '';
    if (j.shipId) {
      const ship = navios.find((n) => n.id === j.shipId);
      shipName = ship?.nome || '';
    }
    if (!shipName) shipName = clean(j.shipNameManual);
    const key = norm(shipName);
    if (!key) continue;
    if (!jangadasByShipNorm.has(key)) jangadasByShipNorm.set(key, []);
    jangadasByShipNorm.get(key).push(j);
  }

  for (const [key, list] of jangadasByShipNorm.entries()) {
    list.sort((a, b) => a.id - b.id);
    jangadasByShipNorm.set(key, list);
  }

  const shipUsageCursor = new Map();

  let processed = 0;
  let upserted = 0;
  let linkedBySerial = 0;
  let linkedByShipRule = 0;
  let noJangadaLink = 0;

  for (const file of files) {
    const parsed = parseFile(path.join(CERT_DIR, file));
    processed += 1;

    const certificadoNumero = parsed.certificadoNumero || `AUTO-${file.replace(/\.xlsx$/i, '')}`;
    const navioNome = parsed.navioNome || normalizeShipNameFromFilename(file);
    const navio = naviosByNorm.get(norm(navioNome));

    let jangada = null;
    if (parsed.jangadaSerial && jangadasBySerial.has(parsed.jangadaSerial)) {
      jangada = jangadasBySerial.get(parsed.jangadaSerial);
      linkedBySerial += 1;
    } else {
      const shipKey = norm(navioNome);
      const shipJangadas = jangadasByShipNorm.get(shipKey) || [];
      if (shipJangadas.length > 0) {
        const cursor = shipUsageCursor.get(shipKey) || 0;
        jangada = shipJangadas[cursor % shipJangadas.length];
        shipUsageCursor.set(shipKey, cursor + 1);
        linkedByShipRule += 1;
      }
    }

    if (!jangada) noJangadaLink += 1;

    await prisma.inspecao.upsert({
      where: { certificadoNumero },
      create: {
        certificadoNumero,
        navioNome,
        navioId: navio?.id || null,
        jangadaId: jangada?.id || null,
        jangadaSerial: jangada?.serial || parsed.jangadaSerial || null,
        dataInspecao: parsed.dataInspecao || '2025-01-01',
        dataProxInspecao: parsed.dataProxInspecao || null,
        status: 'Concluída',
        sourceFile: parsed.sourceFile,
      },
      update: {
        navioNome,
        navioId: navio?.id || null,
        jangadaId: jangada?.id || null,
        jangadaSerial: jangada?.serial || parsed.jangadaSerial || null,
        dataInspecao: parsed.dataInspecao || '2025-01-01',
        dataProxInspecao: parsed.dataProxInspecao || null,
        status: 'Concluída',
        sourceFile: parsed.sourceFile,
      },
    });

    upserted += 1;
  }

  const allInspecoes = await prisma.inspecao.findMany({
    orderBy: [{ dataInspecao: 'desc' }, { certificadoNumero: 'asc' }],
  });
  fs.writeFileSync(path.join(process.cwd(), 'scripts', 'inspecoes_2025_seed_result.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    processed,
    upserted,
    linkedBySerial,
    linkedByShipRule,
    noJangadaLink,
    totalInspecoes: allInspecoes.length,
    sample: allInspecoes.slice(0, 30),
  }, null, 2));

  console.log('Seed de inspeções 2025 concluído.');
  console.log(`Ficheiros processados: ${processed}`);
  console.log(`Inspeções upserted: ${upserted}`);
  console.log(`Ligadas por serial: ${linkedBySerial}`);
  console.log(`Ligadas pela regra de navio com múltiplas jangadas: ${linkedByShipRule}`);
  console.log(`Sem ligação de jangada: ${noJangadaLink}`);
}

main()
  .catch((error) => {
    console.error('Erro no seed de inspeções:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
