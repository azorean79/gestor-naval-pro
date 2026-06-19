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

const INPUT_JSON = path.join(process.cwd(), 'scripts', 'jangadas_pack_validades_2026.json');
const REPORT_JSON = path.join(process.cwd(), 'scripts', 'jangadas_artigos_validades_apply_2026_report.json');

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

function normalizePackType(value) {
  const normalized = clean(value).toUpperCase();
  const compact = normalized.replace(/\s+/g, ' ').trim();

  if (normalized.includes('SOLAS A') || normalized === 'SOLAS-A') return 'SOLAS A';
  if (normalized.includes('SOLAS B') || normalized === 'SOLAS-B' || normalized === 'SOLAS "B"') return 'SOLAS B';
  if (normalized.includes('ISO') || normalized.includes('ISO-RAFT')) return 'ISO-RAFT';
  if (normalized.includes('COASTAL')) return 'COASTAL';
  if (normalized.includes('OFFSHORE')) return 'OFFSHORE';

  if (compact.includes('<24H') || compact.includes('< 24H') || compact.includes('*- 24H')) return 'COASTAL';
  if (compact === 'STD' || compact.startsWith('STD ')) return 'R';
  if (compact === 'E') return 'R';
  if (compact === 'R') return 'SIMPLIFICADO MÍNIMO';

  if (normalized.includes('MIN') && (normalized.includes('SIMPL') || normalized.includes('REDUZ'))) return 'SIMPLIFICADO MÍNIMO';
  if (/^MIN(IMO)?$/.test(compact)) return 'SIMPLIFICADO MÍNIMO';
  if (compact === 'NIN') return 'SIMPLIFICADO MÍNIMO';

  if (normalized.includes('ORC')) return 'R';
  if (normalized.includes('REDUZ')) return 'R';
  if (normalized.includes('SIMPL')) return 'R';
  if (compact === 'SIM' || compact === 'SIMP' || compact === 'SIMP.' || compact === 'SIMPL') return 'R';

  if (normalized.includes('SOLAS') && !normalized.includes('A') && !normalized.includes('B')) return 'SOLAS B';

  return clean(value);
}

