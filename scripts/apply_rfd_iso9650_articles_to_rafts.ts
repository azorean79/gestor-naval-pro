#!/usr/bin/env tsx
/**
 * Associa artigos RFD ISO 9650 às jangadas existentes.
 */

import { PrismaClient } from '@prisma/client';
import { findRaftTechnicalModel } from '../src/modules/rafts/raftModelData';
import { normalizarPackType } from '../src/config/packTemplates';
import { BELLOWS_STOCK_REFERENCE, DRINKING_WATER_STOCK_REFERENCE, FOOD_RATIONS_STOCK_REFERENCE } from '../src/lib/stock-reference-rules';

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

function mapPackToTechnicalPack(packType?: string | null): string {
  const raw = norm(packType);
  const normalized = norm(normalizarPackType(String(packType || '')) || '');

  if (raw.includes('OFFSHORE') || raw.includes('>24H') || raw.includes('PACK 1')) return 'OFFSHORE';
  if (raw.includes('COASTAL') || raw.includes('<24H') || raw.includes('PACK 2') || raw.includes('TYPE 2')) return 'COASTAL';

  if (normalized === 'OFFSHORE') return 'OFFSHORE';
  if (normalized === 'COASTAL') return 'COASTAL';

  return raw || normalized || 'COASTAL';
}

function resolveRfdTechnicalModel(brand?: string | null, model?: string | null) {
  const direct = findRaftTechnicalModel(brand, model);
  if (direct) return direct;

  const m = norm(model);

  if (m.includes('SEASAVA') || m.includes('ISO') || m.includes('TYPE 1') || m.includes('TYPE 2')) {
    return findRaftTechnicalModel('RFD', 'SEASAVA PLUS');
  }

  if (m.includes('MKIV')) return findRaftTechnicalModel('RFD', 'SURVIVA MKIV TO');
  if (m.includes('MKIII')) return findRaftTechnicalModel('RFD', 'SURVIVA MKIII');

  return findRaftTechnicalModel('RFD', 'SEASAVA PLUS');
}

const PACK_ITEM_MAP: Array<{ tokens: string[]; artigo: DesiredArticle }> = [
  { tokens: ['FLARE PARACHUTE', 'PARACHUTE'], artigo: { name: 'Paraquedas', quantidade: 2, referencia: '20500023' } },
  { tokens: ['FLARE HAND', 'HAND HELD', 'HAND FLARE'], artigo: { name: 'Fachos de Mão', quantidade: 3, referencia: '20500035' } },
  { tokens: ['SMOKE SIGNAL', 'FLOATING SMOKE'], artigo: { name: 'Potes', quantidade: 2, referencia: '20500002' } },
  { tokens: ['SEASICKNESS'], artigo: { name: 'comprimidos', quantidade: 1, referencia: '30202051' } },
  { tokens: ['FOOD RATION'], artigo: { name: 'ração', quantidade: 1, referencia: FOOD_RATIONS_STOCK_REFERENCE } },
  { tokens: ['WATER SACHET', 'DRINKING WATER', 'WATER'], artigo: { name: 'Água', quantidade: 1, referencia: DRINKING_WATER_STOCK_REFERENCE } },
  { tokens: ['FIRST AID KIT'], artigo: { name: 'Farmacia Solas', quantidade: 1, referencia: '30202207' } },
  { tokens: ['TORCH'], artigo: { name: 'Waterproof Torch', quantidade: 1 } },
  { tokens: ['TORCH BATTERIES', 'BATTERIES FOR TORCH'], artigo: { name: 'Torch Batteries', quantidade: 4, referencia: '20903168' } },
  { tokens: ['HELIOGRAPH', 'SIGNAL MIRROR'], artigo: { name: 'Signal Mirror / Heliograph', quantidade: 1 } },
  { tokens: ['WHISTLE'], artigo: { name: 'Whistle', quantidade: 1 } },
  { tokens: ['REPAIR KIT'], artigo: { name: 'Repair Kit', quantidade: 1 } },
  { tokens: ['BAILER'], artigo: { name: 'Bailer', quantidade: 1 } },
  { tokens: ['BELLOWS', 'PUMP'], artigo: { name: 'Bellows', quantidade: 1, referencia: BELLOWS_STOCK_REFERENCE } },
  { tokens: ['SEA ANCHOR'], artigo: { name: 'Sea Anchor', quantidade: 1 } },
  { tokens: ['THERMAL PROTECTION AID'], artigo: { name: 'Thermal protection aid', quantidade: 1 } },
];

function mapPackItemToArticle(name: string): DesiredArticle {
  const n = norm(name);
  const found = PACK_ITEM_MAP.find((entry) => entry.tokens.some((t) => n.includes(norm(t))));
  if (found) return { ...found.artigo };
  return { name, quantidade: 1 };
}

