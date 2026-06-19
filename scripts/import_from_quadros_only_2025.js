const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
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

const INPUT_JSON = path.join(process.cwd(), 'scripts', 'jangadas_pack_validades_2025.json');
const OUT_JSON = path.join(process.cwd(), 'scripts', 'import_quadros_only_report.json');
const OUT_CSV = path.join(process.cwd(), 'scripts', 'import_quadros_only_report.csv');

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

function csvEscape(value) {
  const text = clean(value);
  if (text.includes(';') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function main() {
  if (!fs.existsSync(INPUT_JSON)) {
    console.error(`Input file not found: ${INPUT_JSON}`);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(INPUT_JSON, 'utf8'));
  const allRows = Array.isArray(payload?.rows) ? payload.rows : [];
  const quadroRows = allRows.filter((r) => Boolean(r?.hasQuadro));

  const navios = await prisma.navio.findMany({
    select: { id: true, nome: true },
  });
  const navioById = new Map(navios.map((n) => [n.id, n.nome]));

  const jangadas = await prisma.jangada.findMany({
    select: { id: true, serial: true, packType: true, artigos: true, shipId: true, shipNameManual: true },
  });

  const bySerial = new Map(jangadas.map((j) => [clean(j.serial), j]));
  const bySerialNormalized = new Map(
    jangadas
      .map((j) => [normalizeSerial(j.serial), j])
      .filter(([serial]) => serial),
  );

  const byShipName = new Map();
  for (const jangada of jangadas) {
    const shipName = clean(jangada.shipNameManual) || clean(navioById.get(jangada.shipId));
    const key = norm(shipName);
    if (!key) continue;
    if (!byShipName.has(key)) byShipName.set(key, []);
    byShipName.get(key).push(jangada);
  }

  const detail = [];

  let matched = 0;
  let unmatched = 0;
  let updated = 0;
  let importedPack = 0;
  let importedArtigos = 0;

  for (const row of quadroRows) {
    const file = clean(row.file);
    const serial = clean(row.raftSerial);
    const serialNorm = normalizeSerial(serial);
    const shipName = clean(row.shipName);
    const packType = clean(row.emergencyPackType);
    const validities = Array.isArray(row.validities) ? row.validities : [];

    let jangada = null;
    let matchStrategy = 'unmatched';

    if (serial && bySerial.has(serial)) {
      jangada = bySerial.get(serial);
      matchStrategy = 'serial_exact';
    } else if (serialNorm && bySerialNormalized.has(serialNorm)) {
      jangada = bySerialNormalized.get(serialNorm);
      matchStrategy = 'serial_normalized';
    } else {
      const shipCandidates = byShipName.get(norm(shipName)) || [];
      if (shipCandidates.length === 1) {
        jangada = shipCandidates[0];
        matchStrategy = 'ship_unique';
      }
    }

    if (!jangada) {
      unmatched += 1;
      detail.push({
        file,
        hasQuadro: true,
        raftSerial: serial,
        shipName,
        matchStrategy,
        matchedSerial: '',
        quadroPackType: packType,
        validitiesCount: validities.length,
        importedPackType: false,
        importedArtigosValidades: false,
        note: 'Sem correspondência de jangada',
      });
      continue;
    }

    matched += 1;

    const uniqueValidities = new Map();
    for (const item of validities) {
      const artigo = clean(item?.item);
      const validade = clean(item?.validade);
      if (!artigo || !validade) continue;
      const key = `${norm(artigo)}|${norm(validade)}`;
      if (!uniqueValidities.has(key)) {
        uniqueValidities.set(key, { item: artigo, validade });
      }
    }

    const artigos = Array.from(uniqueValidities.values());
    const artigosSerialized = artigos.length > 0 ? JSON.stringify(artigos) : null;

    const updateData = {};
    let packChanged = false;
    let artigosChanged = false;

    if (packType && packType !== clean(jangada.packType)) {
      updateData.packType = packType;
      packChanged = true;
      importedPack += 1;
    }

    if (artigosSerialized && artigosSerialized !== jangada.artigos) {
      updateData.artigos = artigosSerialized;
      artigosChanged = true;
      importedArtigos += 1;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.jangada.update({ where: { id: jangada.id }, data: updateData });
      updated += 1;
    }

    detail.push({
      file,
      hasQuadro: true,
      raftSerial: serial,
      shipName,
      matchStrategy,
      matchedSerial: clean(jangada.serial),
      quadroPackType: packType,
      validitiesCount: artigos.length,
      importedPackType: packChanged,
      importedArtigosValidades: artigosChanged,
      note: Object.keys(updateData).length > 0 ? 'Atualizado' : 'Sem alterações (já preenchido)',
    });
  }

  const summary = {
    timestamp: new Date().toISOString(),
    source: path.relative(process.cwd(), INPUT_JSON),
    totalRows: allRows.length,
    rowsWithQuadro: quadroRows.length,
    matched,
    unmatched,
    updated,
    importedPack,
    importedArtigos,
  };

  const report = { summary, detail };
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), 'utf8');

  const header = [
    'file',
    'hasQuadro',
    'raftSerial',
    'shipName',
    'matchStrategy',
    'matchedSerial',
    'quadroPackType',
    'validitiesCount',
    'importedPackType',
    'importedArtigosValidades',
    'note',
  ];

  const csvLines = [header.join(';')];
  for (const row of detail) {
    csvLines.push(
      [
        row.file,
        String(row.hasQuadro),
        row.raftSerial,
        row.shipName,
        row.matchStrategy,
        row.matchedSerial,
        row.quadroPackType,
        String(row.validitiesCount),
        String(row.importedPackType),
        String(row.importedArtigosValidades),
        row.note,
      ]
        .map(csvEscape)
        .join(';'),
    );
  }

  fs.writeFileSync(OUT_CSV, csvLines.join('\n'), 'utf8');

  console.log('Importação apenas de QUADROS concluída.');
  console.log(`Total rows: ${summary.totalRows}`);
  console.log(`Rows com QUADRO: ${summary.rowsWithQuadro}`);
  console.log(`Com match de jangada: ${summary.matched}`);
  console.log(`Sem match de jangada: ${summary.unmatched}`);
  console.log(`Jangadas atualizadas: ${summary.updated}`);
  console.log(`PackType importado: ${summary.importedPack}`);
  console.log(`Artigos/validades importados: ${summary.importedArtigos}`);
  console.log(`JSON: ${path.relative(process.cwd(), OUT_JSON)}`);
  console.log(`CSV: ${path.relative(process.cwd(), OUT_CSV)}`);
}

main()
  .catch((error) => {
    console.error('Erro na importação de QUADROS:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
