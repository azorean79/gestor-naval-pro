import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { matchesMandatoryPack } from '../src/modules/rafts/mandatoryPack';
import { raftModelData } from '../src/modules/rafts/raftModelData';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.gestornavalpro_DATABASE_URL ??
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;
const prisma = new PrismaClient();

const EMPTY_PACK_TOKENS = new Set(['', 'N/D', 'ND', 'N A', 'N/A', 'NA', '-', '--']);

function dedupe(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

function normalizeRaftLookupValue(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function isSosLikeOperationalModel(brand?: string | null, model?: string | null) {
  const normalizedBrand = normalizeRaftLookupValue(brand);
  const normalizedModel = normalizeRaftLookupValue(model);
  return normalizedBrand.includes('SOS') || normalizedModel.includes('SOS');
}

function findStrictRaftTechnicalModel(brand?: string | null, model?: string | null) {
  const normalizedBrand = normalizeRaftLookupValue(brand);
  const normalizedModel = normalizeRaftLookupValue(model);
  if (!normalizedBrand || !normalizedModel || isSosLikeOperationalModel(brand, model)) return null;

  const brandEntry = Object.entries(raftModelData).find(([key]) => normalizeRaftLookupValue(key) === normalizedBrand);
  if (!brandEntry) return null;

  const [, models] = brandEntry;
  const exact = models.find((entry) => normalizeRaftLookupValue(entry.name) === normalizedModel);
  if (exact) return exact;

  return models.find((entry) =>
    (entry.aliases || []).some((alias) => normalizeRaftLookupValue(alias) === normalizedModel)
  ) || null;
}

function normalizeCurrentPack(value?: string | null) {
  const trimmed = String(value || '').trim();
  return EMPTY_PACK_TOKENS.has(trimmed.toUpperCase()) ? '' : trimmed;
}

type PlannedUpdate = {
  id: number;
  serial: string;
  brand: string;
  model: string;
  from: string;
  to: string;
  reason: 'alias-to-canonical-technical-pack' | 'empty-to-single-technical-pack' | 'invalid-to-single-technical-pack';
};

function planCanonicalPackUpdate(entry: { id: number; serial: string; brand: string; model: string; packType: string }) {
  const currentPack = normalizeCurrentPack(entry.packType);
  const technicalModel = findStrictRaftTechnicalModel(entry.brand, entry.model);
  const technicalPackOptions = dedupe(technicalModel?.packTypes || []);

  if (technicalPackOptions.length === 0) return null;

  const matchedTechnicalPackOption = currentPack
    ? technicalPackOptions.find((option) => matchesMandatoryPack(option, currentPack, entry.model)) || null
    : null;

  if (matchedTechnicalPackOption && matchedTechnicalPackOption !== currentPack) {
    return {
      id: entry.id,
      serial: entry.serial,
      brand: entry.brand,
      model: entry.model,
      from: currentPack,
      to: matchedTechnicalPackOption,
      reason: 'alias-to-canonical-technical-pack' as const,
    };
  }

  if (!currentPack && technicalPackOptions.length === 1) {
    return {
      id: entry.id,
      serial: entry.serial,
      brand: entry.brand,
      model: entry.model,
      from: currentPack,
      to: technicalPackOptions[0],
      reason: 'empty-to-single-technical-pack' as const,
    };
  }

  if (currentPack && !matchedTechnicalPackOption && technicalPackOptions.length === 1) {
    return {
      id: entry.id,
      serial: entry.serial,
      brand: entry.brand,
      model: entry.model,
      from: currentPack,
      to: technicalPackOptions[0],
      reason: 'invalid-to-single-technical-pack' as const,
    };
  }

  return null;
}

async function main() {
  const apply = process.argv.includes('--apply');

  console.log(`\n🛟 BACKFILL JANGADAS → PACK CANÓNICO\n`);
  console.log(`Modo: ${apply ? 'APLICAÇÃO' : 'DRY-RUN'}\n`);

  const jangadas = await prisma.jangada.findMany({
    select: {
      id: true,
      serial: true,
      brand: true,
      model: true,
      packType: true,
    },
    orderBy: [{ brand: 'asc' }, { model: 'asc' }, { serial: 'asc' }],
  });

  const plannedUpdates: PlannedUpdate[] = [];

  for (const jangada of jangadas) {
    const planned = planCanonicalPackUpdate(jangada);
    if (planned) plannedUpdates.push(planned);
  }

  const summaryByReason = plannedUpdates.reduce<Record<string, number>>((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1;
    return acc;
  }, {});

  if (!apply) {
    console.log(`Jangadas analisadas: ${jangadas.length}`);
    console.log(`Atualizações planeadas: ${plannedUpdates.length}`);
    console.log('Resumo por motivo:', summaryByReason);
    console.log('\nAmostra:');
    for (const item of plannedUpdates.slice(0, 25)) {
      console.log(`- ${item.serial} | ${item.brand} | ${item.model} | "${item.from}" → "${item.to}" [${item.reason}]`);
    }
    if (plannedUpdates.length > 25) {
      console.log(`... e mais ${plannedUpdates.length - 25} registos`);
    }
    console.log('\n⚠️  DRY-RUN — nenhum dado foi alterado.');
    console.log('   Para aplicar, corre com --apply');
    console.log('');
    return;
  }

  let updated = 0;
  for (const item of plannedUpdates) {
    await prisma.jangada.update({
      where: { id: item.id },
      data: { packType: item.to },
    });
    updated += 1;
  }

  console.log(`Jangadas analisadas: ${jangadas.length}`);
  console.log(`Atualizações aplicadas: ${updated}`);
  console.log('Resumo por motivo:', summaryByReason);
  console.log('');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
