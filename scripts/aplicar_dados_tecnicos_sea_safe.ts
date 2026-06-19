import { PrismaClient } from '@prisma/client';
import { findRaftTechnicalModel } from '../src/modules/rafts/raftModelData';
import { normalizarPackType } from '../src/config/packTemplates';
import { BELLOWS_STOCK_REFERENCE, DRINKING_WATER_STOCK_REFERENCE, FOOD_RATIONS_STOCK_REFERENCE } from '../src/lib/stock-reference-rules';

const prisma = new PrismaClient();

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

function sameText(a?: string | null, b?: string | null) {
  return norm(a) === norm(b);
}

function inferSeaSafeModel(row: {
  model?: string | null;
  serial?: string | null;
  cylinderSistema?: string | null;
}) {
  const model = norm(row.model);
  const serial = norm(row.serial);
  const system = norm(row.cylinderSistema);

  const thannerLike =
    model.includes('PLF') ||
    model.includes('PL F') ||
    serial.includes(' F') ||
    serial.includes('-F') ||
    system.includes('THANNER');

  if (model.startsWith('PL SR F')) return 'PL-SR-F';
  if (model.startsWith('PL C F')) return 'PL-C-F';
  if (model.startsWith('PL F') || model.startsWith('PLF')) return 'PL-F';
  if (model.startsWith('PL SR')) return thannerLike ? 'PL-SR-F' : 'PL-SR';
  if (model.startsWith('PL C')) return thannerLike ? 'PL-C-F' : 'PL-C';
  if (model.startsWith('PL') || model.startsWith('KI')) return thannerLike ? 'PL-F' : 'PL';

  return thannerLike ? 'PL-F' : 'PL';
}

type DesiredArticle = {
  name: string;
  quantidade: number;
  referencia?: string;
  codigoFabricante?: string;
};

const ARTICLE_MAP: Array<{ match: string[]; article: DesiredArticle }> = [
  { match: ['PARACHUTE ROCKETS'], article: { name: 'Paraquedas', quantidade: 2, referencia: '20500023' } },
  { match: ['RED HAND FLARES', 'HAND FLARES'], article: { name: 'Fachos de Mão', quantidade: 3, referencia: '20500035' } },
  { match: ['FLOATING SMOKE SIGNALS'], article: { name: 'Potes', quantidade: 2, referencia: '20500002' } },
  { match: ['SEASICKNESS TABLETS'], article: { name: 'comprimidos', quantidade: 1, referencia: '30202051' } },
  { match: ['FOOD RATIONS'], article: { name: 'ração', quantidade: 1, referencia: FOOD_RATIONS_STOCK_REFERENCE } },
  { match: ['DRINKING WATER'], article: { name: 'Água', quantidade: 1, referencia: DRINKING_WATER_STOCK_REFERENCE } },
  { match: ['FIRST AID KIT'], article: { name: 'Farmacia Solas', quantidade: 1, referencia: '30202207' } },
  { match: ['TOP LIGHT AND BATTERY'], article: { name: 'Top Light and Battery', quantidade: 1 } },
  { match: ['INSIDE LIGHT AND BATTERY'], article: { name: 'Inside Light and Battery', quantidade: 1 } },
  { match: ['WATERPROOF TORCH'], article: { name: 'Waterproof Torch', quantidade: 1 } },
  { match: ['TORCH BATTERIES', 'BATTERIES FOR TORCH'], article: { name: 'Torch Batteries', quantidade: 4, referencia: '20903168' } },
  { match: ['SIGNAL MIRROR', 'HELIOGRAPH'], article: { name: 'Signal Mirror / Heliograph', quantidade: 1 } },
  { match: ['WHISTLE'], article: { name: 'Whistle', quantidade: 1 } },
  { match: ['REPAIR KIT'], article: { name: 'Repair Kit', quantidade: 1 } },
  { match: ['BAILER'], article: { name: 'Bailer', quantidade: 1 } },
  { match: ['PUMP / BELLOWS', 'BELLOWS', 'FOLE'], article: { name: 'Bellows', quantidade: 1, referencia: BELLOWS_STOCK_REFERENCE } },
  { match: ['SPONGE'], article: { name: 'Sponge', quantidade: 1 } },
  { match: ['KNIFE'], article: { name: 'Knife', quantidade: 1 } },
  { match: ['SEA ANCHOR'], article: { name: 'Sea Anchor', quantidade: 1 } },
  { match: ['PADDLES'], article: { name: 'Paddles', quantidade: 1 } },
  { match: ['SURVIVAL INSTRUCTIONS'], article: { name: 'Survival Instructions', quantidade: 1 } },
  { match: ['SEA SAFE GRAB BAG', 'SEA-SAFE GRAB BAG'], article: { name: 'SEA-SAFE Grab Bag', quantidade: 1 } },
  { match: ['THERMAL PROTECTIVE AID'], article: { name: 'Thermal Protective Aid', quantidade: 1 } },
  { match: ['DRINKING CUPS'], article: { name: 'Drinking Cups', quantidade: 1 } },
  { match: ['SEA SICK BAGS', 'SEA SICK BAGS'], article: { name: 'Sea Sick Bags', quantidade: 1 } },
  { match: ['FISHING KIT'], article: { name: 'Fishing Kit', quantidade: 1 } },
  { match: ['RESCUE QUOIT', 'RESCUE BUOY'], article: { name: 'Rescue Quoit / Rescue Buoy', quantidade: 1 } },
];

