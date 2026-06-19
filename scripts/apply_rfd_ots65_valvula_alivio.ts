#!/usr/bin/env tsx
/**
 * Normaliza a válvula de alívio das jangadas RFD / DSB / Survitec afetadas pelo SB OTS-65.
 *
 * Padrão operacional inspirado em `apply_eurovinil_valvula_alivio.ts`:
 * - atualiza a ficha da jangada existente
 * - usa critérios conservadores para não marcar jangadas Leafield/GIST por engano
 * - preenche também `cylinderSistema = THANNER` quando necessário para suportar
 *   a deteção automática do boletim SB 10-2013 Ver.2
 * - usa a referência de substituição escolhida operacionalmente: 00811410 (YELLOW 2.8)
 */

import { PrismaClient } from '@prisma/client';
import { findRaftTechnicalModel } from '../src/modules/rafts/raftModelData';

const prisma = new PrismaClient();

const REPLACEMENT_PRV_REF = '00811410';
const THANNER_SYSTEM = 'THANNER';
const AFFECTED_MODEL_TOKENS = ['LR97', 'LR 97', 'DSL', 'KOPAS', 'HADAG', 'SELANTIC', 'CAT', 'MINI'];

function norm(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function contains(haystack: string | null | undefined, needle: string) {
  return norm(haystack).includes(norm(needle));
}

function isThannerLike(value?: string | null) {
  const normalized = norm(value);
  return normalized.includes('THANNER') || normalized.includes('TANNER');
}

function isOts65Like(value?: string | null) {
  const normalized = norm(value);
  return (
    normalized.includes('OTS65') ||
    normalized.includes('OTS 65') ||
    normalized.includes('08152009') ||
    normalized.includes('VAL THAN OTS65') ||
    normalized.includes('00811410') ||
    normalized.includes('YELLOW 2 8') ||
    normalized.includes('00811400') ||
    normalized.includes('RED 3 5')
  );
}

function isSeasavaPlusLegacy(serial?: string | null) {
  const compact = String(serial || '').replace(/\s+/g, '').toUpperCase();
  return compact.startsWith('41') || compact.startsWith('4');
}

function getTechnicalModelMatchInfo(brand?: string | null, model?: string | null) {
  const technical = findRaftTechnicalModel(brand, model);
  if (!technical) {
    return {
      technical: null,
      usesOts65: false,
      hasMixedInflationSystems: false,
    };
  }

  const normalizedSystems = Array.from(new Set((technical.inflationSystem || []).map((entry) => norm(entry))));
  const hasMixedInflationSystems = normalizedSystems.length > 1;

  const usesOts65 =
    (technical.valves || []).some((entry) => isOts65Like(entry)) ||
    (technical.serviceItems || []).some(
      (item) => isOts65Like(item.name) || isOts65Like(item.reference) || isOts65Like(item.notes)
    );

  return {
    technical,
    usesOts65,
    hasMixedInflationSystems,
  };
}

function inferAffectedReason(row: {
  brand: string | null;
  model: string | null;
  serial: string | null;
  cylinderSistema: string | null;
  valvulasAlivio: string | null;
}) {
  const brand = norm(row.brand);
  const model = norm(row.model);
  const explicitThannerEvidence = isThannerLike(row.cylinderSistema) || isOts65Like(row.valvulasAlivio);
  const technicalInfo = getTechnicalModelMatchInfo(row.brand, row.model);

  if (isOts65Like(row.valvulasAlivio)) {
    return 'válvula OTS65 já identificada na ficha';
  }

  if (model.includes('SEASAVA PLUS') && isSeasavaPlusLegacy(row.serial)) {
    return 'SEASAVA PLUS com serial legado Thanner';
  }

  if (model.includes('SEASAVA PLUS')) {
    if (explicitThannerEvidence) {
      return 'SEASAVA PLUS com evidência explícita de sistema THANNER/OTS65';
    }
    return null;
  }

  if (model.includes('SURVIVA MKIII')) {
    return 'SURVIVA MKIII (manual/catalogação indica OTS65 no sistema THANNER)';
  }

  if (technicalInfo.usesOts65 && (!technicalInfo.hasMixedInflationSystems || explicitThannerEvidence)) {
    return 'modelo técnico catalogado com OTS65';
  }

  const affectedByBulletinFamily = AFFECTED_MODEL_TOKENS.some((token) => model.includes(norm(token)));
  if (affectedByBulletinFamily && (isThannerLike(row.cylinderSistema) || brand === 'DSB')) {
    return 'família LR97/DSL/KOPAS/CAT/MINI com sistema THANNER';
  }

  if ((brand === 'RFD' || brand === 'SURVITEC' || brand === 'DSB') && isThannerLike(row.cylinderSistema) && model.includes('MKIII')) {
    return 'marca/família compatível com THANNER + MKIII';
  }

  return null;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');

  console.log(`🧷 Aplicar PRV 00811410 (YELLOW 2.8) nas jangadas RFD/DSB/Survitec (${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'})`);

  const rows = await prisma.jangada.findMany({
    where: {
      OR: [
        { brand: { contains: 'RFD', mode: 'insensitive' } },
        { brand: { contains: 'DSB', mode: 'insensitive' } },
        { brand: { contains: 'SURVITEC', mode: 'insensitive' } },
        { model: { contains: 'MKIII', mode: 'insensitive' } },
        { model: { contains: 'SEASAVA PLUS', mode: 'insensitive' } },
        { model: { contains: 'LR97', mode: 'insensitive' } },
        { model: { contains: 'DSL', mode: 'insensitive' } },
        { model: { contains: 'KOPAS', mode: 'insensitive' } },
        { model: { contains: 'HADAG', mode: 'insensitive' } },
        { model: { contains: 'SELANTIC', mode: 'insensitive' } },
        { model: { contains: 'MINI', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      serial: true,
      brand: true,
      model: true,
      cylinderSistema: true,
      valvulasAlivio: true,
    },
    orderBy: [{ brand: 'asc' }, { model: 'asc' }, { serial: 'asc' }],
  });

  let changed = 0;
  let already = 0;
  let skipped = 0;

  for (const row of rows) {
    const reason = inferAffectedReason(row);
    if (!reason) {
      skipped += 1;
      continue;
    }

    const patch: { cylinderSistema?: string; valvulasAlivio?: string } = {};

    if (!isThannerLike(row.cylinderSistema)) {
      patch.cylinderSistema = THANNER_SYSTEM;
    }

    if (norm(row.valvulasAlivio) !== norm(REPLACEMENT_PRV_REF)) {
      patch.valvulasAlivio = REPLACEMENT_PRV_REF;
    }

    if (Object.keys(patch).length === 0) {
      already += 1;
      continue;
    }

    changed += 1;
    console.log(
      `↻ [${row.serial || row.id}] ${row.brand || '—'} / ${row.model || '—'} :: ${reason} -> ${JSON.stringify(patch)}`
    );

    if (!dryRun) {
      await prisma.jangada.update({
        where: { id: row.id },
        data: patch,
      });
    }
  }

  console.log('\n✅ Concluído');
  console.log(`   Jangadas analisadas: ${rows.length}`);
  console.log(`   Atualizadas: ${changed}`);
  console.log(`   Já corretas: ${already}`);
  console.log(`   Ignoradas por falta de segurança: ${skipped}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao aplicar OTS-65 nas jangadas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
