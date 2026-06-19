#!/usr/bin/env tsx
/**
 * Associa artigos Eurovinil às jangadas existentes.
 * - Resolve modelo técnico via findRaftTechnicalModel
 * - Escolhe packEquipment pelo pack da jangada
 * - Preenche referencias/codigoFabricante a partir do stock
 */

import { PrismaClient } from '@prisma/client';
import { findRaftTechnicalModel } from '../src/modules/rafts/raftModelData';
import { normalizarPackType } from '../src/config/packTemplates';
import { BELLOWS_STOCK_REFERENCE, DRINKING_WATER_STOCK_REFERENCE } from '../src/lib/stock-reference-rules';

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

  if (raw.includes('ISO 9650 2') || raw.includes('TYPE2')) return 'ISO 9650-2';
  if (raw.includes('SOLAS B') || raw.includes('B PACK')) return 'SOLAS B';
  if (raw.includes('OFFSHORE') || raw.includes('>24H') || raw.includes('PACK 1')) return 'OFFSHORE';
  if (raw.includes('COASTAL') || raw.includes('<24H') || raw.includes('PACK 2')) return 'COASTAL';

  if (normalized === 'SOLAS B') return 'SOLAS B';
  if (normalized === 'OFFSHORE') return 'OFFSHORE';
  if (normalized === 'COASTAL') return 'COASTAL';

  return raw || normalized || '';
}

function resolveEurovinilTechnicalModel(brand?: string | null, model?: string | null) {
  const direct = findRaftTechnicalModel(brand, model);
  if (direct) return direct;

  const m = norm(model);

  if (m.includes('SOS')) {
    return null;
  }

  if (m.includes('SOLAS') || m.includes('B PACK')) {
    return findRaftTechnicalModel('EUROVINIL', 'SYNTESY SOLAS-B PACK');
  }

  if (m.includes('TYPE2') || m.includes('9650 2')) {
    return findRaftTechnicalModel('EUROVINIL', 'SYNTESY ISO 9650-2 MK2');
  }

  // Fallback operativo para modelos legados/curtos: STD, CE TO, COASTAL DRY, COMPACTDRY+, EUROVINIL
  return findRaftTechnicalModel('EUROVINIL', 'SYNTESY ISO 9650-1 MK2');
}

