#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { findRaftTechnicalModel } from '../src/modules/rafts/raftModelData';
import { normalizarPackType } from '../src/config/packTemplates';
import {
  BELLOWS_STOCK_REFERENCE,
  DRINKING_WATER_STOCK_REFERENCE,
  FOOD_RATIONS_STOCK_REFERENCE,
} from '../src/lib/stock-reference-rules';

const prisma = new PrismaClient();

type DesiredArticle = {
  name: string;
  quantidade: number;
  referencia?: string;
  codigoFabricante?: string;
};

function norm(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function compact(value?: string | null) {
  return norm(value).replace(/\s+/g, '');
}

function same(a?: string | null, b?: string | null) {
  return norm(a) === norm(b);
}

function mapPackToTechnicalPack(packType?: string | null, model?: string | null): string {
  const raw = norm(packType);
  const normalized = norm(normalizarPackType(String(packType || '')) || '');
  const normalizedModel = norm(model);

  if (raw.includes('SOLAS B')) return 'SOLAS B';
  if (raw.includes('SOLAS A')) return 'SOLAS A';
  if (raw.includes('OFFSHORE') || raw.includes('>24H') || raw.includes('PACK 1')) return 'OFFSHORE';
  if (raw.includes('COASTAL') || raw.includes('<24H') || raw.includes('PACK 2')) return 'COASTAL';
  if (raw.includes('ISO') || normalizedModel.includes('ISO')) return 'ISO-RAFT';

  if (normalized === 'SOLAS B') return 'SOLAS B';
  if (normalized === 'SOLAS A') return 'SOLAS A';
  if (normalized === 'OFFSHORE') return 'OFFSHORE';
  if (normalized === 'COASTAL') return 'COASTAL';

  if (normalizedModel.includes('CHARTER')) return 'COASTAL';
  if (normalizedModel.includes('SOLAS')) return 'SOLAS A';
  return 'COASTAL';
}

function inferOceanSafetyModel(row: {
  brand?: string | null;
  model?: string | null;
  packType?: string | null;
}) {
  const brand = norm(row.brand);
  const model = norm(row.model);
  const packType = norm(row.packType);

  if (brand.includes('OCEAN SAFETY') || model.includes('OCEAN')) {
    if (model.includes('CHARTER')) return 'CHARTER 2.0';
    if (model.includes('ULTRALITE')) return 'ISO ULTRALITE';
    if (model.includes('SOLAS') || packType.includes('SOLAS')) return 'SOLAS COMPACT';
    return 'ISO';
  }

  if (model.includes('CHARTER')) return 'CHARTER 2.0';
  if (model.includes('ULTRALITE')) return 'ISO ULTRALITE';
  if (model.includes('SOLAS COMPACT')) return 'SOLAS COMPACT';
  if (model.includes('OCEAN ISO') || model.includes('OS ISO')) return 'ISO';
  return 'ISO';
}

const PACK_ITEM_MAP: Array<{ tokens: string[]; article: DesiredArticle }> = [
  { tokens: ['PARACHUTE ROCKET'], article: { name: 'Paraquedas', quantidade: 2, referencia: '20500023' } },
  { tokens: ['RED HAND FLARE', 'HAND FLARE'], article: { name: 'Fachos de Mão', quantidade: 3, referencia: '20500035' } },
  { tokens: ['FLOATING SMOKE'], article: { name: 'Potes', quantidade: 2, referencia: '20500002' } },
  { tokens: ['SEASICKNESS TABLET'], article: { name: 'comprimidos', quantidade: 1, referencia: '30202051' } },
  { tokens: ['FOOD RATION'], article: { name: 'ração', quantidade: 1, referencia: FOOD_RATIONS_STOCK_REFERENCE } },
  { tokens: ['DRINKING WATER', 'WATER'], article: { name: 'Água', quantidade: 1, referencia: DRINKING_WATER_STOCK_REFERENCE } },
  { tokens: ['FIRST AID KIT'], article: { name: 'Farmacia Solas', quantidade: 1, referencia: '30202207' } },
  { tokens: ['TOP LIGHT'], article: { name: 'Top Light and Battery', quantidade: 1 } },
  { tokens: ['INSIDE LIGHT'], article: { name: 'Inside Light and Battery', quantidade: 1 } },
  { tokens: ['WATERPROOF TORCH'], article: { name: 'Waterproof Torch', quantidade: 1 } },
  { tokens: ['TORCH BATTERIES', 'BATTERIES FOR TORCH'], article: { name: 'Torch Batteries', quantidade: 4, referencia: '20903168' } },
  { tokens: ['SIGNAL MIRROR', 'HELIOGRAPH'], article: { name: 'Signal Mirror / Heliograph', quantidade: 1 } },
  { tokens: ['WHISTLE'], article: { name: 'Whistle', quantidade: 1 } },
  { tokens: ['REPAIR KIT'], article: { name: 'Repair Kit', quantidade: 1 } },
  { tokens: ['BAILER'], article: { name: 'Bailer', quantidade: 1 } },
  { tokens: ['BELLOWS', 'PUMP'], article: { name: 'Bellows', quantidade: 1, referencia: BELLOWS_STOCK_REFERENCE } },
  { tokens: ['SPONGE'], article: { name: 'Sponge', quantidade: 1 } },
  { tokens: ['KNIFE'], article: { name: 'Knife', quantidade: 1 } },
  { tokens: ['SEA ANCHOR'], article: { name: 'Sea Anchor', quantidade: 1 } },
  { tokens: ['PADDLES'], article: { name: 'Paddles', quantidade: 1 } },
  { tokens: ['SURVIVAL INSTRUCTIONS'], article: { name: 'Survival Instructions', quantidade: 1 } },
  { tokens: ['THERMAL PROTECTIVE AID'], article: { name: 'Thermal Protective Aid', quantidade: 1 } },
];

function mapPackItemToArticle(name: string): DesiredArticle {
  const normalized = norm(name);
  const found = PACK_ITEM_MAP.find((entry) => entry.tokens.some((token) => normalized.includes(norm(token))));
  if (found) return { ...found.article };
  return { name, quantidade: 1 };
}

function splitTechnicalReferences(reference?: string | null) {
  const raw = String(reference || '').trim();
  if (!raw) return [] as string[];
  return raw
    .split(/\s*\/\s*|\s*,\s*/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => /^[A-Z0-9\-]+$/i.test(part));
}

async function buildStockLookups() {
  const rows = await prisma.stock.findMany({
    select: {
      id: true,
      referencia: true,
      codigoFabricante: true,
      descricao: true,
    },
  });

  const byReferencia = new Map<string, (typeof rows)[number]>();
  const byCodigoFabricante = new Map<string, (typeof rows)[number]>();

  for (const row of rows) {
    if (row.referencia) byReferencia.set(compact(row.referencia), row);
    if (row.codigoFabricante) byCodigoFabricante.set(compact(row.codigoFabricante), row);
  }

  return { byReferencia, byCodigoFabricante };
}

function resolveByReferenceCandidate(
  refs: string[],
  lookups: Awaited<ReturnType<typeof buildStockLookups>>,
) {
  for (const ref of refs) {
    const normalized = compact(ref);
    const byCode = lookups.byCodigoFabricante.get(normalized);
    if (byCode) return byCode;

    const byRef = lookups.byReferencia.get(normalized);
    if (byRef) return byRef;
  }

  return null;
}

function serviceKitForIso(capacity: number, ultralite: boolean): DesiredArticle {
  if (ultralite) {
    return capacity <= 8
      ? { name: 'Ocean ISO Ultralite Service Kit Small 6, 8P', quantidade: 1, referencia: 'OSL8015S', codigoFabricante: 'OSL8015S' }
      : { name: 'Ocean ISO Ultralite Service Kit Large 10, 12P', quantidade: 1, referencia: 'OSL8015L', codigoFabricante: 'OSL8015L' };
  }

  return capacity <= 8
    ? { name: 'Ocean ISO Service Kit Small 4, 6, 8P', quantidade: 1, referencia: 'OSL8010S', codigoFabricante: 'OSL8010S' }
    : { name: 'Ocean ISO Service Kit Large 10, 12P', quantidade: 1, referencia: 'OSL8010S', codigoFabricante: 'OSL8010S' };
}

function buildOceanSafetyCustomArticles(row: {
  model?: string | null;
  packType?: string | null;
  capacity?: number | null;
  containerModel?: string | null;
}): DesiredArticle[] {
  const inferredModel = inferOceanSafetyModel(row);
  const technicalPack = mapPackToTechnicalPack(row.packType, row.model);
  const capacity = Number(row.capacity || 0);
  const containerModel = norm(row.containerModel);
  const items: DesiredArticle[] = [];

  if (inferredModel === 'ISO' || inferredModel === 'ISO ULTRALITE') {
    items.push(serviceKitForIso(capacity, inferredModel === 'ISO ULTRALITE'));
    items.push({ name: 'OS ISO Painter Line Assembly', quantidade: 1, referencia: 'OSL0400', codigoFabricante: 'OSL0400' });

    if (containerModel.includes('VALISE')) {
      if (capacity <= 4) {
        items.push({ name: 'OS ISO 4 Person Valise', quantidade: 1, referencia: 'OSL8100', codigoFabricante: 'OSL8100' });
      } else {
        items.push({ name: 'OS ISO 6/8 Person Valise', quantidade: 1, referencia: 'OSL8102', codigoFabricante: 'OSL8102' });
      }
    }

    if (!containerModel.includes('VALISE') && technicalPack === 'COASTAL') {
      if (capacity <= 4) {
        items.push({ name: 'OS ISO 4P <24 Mk2 Container Conversion Kit', quantidade: 1, referencia: 'OSL8192', codigoFabricante: 'OSL8192' });
      } else if (capacity <= 8) {
        items.push({ name: 'OS ISO 8P <24 Mk2 Container Conversion Kit', quantidade: 1, referencia: 'OSL8194', codigoFabricante: 'OSL8194' });
      } else {
        items.push({ name: 'OS ISO 10/12P <24 Mk2 Container Conversion Kit', quantidade: 1, referencia: 'OSL8196', codigoFabricante: 'OSL8196' });
      }
    }
  }

  if (inferredModel === 'CHARTER 2.0') {
    const isValise = containerModel.includes('VALISE');
    if (isValise) {
      items.push(capacity <= 8
        ? { name: 'Ocean Charter 2.0 Valise Service Kit, 4, 6, 8P', quantidade: 1, referencia: 'OSL1330', codigoFabricante: 'OSL1330' }
        : { name: 'Ocean Charter 2.0 Valise Service Kit, 10, 12P', quantidade: 1, referencia: 'OSL1335', codigoFabricante: 'OSL1335' });

      if (capacity <= 4) items.push({ name: 'Ocean Charter 2.0 Valise 4P Conversion Kit', quantidade: 1, referencia: 'OSL1360', codigoFabricante: 'OSL1360' });
      else if (capacity <= 8) items.push({ name: 'Ocean Charter 2.0 Valise 6,8P Conversion Kit', quantidade: 1, referencia: 'OSL1362', codigoFabricante: 'OSL1362' });
      else items.push({ name: 'Ocean Charter 2.0 Valise 10P Conversion Kit', quantidade: 1, referencia: 'OSL1364', codigoFabricante: 'OSL1364' });
    } else {
      items.push(capacity <= 8
        ? { name: 'Ocean Charter 2.0 Container Service Kit, 4, 6, 8P', quantidade: 1, referencia: 'OSL1320', codigoFabricante: 'OSL1320' }
        : { name: 'Ocean Charter 2.0 Container Service Kit, 10, 12P', quantidade: 1, referencia: 'OSL1325', codigoFabricante: 'OSL1325' });

      if (capacity <= 4) items.push({ name: 'Ocean Charter 2.0 Container 4P Conversion Kit', quantidade: 1, referencia: 'OSL1350', codigoFabricante: 'OSL1350' });
      else if (capacity <= 8) items.push({ name: 'Ocean Charter 2.0 Container 6, 8P Conversion Kit', quantidade: 1, referencia: 'OSL1352', codigoFabricante: 'OSL1352' });
      else items.push({ name: 'Ocean Charter 2.0 Container 10P Conversion Kit', quantidade: 1, referencia: 'OSL1354', codigoFabricante: 'OSL1354' });
    }

    items.push({ name: 'OS CHA Pressure Relief Valve', quantidade: 1, referencia: 'OSL1134', codigoFabricante: 'OSL1134' });
    items.push({ name: 'OS CHA Deflation & Top up Valve', quantidade: 1, referencia: 'OSL1138', codigoFabricante: 'OSL1138' });
  }

  if (inferredModel === 'SOLAS COMPACT') {
    const isUltralite = norm(row.model).includes('ULTRALITE');
    items.push(isUltralite
      ? { name: 'Ocean SOLAS Ultralite Compact Service Kit', quantidade: 1, referencia: 'OSL8215', codigoFabricante: 'OSL8215' }
      : capacity <= 8
        ? { name: 'Ocean SOLAS Compact Service Kit 6, 8 Person', quantidade: 1, referencia: 'OSL8200', codigoFabricante: 'OSL8200' }
        : { name: 'Ocean SOLAS Compact Service Kit 10, 12, 16 Person', quantidade: 1, referencia: 'OSL8210', codigoFabricante: 'OSL8210' });

    items.push(capacity <= 8
      ? { name: 'Painter Line Assembly 6 & 8 person', quantidade: 1, referencia: 'OSL8260', codigoFabricante: 'OSL8260' }
      : { name: 'Painter Line Assembly 10, 12 & 16 person', quantidade: 1, referencia: 'OSL8262', codigoFabricante: 'OSL8262' });

    if (technicalPack === 'SOLAS B') {
      items.push({ name: 'Ocean SOLAS Throw-Over Service Kit', quantidade: 1, referencia: 'OSL8220', codigoFabricante: 'OSL8220' });
    }
  }

  const dedup = new Map<string, DesiredArticle>();
  for (const item of items) {
    const key = item.referencia ? `ref:${compact(item.referencia)}` : `name:${compact(item.name)}`;
    if (!dedup.has(key)) dedup.set(key, item);
  }

  return Array.from(dedup.values());
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');

  console.log(`\n🌊 Aplicar dados técnicos Ocean Safety (${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'})\n`);

  const lookups = await buildStockLookups();

  const rafts = await prisma.jangada.findMany({
    where: {
      OR: [
        { brand: { contains: 'OCEAN SAFETY', mode: 'insensitive' } },
        { model: { contains: 'OCEAN ISO', mode: 'insensitive' } },
        { model: { contains: 'OS ISO', mode: 'insensitive' } },
        { model: { contains: 'ULTRALITE', mode: 'insensitive' } },
        { model: { contains: 'CHARTER 2.0', mode: 'insensitive' } },
        { model: { contains: 'OCEAN SOLAS', mode: 'insensitive' } },
        { model: { contains: 'SOLAS COMPACT', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      serial: true,
      brand: true,
      model: true,
      capacity: true,
      packType: true,
      containerModel: true,
      cylinderSistema: true,
      cylinderCabecaDisparoRef: true,
      cylinderCabecaDisparoDescricao: true,
      cylinderTuboCamaraSuperiorRef: true,
      cylinderTuboCamaraSuperiorDescricao: true,
      cylinderTuboCamaraInferiorRef: true,
      cylinderTuboCamaraInferiorDescricao: true,
      valvulasAlivio: true,
      valvulasAtestar: true,
      tuboIdentificacao: true,
      artigos: {
        select: {
          id: true,
          name: true,
          quantidade: true,
          referencia: true,
          codigoFabricante: true,
        },
      },
    },
    orderBy: [{ model: 'asc' }, { serial: 'asc' }],
  });

  let updatedRows = 0;
  let createdArticles = 0;
  let updatedArticles = 0;

  for (const row of rafts) {
    const inferredModel = inferOceanSafetyModel(row);
    const technical = findRaftTechnicalModel('OCEAN SAFETY', inferredModel);
    if (!technical) {
      console.log(`⚠️ Sem modelo técnico para ${row.serial} (${row.brand} / ${row.model})`);
      continue;
    }

    const technicalPack = mapPackToTechnicalPack(row.packType, row.model);
    const selectedPack = (technical.packEquipment || []).find((entry) => same(entry.pack, technicalPack))
      || (technical.packEquipment || [])[0]
      || null;

    const updateData: Record<string, string> = {};
    if (!same(row.brand, 'OCEAN SAFETY')) updateData.brand = 'OCEAN SAFETY';
    if (technicalPack && !same(row.packType, technicalPack)) updateData.packType = technicalPack;
    if (!row.cylinderSistema && technical.inflationSystem?.[0]) updateData.cylinderSistema = technical.inflationSystem[0];
    if (!row.cylinderCabecaDisparoRef && technical.head) updateData.cylinderCabecaDisparoRef = technical.head;
    if (!row.cylinderCabecaDisparoDescricao && technical.head) updateData.cylinderCabecaDisparoDescricao = technical.head;
    if (!row.cylinderTuboCamaraSuperiorDescricao) updateData.cylinderTuboCamaraSuperiorDescricao = inferredModel === 'CHARTER 2.0' ? 'Charter inflation hose' : 'HP Hose / GIS Hose';
    if (!row.cylinderTuboCamaraInferiorDescricao) updateData.cylinderTuboCamaraInferiorDescricao = inferredModel === 'CHARTER 2.0' ? 'Charter inflation hose' : 'HP Hose / GIS Hose';
    if (!row.cylinderTuboCamaraSuperiorRef && inferredModel !== 'CHARTER 2.0') updateData.cylinderTuboCamaraSuperiorRef = 'OSL0130';
    if (!row.cylinderTuboCamaraInferiorRef && inferredModel !== 'CHARTER 2.0') updateData.cylinderTuboCamaraInferiorRef = 'OSL0135';
    if (!row.valvulasAlivio) updateData.valvulasAlivio = inferredModel === 'CHARTER 2.0' ? 'OS CHA Pressure Relief Valve' : 'B10 Pressure Relief Valve';
    if (!row.valvulasAtestar) updateData.valvulasAtestar = inferredModel === 'CHARTER 2.0' ? 'OS CHA Deflation & Top up Valve' : 'OS ISO Airflow Top Up Valve';
    if (!row.tuboIdentificacao) updateData.tuboIdentificacao = 'Identification Card / Tube';

    if (Object.keys(updateData).length > 0) {
      updatedRows += 1;
      console.log(`🛠️ ${row.serial} -> ${inferredModel} | ${Object.keys(updateData).join(', ')}`);
      if (!dryRun) {
        await prisma.jangada.update({
          where: { id: row.id },
          data: updateData,
        });
      }
    }

    const desired: DesiredArticle[] = [];
    for (const item of selectedPack?.items || []) {
      desired.push(mapPackItemToArticle(item.name));
    }

    for (const item of [...(technical.serviceItems || []), ...(technical.spareParts || [])]) {
      const refs = splitTechnicalReferences(item.reference);
      const stockMatch = resolveByReferenceCandidate(refs, lookups);
      desired.push({
        name: item.name,
        quantidade: 1,
        referencia: stockMatch?.referencia || refs[0],
        codigoFabricante: stockMatch?.codigoFabricante || refs[0],
      });
    }

    desired.push(...buildOceanSafetyCustomArticles(row));

    const dedup = new Map<string, DesiredArticle>();
    for (const item of desired) {
      const key = item.referencia ? `ref:${compact(item.referencia)}` : `name:${compact(item.name)}`;
      if (!dedup.has(key)) dedup.set(key, item);
    }

    for (const item of dedup.values()) {
      const existing = row.artigos.find((article) => {
        if (item.referencia && article.referencia) return same(item.referencia, article.referencia);
        return same(item.name, article.name);
      });

      if (!existing) {
        createdArticles += 1;
        console.log(`➕ artigo ${row.serial}: ${item.name}${item.referencia ? ` (${item.referencia})` : ''}`);
        if (!dryRun) {
          await prisma.artigoJangada.create({
            data: {
              jangadaId: row.id,
              name: item.name,
              quantidade: item.quantidade,
              referencia: item.referencia || null,
              codigoFabricante: item.codigoFabricante || null,
            },
          });
        }
        continue;
      }

      const patch: { quantidade?: number; referencia?: string | null; codigoFabricante?: string | null } = {};
      if ((!existing.quantidade || existing.quantidade < item.quantidade) && item.quantidade > 0) patch.quantidade = item.quantidade;
      if (!existing.referencia && item.referencia) patch.referencia = item.referencia;
      if (!existing.codigoFabricante && item.codigoFabricante) patch.codigoFabricante = item.codigoFabricante;

      if (Object.keys(patch).length > 0) {
        updatedArticles += 1;
        console.log(`♻️ artigo ${row.serial}: ${existing.name} -> ${Object.keys(patch).join(', ')}`);
        if (!dryRun) {
          await prisma.artigoJangada.update({ where: { id: existing.id }, data: patch });
        }
      }
    }
  }

  console.log('\n============================================================');
  console.log(`📦 Jangadas Ocean Safety analisadas: ${rafts.length}`);
  console.log(`🛠️ Jangadas com campos técnicos alterados: ${updatedRows}`);
  console.log(`➕ Artigos criados: ${createdArticles}`);
  console.log(`♻️ Artigos atualizados: ${updatedArticles}`);
  console.log('============================================================\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao aplicar dados técnicos Ocean Safety:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