function splitTechnicalReferences(reference?: string | null) {
  const raw = String(reference || '').trim();
  if (!raw) return [] as string[];
  return raw
    .split(/\s*\/\s*|\s*,\s*/g)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => /^[A-Z0-9\-]+$/i.test(p));
}

async function buildStockLookups() {
  const rows = await prisma.stock.findMany({
    select: {
      id: true,
      referencia: true,
      descricao: true,
      codigoFabricante: true,
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
    const c = compact(ref);
    const fromCodFab = lookups.byCodigoFabricante.get(c);
    if (fromCodFab) return fromCodFab;

    const rfdRef = compact(`RFD-${ref}`);
    const fromRef = lookups.byReferencia.get(rfdRef) || lookups.byReferencia.get(c);
    if (fromRef) return fromRef;
  }
  return null;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');

  console.log(`\n🛟 Aplicar artigos RFD ISO 9650 às jangadas (${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'})\n`);

  const lookups = await buildStockLookups();

  const rafts = await prisma.jangada.findMany({
    where: {
      OR: [
        { brand: { contains: 'RFD', mode: 'insensitive' } },
        { model: { contains: 'SEASAVA', mode: 'insensitive' } },
        { model: { contains: 'SURVIVA', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      serial: true,
      brand: true,
      model: true,
      packType: true,
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

  let raftsTouched = 0;
  let created = 0;
  let updated = 0;

  for (const raft of rafts) {
    const technical = resolveRfdTechnicalModel(raft.brand, raft.model);
    if (!technical) {
      console.log(`⚠️ Sem modelo técnico para ${raft.serial} (${raft.brand} / ${raft.model})`);
      continue;
    }

    const techPack = mapPackToTechnicalPack(raft.packType);

    const selectedPack = (technical.packEquipment || []).find((p) => same(p.pack, techPack))
      || (technical.packEquipment || [])[0]
      || null;

    const desired: DesiredArticle[] = [];

    for (const item of selectedPack?.items || []) {
      desired.push(mapPackItemToArticle(item.name));
    }

    for (const tItem of [...(technical.serviceItems || []), ...(technical.spareParts || [])]) {
      const refs = splitTechnicalReferences(tItem.reference);
      const stockMatch = resolveByReferenceCandidate(refs, lookups);

      desired.push({
        name: tItem.name,
        quantidade: 1,
        referencia: stockMatch?.referencia || refs[0],
        codigoFabricante: stockMatch?.codigoFabricante || refs[0],
      });
    }

    const dedup = new Map<string, DesiredArticle>();
    for (const d of desired) {
      const key = d.referencia ? `ref:${compact(d.referencia)}` : `name:${compact(d.name)}`;
      if (!dedup.has(key)) dedup.set(key, d);
    }

    let raftHasChanges = false;

    for (const d of dedup.values()) {
      const existing = raft.artigos.find((a) => {
        if (d.referencia && a.referencia) return same(a.referencia, d.referencia);
        return same(a.name, d.name);
      });

      if (!existing) {
        raftHasChanges = true;
        created += 1;
        console.log(`➕ [${raft.serial}] ${d.name}${d.referencia ? ` (${d.referencia})` : ''}`);
        if (!dryRun) {
          await prisma.artigoJangada.create({
            data: {
              jangadaId: raft.id,
              name: d.name,
              quantidade: d.quantidade,
              referencia: d.referencia || null,
              codigoFabricante: d.codigoFabricante || null,
            },
          });
        }
        continue;
      }

      const patch: { quantidade?: number; referencia?: string | null; codigoFabricante?: string | null } = {};
      if ((!existing.quantidade || existing.quantidade < d.quantidade) && d.quantidade > 0) patch.quantidade = d.quantidade;
      if (!existing.referencia && d.referencia) patch.referencia = d.referencia;
      if (!existing.codigoFabricante && d.codigoFabricante) patch.codigoFabricante = d.codigoFabricante;

      if (Object.keys(patch).length > 0) {
        raftHasChanges = true;
        updated += 1;
        console.log(`♻️ [${raft.serial}] ${existing.name} -> ${Object.keys(patch).join(', ')}`);
        if (!dryRun) {
          await prisma.artigoJangada.update({ where: { id: existing.id }, data: patch });
        }
      }
    }

    if (raftHasChanges) raftsTouched += 1;
  }

  console.log('\n============================================================');
  console.log(`Jangadas RFD analisadas: ${rafts.length}`);
  console.log(`Jangadas com alterações: ${raftsTouched}`);
  console.log(`Artigos criados: ${created}`);
  console.log(`Artigos atualizados: ${updated}`);
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao aplicar artigos RFD:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