const PACK_ITEM_MAP: Array<{ tokens: string[]; artigo: DesiredArticle }> = [
  { tokens: ['PARACHUTE ROCKET'], artigo: { name: 'Paraquedas', quantidade: 2, referencia: '20500023' } },
  { tokens: ['RED HAND FLARE', 'HANDFLARE', 'HAND FLARE'], artigo: { name: 'Fachos de Mão', quantidade: 3, referencia: '20500035' } },
  { tokens: ['FLOATING SMOKE'], artigo: { name: 'Potes', quantidade: 2, referencia: '20500002' } },
  { tokens: ['SEASICKNESS TABLET'], artigo: { name: 'comprimidos', quantidade: 1, referencia: '30202051' } },
  { tokens: ['FOOD RATION'], artigo: { name: 'ração', quantidade: 1, referencia: '30202084' } },
  { tokens: ['DRINKING WATER', 'WATER'], artigo: { name: 'Água', quantidade: 1, referencia: DRINKING_WATER_STOCK_REFERENCE } },
  { tokens: ['FIRST AID KIT'], artigo: { name: 'Farmacia Solas', quantidade: 1, referencia: '30202207' } },
  { tokens: ['TOP LIGHT'], artigo: { name: 'Top Light and Battery', quantidade: 1 } },
  { tokens: ['INSIDE LIGHT'], artigo: { name: 'Inside Light and Battery', quantidade: 1 } },
  { tokens: ['WATERPROOF TORCH'], artigo: { name: 'Waterproof Torch', quantidade: 1 } },
  { tokens: ['TORCH BATTERIES', 'BATTERIES FOR TORCH'], artigo: { name: 'Torch Batteries', quantidade: 4, referencia: '20903168' } },
  { tokens: ['SIGNAL MIRROR', 'HELIOGRAPH'], artigo: { name: 'Signal Mirror / Heliograph', quantidade: 1 } },
  { tokens: ['WHISTLE'], artigo: { name: 'Whistle', quantidade: 1 } },
  { tokens: ['REPAIR KIT'], artigo: { name: 'Repair Kit', quantidade: 1 } },
  { tokens: ['BAILER'], artigo: { name: 'Bailer', quantidade: 1 } },
  { tokens: ['PUMP', 'BELLOWS'], artigo: { name: 'Bellows', quantidade: 1, referencia: BELLOWS_STOCK_REFERENCE } },
  { tokens: ['SPONGE'], artigo: { name: 'Sponge', quantidade: 1 } },
  { tokens: ['KNIFE'], artigo: { name: 'Knife', quantidade: 1 } },
  { tokens: ['SEA ANCHOR'], artigo: { name: 'Sea Anchor', quantidade: 1 } },
  { tokens: ['PADDLES'], artigo: { name: 'Paddles', quantidade: 1 } },
  { tokens: ['SURVIVAL INSTRUCTIONS'], artigo: { name: 'Survival Instructions', quantidade: 1 } },
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
  const byDescricao = new Map<string, (typeof rows)[number]>();

  for (const row of rows) {
    if (row.referencia) byReferencia.set(compact(row.referencia), row);
    if (row.codigoFabricante) byCodigoFabricante.set(compact(row.codigoFabricante), row);
    if (row.descricao) byDescricao.set(compact(row.descricao), row);
  }

  return { byReferencia, byCodigoFabricante, byDescricao };
}

function resolveByReferenceCandidate(
  refs: string[],
  lookups: Awaited<ReturnType<typeof buildStockLookups>>,
) {
  for (const ref of refs) {
    const c = compact(ref);
    const fromCodFab = lookups.byCodigoFabricante.get(c);
    if (fromCodFab) return fromCodFab;

    const evRef = compact(`EV-${ref}`);
    const fromRef = lookups.byReferencia.get(evRef) || lookups.byReferencia.get(c);
    if (fromRef) return fromRef;
  }
  return null;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');

  console.log(`\n🛟 Aplicar artigos Eurovinil às jangadas (${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'})\n`);

  const lookups = await buildStockLookups();

  const rafts = await prisma.jangada.findMany({
    where: {
      OR: [
        { brand: { contains: 'EUROVINIL', mode: 'insensitive' } },
        { model: { contains: 'SYNTESY', mode: 'insensitive' } },
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
    const technical = resolveEurovinilTechnicalModel(raft.brand, raft.model);
    if (!technical) {
      console.log(`⚠️ Sem modelo técnico para ${raft.serial} (${raft.brand} / ${raft.model})`);
      continue;
    }

    const techPack = mapPackToTechnicalPack(raft.packType);

    const selectedPack = (technical.packEquipment || []).find((p) => same(p.pack, techPack))
      || (technical.packEquipment || []).find((p) => same(p.pack, 'ISO 9650-2') && techPack.includes('ISO96502'))
      || (technical.packEquipment || [])[0]
      || null;

    const desired: DesiredArticle[] = [];

    // Pack obrigatório
    for (const item of selectedPack?.items || []) {
      desired.push(mapPackItemToArticle(item.name));
    }

    // Componentes técnicos de serviço + sobressalentes
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

    // dedupe por referência (quando existir) ou nome
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
  console.log(`Jangadas EUROVINIL analisadas: ${rafts.length}`);
  console.log(`Jangadas com alterações: ${raftsTouched}`);
  console.log(`Artigos criados: ${created}`);
  console.log(`Artigos atualizados: ${updated}`);
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao aplicar artigos Eurovinil:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