function parseValidadeToDate(value) {
  const text = clean(value);
  if (!text) return null;

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const dt = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00.000Z`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const ddmmyyyy = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    let year = Number(ddmmyyyy[3]);
    if (year < 100) year += 2000;
    const dt = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const mmyyyy = text.match(/^(\d{1,2})[\/-](\d{2,4})$/);
  if (mmyyyy) {
    const month = Number(mmyyyy[1]);
    let year = Number(mmyyyy[2]);
    if (year < 100) year += 2000;
    const dt = new Date(Date.UTC(year, month - 1, 1));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseIsoDate(value) {
  const text = clean(value);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const d = parseValidadeToDate(text);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

async function main() {
  if (!fs.existsSync(INPUT_JSON)) {
    console.error(`Input file not found: ${INPUT_JSON}`);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(INPUT_JSON, 'utf8'));
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];

  const navios = await prisma.navio.findMany({ select: { id: true, nome: true } });
  const navioByName = new Map(navios.map((n) => [norm(n.nome), n]));

  const jangadas = await prisma.jangada.findMany({
    select: { id: true, serial: true, packType: true, shipId: true, shipNameManual: true, owner: true },
  });

  const bySerial = new Map(jangadas.map((j) => [clean(j.serial), j]));
  const bySerialNormalized = new Map(
    jangadas
      .map((j) => [normalizeSerial(j.serial), j])
      .filter(([serial]) => serial),
  );

  const byShipName = new Map();
  for (const jangada of jangadas) {
    const shipName = clean(jangada.shipNameManual);
    const key = norm(shipName);
    if (!key) continue;
    if (!byShipName.has(key)) byShipName.set(key, []);
    byShipName.get(key).push(jangada);
  }

  let processedRows = 0;
  let rowsWithQuadro = 0;
  let matchedRows = 0;
  let matchedByExactSerial = 0;
  let matchedByNormalizedSerial = 0;
  let matchedByUniqueShip = 0;
  let unmatchedRows = 0;

  let updatedJangadas = 0;
  let packTypeUpdated = 0;
  let ownerUpdated = 0;
  let inspectionFieldsUpdated = 0;

  let artigosUpdated = 0;
  let artigosCreated = 0;
  let artigosWithoutDate = 0;

  let inspecoesUpserted = 0;
  let certValidadesUpserted = 0;

  const unmatched = [];

  for (const row of rows) {
    processedRows += 1;
    if (!row?.hasQuadro) continue;
    rowsWithQuadro += 1;

    const serial = clean(row.raftSerial);
    const serialNormalized = normalizeSerial(serial);
    const shipName = clean(row.shipName);
    const owner = clean(row.owner);
    const certNumber = clean(row.certNumber) || `AUTO-2026-${clean(row.file).replace(/\.xlsx$/i, '')}`;
    const inspectionDate = parseIsoDate(row.inspectionDate) || '2026-01-01';
    const nextInspectionDate = parseIsoDate(row.nextInspectionDate);

    let jangada = null;

    if (serial && bySerial.has(serial)) {
      jangada = bySerial.get(serial);
      matchedByExactSerial += 1;
    } else if (serialNormalized && bySerialNormalized.has(serialNormalized)) {
      jangada = bySerialNormalized.get(serialNormalized);
      matchedByNormalizedSerial += 1;
    } else {
      const shipKey = norm(shipName);
      const candidates = shipKey ? byShipName.get(shipKey) || [] : [];
      if (candidates.length === 1) {
        jangada = candidates[0];
        matchedByUniqueShip += 1;
      }
    }

    if (!jangada) {
      unmatchedRows += 1;
      unmatched.push({ file: clean(row.file), serial, shipName, certNumber });
      continue;
    }

    matchedRows += 1;

    // update jangada core inspection fields
    const patch = {};
    const normalizedPack = normalizePackType(row.emergencyPackType);

    if (normalizedPack && normalizedPack !== clean(jangada.packType)) {
      patch.packType = normalizedPack;
      packTypeUpdated += 1;
    }

    if (shipName && clean(jangada.shipNameManual) !== shipName) {
      patch.shipNameManual = shipName;
      inspectionFieldsUpdated += 1;
    }

    if (owner && clean(jangada.owner) !== owner) {
      patch.owner = owner;
      ownerUpdated += 1;
    }

    patch.dataInspecao = inspectionDate;
    patch.dataProxInspecao = nextInspectionDate || null;
    patch.ultimoCertificadoNumero = certNumber;

    if (Object.keys(patch).length > 0) {
      await prisma.jangada.update({ where: { id: jangada.id }, data: patch });
      updatedJangadas += 1;
    }

    const navio = navioByName.get(norm(shipName));

    await prisma.inspecao.upsert({
      where: { certificadoNumero: certNumber },
      create: {
        certificadoNumero: certNumber,
        navioNome: shipName || '',
        navioId: navio?.id || null,
        jangadaId: jangada.id,
        jangadaSerial: jangada.serial,
        dataInspecao: inspectionDate,
        dataProxInspecao: nextInspectionDate || null,
        status: 'Concluída',
        sourceFile: clean(row.file),
      },
      update: {
        navioNome: shipName || '',
        navioId: navio?.id || null,
        jangadaId: jangada.id,
        jangadaSerial: jangada.serial,
        dataInspecao: inspectionDate,
        dataProxInspecao: nextInspectionDate || null,
        status: 'Concluída',
        sourceFile: clean(row.file),
      },
    });
    inspecoesUpserted += 1;

    const rawValidities = Array.isArray(row.validities) ? row.validities : [];

    const unique = new Map();
    for (const entry of rawValidities) {
      const item = clean(entry?.item);
      const validade = clean(entry?.validade);
      if (!item || !validade) continue;
      const key = `${norm(item)}|${norm(validade)}`;
      if (!unique.has(key)) unique.set(key, { item, validade, rowNumber: Number(entry?.row) || null });
    }

    const artigos = Array.from(unique.values());

    const certificadoExtraido = await prisma.certificadoExtraido.upsert({
      where: { fileName: clean(row.file) },
      create: {
        certificadoNumero: certNumber,
        fileName: clean(row.file),
        raftSerial: jangada.serial,
        shipName: shipName || '',
        dataInspecao: inspectionDate,
        dataProxInspecao: nextInspectionDate || null,
        emergencyPackType: normalizedPack || null,
        hasQuadro: true,
        validitiesCount: artigos.length,
        sourceYear: 2026,
      },
      update: {
        certificadoNumero: certNumber,
        raftSerial: jangada.serial,
        shipName: shipName || '',
        dataInspecao: inspectionDate,
        dataProxInspecao: nextInspectionDate || null,
        emergencyPackType: normalizedPack || null,
        hasQuadro: true,
        validitiesCount: artigos.length,
        sourceYear: 2026,
      },
      select: { id: true },
    });

    if (artigos.length > 0) {
      const existingArtigos = await prisma.artigoJangada.findMany({
        where: { jangadaId: jangada.id },
        select: { id: true, name: true, validade: true },
      });

      const existingByName = new Map();
      for (const artigo of existingArtigos) {
        const key = norm(artigo.name);
        if (!key || existingByName.has(key)) continue;
        existingByName.set(key, artigo);
      }

      for (const artigo of artigos) {
        const itemName = clean(artigo.item);
        const validadeRaw = clean(artigo.validade);
        const rowNumber = Number(artigo.rowNumber) || null;
        const validadeDate = parseValidadeToDate(validadeRaw);
        if (!validadeDate) artigosWithoutDate += 1;

        const existing = existingByName.get(norm(itemName));

        if (existing) {
          const currentTime = existing.validade ? new Date(existing.validade).getTime() : null;
          const nextTime = validadeDate ? validadeDate.getTime() : null;
          if (currentTime !== nextTime) {
            await prisma.artigoJangada.update({ where: { id: existing.id }, data: { validade: validadeDate || null } });
            artigosUpdated += 1;
          }
        } else {
          await prisma.artigoJangada.create({
            data: {
              jangadaId: jangada.id,
              name: itemName,
              quantidade: 1,
              validade: validadeDate || null,
            },
          });
          artigosCreated += 1;
        }

        const existsValidade = await prisma.certificadoValidade.findFirst({
          where: {
            certificadoId: certificadoExtraido.id,
            item: itemName,
            validade: validadeRaw,
            rowNumber,
          },
          select: { id: true },
        });

        if (!existsValidade) {
          await prisma.certificadoValidade.create({
            data: {
              certificadoId: certificadoExtraido.id,
              item: itemName,
              validade: validadeRaw,
              rowNumber,
            },
          });
          certValidadesUpserted += 1;
        }
      }
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    sourceFile: path.relative(process.cwd(), INPUT_JSON),
    processedRows,
    rowsWithQuadro,
    matchedRows,
    matchedByExactSerial,
    matchedByNormalizedSerial,
    matchedByUniqueShip,
    unmatchedRows,
    updatedJangadas,
    packTypeUpdated,
    ownerUpdated,
    inspectionFieldsUpdated,
    inspecoesUpserted,
    artigosUpdated,
    artigosCreated,
    artigosWithoutDate,
    certValidadesUpserted,
    unmatched: unmatched.slice(0, 100),
  };

  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), 'utf8');

  console.log('Aplicação 2026 de artigos/validades/inspeção concluída.');
  console.log(`Rows processadas: ${processedRows}`);
  console.log(`Rows com QUADRO: ${rowsWithQuadro}`);
  console.log(`Rows com match de jangada: ${matchedRows}`);
  console.log(`Rows sem correspondência: ${unmatchedRows}`);
  console.log(`Jangadas atualizadas: ${updatedJangadas}`);
  console.log(`Inspeções upserted: ${inspecoesUpserted}`);
  console.log(`Artigos atualizados: ${artigosUpdated}`);
  console.log(`Artigos criados: ${artigosCreated}`);
  console.log(`Validades em CertificadoValidade: ${certValidadesUpserted}`);
  console.log(`Relatório: ${path.relative(process.cwd(), REPORT_JSON)}`);
}

main()
  .catch((error) => {
    console.error('Erro ao aplicar artigos/validades/inspeções 2026:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
