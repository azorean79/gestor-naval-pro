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
const INPUT_REPORT_JSON = path.join(process.cwd(), 'scripts', 'import_certificados_2025_report.json');

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseDateIso(dateValue) {
  const value = clean(dateValue);
  if (!value) return null;

  const isoLike = /^(\d{4})-(\d{2})-(\d{2})$/;
  const matchIso = value.match(isoLike);
  if (matchIso) return new Date(`${matchIso[1]}-${matchIso[2]}-${matchIso[3]}T00:00:00.000Z`);

  const slashLike = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
  const matchSlash = value.match(slashLike);
  if (matchSlash) {
    const day = Number(matchSlash[1]);
    const month = Number(matchSlash[2]);
    let year = Number(matchSlash[3]);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, month - 1, day));
  }

  return null;
}

function buildArticles(validities) {
  const unique = new Map();
  for (const entry of validities || []) {
    const item = clean(entry?.item);
    const validade = clean(entry?.validade);
    if (!item || !validade) continue;
    const key = `${item.toUpperCase()}|${validade.toUpperCase()}`;
    if (!unique.has(key)) {
      unique.set(key, { item, validade });
    }
  }
  return Array.from(unique.values());
}

async function main() {
  if (!fs.existsSync(INPUT_JSON)) {
    console.error(`Input file not found: ${INPUT_JSON}`);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(INPUT_JSON, 'utf8'));
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];

  const reportPayload = fs.existsSync(INPUT_REPORT_JSON)
    ? JSON.parse(fs.readFileSync(INPUT_REPORT_JSON, 'utf8'))
    : null;
  const reportSample = Array.isArray(reportPayload?.sample) ? reportPayload.sample : [];
  const reportByFile = new Map(
    reportSample
      .map((row) => [clean(row?.file), row])
      .filter(([fileName]) => fileName),
  );

  const jangadas = await prisma.jangada.findMany({ select: { serial: true } });
  const existingSerials = new Set(jangadas.map((j) => clean(j.serial)).filter(Boolean));

  let certificadosUpserted = 0;
  let validitiesInserted = 0;
  let serialLinked = 0;
  let serialMissing = 0;
  let historicoRows = 0;
  let ativosMarcados = 0;
  let jangadasAtivasAtualizadas = 0;

  for (const row of rows) {
    const fileName = clean(row.file);
    if (!fileName) continue;

    const rawSerial = clean(row.raftSerial);
    const raftSerial = rawSerial && existingSerials.has(rawSerial) ? rawSerial : null;
    const reportRow = reportByFile.get(fileName);

    if (raftSerial) serialLinked += 1;
    if (rawSerial && !raftSerial) serialMissing += 1;

    const validities = Array.isArray(row.validities) ? row.validities : [];

    const certificado = await prisma.certificadoExtraido.upsert({
      where: { fileName },
      create: {
        fileName,
        certificadoNumero: clean(reportRow?.certNo) || null,
        sourceYear: 2025,
        raftSerial,
        shipName: clean(row.shipName) || null,
        dataInspecao: clean(reportRow?.inspectionDate) || null,
        dataProxInspecao: clean(reportRow?.nextInspectionDate) || null,
        emergencyPackType: clean(row.emergencyPackType) || null,
        hasQuadro: Boolean(row.hasQuadro),
        validitiesCount: validities.length,
        isMaisRecente: false,
        aplicadoComoAtivo: false,
      },
      update: {
        certificadoNumero: clean(reportRow?.certNo) || null,
        sourceYear: 2025,
        raftSerial,
        shipName: clean(row.shipName) || null,
        dataInspecao: clean(reportRow?.inspectionDate) || null,
        dataProxInspecao: clean(reportRow?.nextInspectionDate) || null,
        emergencyPackType: clean(row.emergencyPackType) || null,
        hasQuadro: Boolean(row.hasQuadro),
        validitiesCount: validities.length,
        isMaisRecente: false,
        aplicadoComoAtivo: false,
      },
      select: { id: true },
    });

    await prisma.certificadoValidade.deleteMany({ where: { certificadoId: certificado.id } });

    const valuesToInsert = validities
      .map((entry) => ({
        certificadoId: certificado.id,
        item: clean(entry.item),
        validade: clean(entry.validade),
        rowNumber: Number.isInteger(entry.row) ? entry.row : null,
      }))
      .filter((entry) => entry.item && entry.validade);

    if (valuesToInsert.length > 0) {
      await prisma.certificadoValidade.createMany({
        data: valuesToInsert,
        skipDuplicates: true,
      });
      validitiesInserted += valuesToInsert.length;
    }

    certificadosUpserted += 1;
    historicoRows += 1;
  }

  const certificadosComSerial = await prisma.certificadoExtraido.findMany({
    where: { raftSerial: { not: null } },
    select: {
      id: true,
      raftSerial: true,
      dataInspecao: true,
      dataProxInspecao: true,
      emergencyPackType: true,
      validities: { select: { item: true, validade: true } },
    },
  });

  const bySerial = new Map();
  for (const cert of certificadosComSerial) {
    const serial = clean(cert.raftSerial);
    if (!serial) continue;
    if (!bySerial.has(serial)) bySerial.set(serial, []);
    bySerial.get(serial).push(cert);
  }

  for (const [serial, certs] of bySerial.entries()) {
    const ordered = [...certs].sort((a, b) => {
      const dateA = parseDateIso(a.dataInspecao);
      const dateB = parseDateIso(b.dataInspecao);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.id - a.id;
    });

    const latest = ordered[0];
    if (!latest) continue;

    await prisma.certificadoExtraido.updateMany({
      where: { raftSerial: serial },
      data: { isMaisRecente: false, aplicadoComoAtivo: false },
    });

    await prisma.certificadoExtraido.update({
      where: { id: latest.id },
      data: { isMaisRecente: true, aplicadoComoAtivo: true },
    });
    ativosMarcados += 1;

    const artigos = buildArticles(latest.validities);
    await prisma.jangada.updateMany({
      where: { serial },
      data: {
        dataInspecao: clean(latest.dataInspecao) || undefined,
        dataProxInspecao: clean(latest.dataProxInspecao) || undefined,
        packType: clean(latest.emergencyPackType) || undefined,
        artigos: artigos.length ? JSON.stringify(artigos) : undefined,
      },
    });
    jangadasAtivasAtualizadas += 1;
  }

  console.log('Seed de certificados extraídos concluído.');
  console.log(`Ficheiros processados: ${rows.length}`);
  console.log(`Registos de histórico: ${historicoRows}`);
  console.log(`Certificados upserted: ${certificadosUpserted}`);
  console.log(`Validades inseridas: ${validitiesInserted}`);
  console.log(`Com serial ligado a Jangada: ${serialLinked}`);
  console.log(`Com serial sem Jangada correspondente: ${serialMissing}`);
  console.log(`Certificados marcados como mais recentes: ${ativosMarcados}`);
  console.log(`Jangadas com ativo atualizado: ${jangadasAtivasAtualizadas}`);
}

main()
  .catch((error) => {
    console.error('Erro no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