function mapTechnicalItemToArticle(name: string): DesiredArticle {
  const normalized = norm(name);
  const found = ARTICLE_MAP.find((entry) => entry.match.some((token) => normalized.includes(norm(token))));
  if (found) return found.article;
  return { name, quantidade: 1 };
}

function buildDesiredArticles(packEquipment: Array<{ items: Array<{ name: string }> }> | undefined, normalizedPack: string | null) {
  const pack = (packEquipment || []).find((entry: any) => sameText(entry.pack, normalizedPack || ''));
  const base = (pack?.items || []).map((item: any) => mapTechnicalItemToArticle(item.name));

  base.push(
    { name: 'Painter Line (Retenida) - renovação obrigatória', quantidade: 1, referencia: 'PAINTER-GERAL' },
    { name: 'Cintas de Fecho Contentor (renovação obrigatória)', quantidade: 1, referencia: 'STRAP-GERAL-1' },
  );

  const deduped = new Map<string, DesiredArticle>();
  for (const item of base) {
    const key = item.referencia ? `ref:${item.referencia}` : `name:${compact(item.name)}`;
    if (!deduped.has(key)) deduped.set(key, item);
  }
  return Array.from(deduped.values());
}

function findTechnicalSpec(
  technical: NonNullable<ReturnType<typeof findRaftTechnicalModel>>,
  capacity: number | null,
  normalizedPack: string | null,
) {
  if (!capacity) return null;
  return technical.specifications.find((spec) => spec.capacity === capacity && (!spec.pack || sameText(spec.pack, normalizedPack || '')))
    || technical.specifications.find((spec) => spec.capacity === capacity)
    || null;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');

  console.log('\n🌊 APLICAR DADOS TÉCNICOS ÀS JANGADAS SEA-SAFE\n');
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'}`);

  const rows = await prisma.jangada.findMany({
    where: {
      OR: [
        { brand: { equals: 'SEA-SAFE', mode: 'insensitive' } },
        { brand: { equals: 'SEASAFE', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      serial: true,
      brand: true,
      model: true,
      capacity: true,
      packType: true,
      cylinderCo2: true,
      cylinderN2: true,
      cylinderSistema: true,
      cylinderCabecaDisparoRef: true,
      cylinderCabecaDisparoDescricao: true,
      cylinderTuboCamaraSuperiorRef: true,
      cylinderTuboCamaraSuperiorDescricao: true,
      cylinderTuboCamaraInferiorRef: true,
      cylinderTuboCamaraInferiorDescricao: true,
      cylinderAcessoriosCamaraSuperiorJson: true,
      cylinderAcessoriosCamaraInferiorJson: true,
      valvulasAlivio: true,
      valvulasAtestar: true,
      hruReferencia: true,
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

  for (const row of rows) {
    const inferredModel = inferSeaSafeModel(row);
    const technical = findRaftTechnicalModel('SEA-SAFE', inferredModel);
    if (!technical) {
      console.log(`⚠️ Sem modelo técnico para ${row.serial} (${row.model})`);
      continue;
    }

    const normalizedPack = normalizarPackType(String(row.packType || ''));
    const inflationSystem = technical.inflationSystem?.[0] || undefined;
    const usesThanner = norm(inflationSystem).includes('THANNER');
    const technicalSpec = findTechnicalSpec(technical, Number(row.capacity || 0), normalizedPack);

    const updateData: Record<string, string> = {};

    if (!sameText(row.brand, 'SEA-SAFE')) updateData.brand = 'SEA-SAFE';
    if (normalizedPack && !sameText(row.packType, normalizedPack)) updateData.packType = normalizedPack;
    if (!row.cylinderCo2 && technicalSpec?.cylinder?.co2 !== undefined) updateData.cylinderCo2 = String(technicalSpec.cylinder.co2);
    if (!row.cylinderN2 && technicalSpec?.cylinder?.n2 !== undefined) updateData.cylinderN2 = String(technicalSpec.cylinder.n2);
    if (!row.cylinderSistema && inflationSystem) updateData.cylinderSistema = usesThanner ? 'THANNER' : 'NSS';
    if (!row.cylinderCabecaDisparoRef && technical.head) updateData.cylinderCabecaDisparoRef = technical.head;
    if (!row.cylinderCabecaDisparoDescricao && technical.head) updateData.cylinderCabecaDisparoDescricao = technical.head;
    if (!row.cylinderTuboCamaraSuperiorDescricao) updateData.cylinderTuboCamaraSuperiorDescricao = usesThanner ? 'Banjo / Hose Fitting' : 'Hose';
    if (!row.cylinderTuboCamaraInferiorDescricao) updateData.cylinderTuboCamaraInferiorDescricao = usesThanner ? 'Banjo / Hose Fitting' : 'Hose';
    if (usesThanner && !row.cylinderTuboCamaraSuperiorRef) updateData.cylinderTuboCamaraSuperiorRef = '60-118';
    if (usesThanner && !row.cylinderTuboCamaraInferiorRef) updateData.cylinderTuboCamaraInferiorRef = '60-118';
    if (!row.valvulasAlivio) updateData.valvulasAlivio = usesThanner ? 'Inlet Valve Assembly incl. O-ring' : 'Safety / Relief Valve';
    if (!row.valvulasAtestar) updateData.valvulasAtestar = usesThanner ? '3/8 BSP Fitting incl. O-ring' : 'Inflate / Deflate Valve';
    if (!row.tuboIdentificacao) updateData.tuboIdentificacao = 'Identification Card / Tube';
    if (!row.cylinderAcessoriosCamaraSuperiorJson && usesThanner) {
      updateData.cylinderAcessoriosCamaraSuperiorJson = JSON.stringify([
        { referencia: 'THANNER-WASHER', descricao: 'Washer' },
        { referencia: 'THANNER-ORING', descricao: 'O-ring' },
        { referencia: 'THANNER-NYLON-NUT', descricao: 'Nylon Nut' },
      ]);
    }
    if (!row.cylinderAcessoriosCamaraInferiorJson && usesThanner) {
      updateData.cylinderAcessoriosCamaraInferiorJson = JSON.stringify([
        { referencia: 'THANNER-WASHER', descricao: 'Washer' },
        { referencia: 'THANNER-ORING', descricao: 'O-ring' },
        { referencia: 'THANNER-NYLON-NUT', descricao: 'Nylon Nut' },
      ]);
    }

    if (Object.keys(updateData).length > 0) {
      updatedRows += 1;
      console.log(`🛠️ ${row.serial} -> ${technical.name} | ${Object.keys(updateData).join(', ')}`);
      if (!dryRun) {
        await prisma.jangada.update({
          where: { id: row.id },
          data: updateData,
        });
      }
    }

    const desiredArticles = buildDesiredArticles(technical.packEquipment, normalizedPack || 'COASTAL');
    const currentArticles = row.artigos || [];

    for (const article of desiredArticles) {
      const existing = currentArticles.find((item) => {
        if (article.referencia && item.referencia) return sameText(item.referencia, article.referencia);
        return sameText(item.name, article.name);
      });

      if (!existing) {
        createdArticles += 1;
        console.log(`➕ artigo ${row.serial}: ${article.name}`);
        if (!dryRun) {
          await prisma.artigoJangada.create({
            data: {
              name: article.name,
              quantidade: article.quantidade,
              referencia: article.referencia || null,
              codigoFabricante: article.codigoFabricante || null,
              jangadaId: row.id,
            },
          });
        }
        continue;
      }

      const articleUpdate: Record<string, string | number | null> = {};
      if (!existing.referencia && article.referencia) articleUpdate.referencia = article.referencia;
      if (!existing.codigoFabricante && article.codigoFabricante) articleUpdate.codigoFabricante = article.codigoFabricante;
      if ((!existing.quantidade || existing.quantidade < article.quantidade) && article.quantidade > 0) {
        articleUpdate.quantidade = article.quantidade;
      }

      if (Object.keys(articleUpdate).length > 0) {
        updatedArticles += 1;
        console.log(`♻️ artigo ${row.serial}: ${existing.name} -> ${Object.keys(articleUpdate).join(', ')}`);
        if (!dryRun) {
          await prisma.artigoJangada.update({
            where: { id: existing.id },
            data: articleUpdate,
          });
        }
      }
    }
  }

  console.log('\n============================================================');
  console.log(`📦 Jangadas SEA-SAFE analisadas: ${rows.length}`);
  console.log(`🛠️ Jangadas com campos técnicos alterados: ${updatedRows}`);
  console.log(`➕ Artigos criados: ${createdArticles}`);
  console.log(`♻️ Artigos atualizados: ${updatedArticles}`);
  console.log('============================================================\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao aplicar dados técnicos SEA-SAFE:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
