import { PrismaClient } from '@prisma/client';
import { raftModelData } from '../src/modules/rafts/raftModelData';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type MatchResult = {
  co2?: number;
  n2?: number;
  pack?: string;
  inflationSystem?: string;
  matchedBrand: string;
  matchedModel: string;
  matchSource?: string;
  matchType: 'exact' | 'fallback-capacity' | 'model-contains';
};

type AliasRule = {
  id: string;
  whenBrandIncludes?: string[];
  whenModelIncludes?: string[];
  whenModelEquals?: string[];
  targetBrand: string;
  targetModel: string;
};

function norm(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function compact(value?: string | null) {
  return norm(value).replace(/\s+/g, '');
}

function resolveInflationSystemWithExceptions(
  serialRaw: string | undefined,
  matchedBrand: string,
  matchedModel: string,
  defaultSystem?: string
) {
  const serial = compact(serialRaw || '');
  const brand = norm(matchedBrand);
  const model = norm(matchedModel);

  // Regra de negócio: SEASAVA PLUS com serial iniciado por 4/41 usa THANNER
  if (brand === 'RFD' && model.includes('SEASAVA PLUS') && (serial.startsWith('41') || serial.startsWith('4'))) {
    return 'THANNER';
  }

  return defaultSystem;
}

function toNumString(v?: number) {
  if (v === undefined || Number.isNaN(v)) return undefined;
  return String(v);
}

function normalizePack(pack?: string) {
  if (!pack) return undefined;
  const p = norm(pack);
  if (p.includes('SOLAS')) return 'SOLAS A';
  return pack;
}

function normalizeNumberText(value?: string | null) {
  const v = (value || '').replace(',', '.').trim();
  if (!v) return '';
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return String(n);
}

function loadAliasRules(): AliasRule[] {
  const aliasPath = path.join(process.cwd(), 'scripts', 'manual_aliases_jangadas.json');
  if (!fs.existsSync(aliasPath)) return [];

  try {
    const raw = fs.readFileSync(aliasPath, 'utf8');
    const parsed = JSON.parse(raw) as { rules?: AliasRule[] };
    return Array.isArray(parsed.rules) ? parsed.rules : [];
  } catch (error) {
    console.warn('⚠️ Falha ao ler manual_aliases_jangadas.json, seguindo sem aliases:', error);
    return [];
  }
}

function resolveAlias(
  rules: AliasRule[],
  brandRaw?: string | null,
  modelRaw?: string | null
): { brand: string; model: string; aliasId?: string } {
  const brand = norm(brandRaw);
  const model = norm(modelRaw);

  for (const rule of rules) {
    const brandOk = !rule.whenBrandIncludes?.length || rule.whenBrandIncludes.some((w) => brand.includes(norm(w)));
    if (!brandOk) continue;

    const modelIncludesOk =
      !rule.whenModelIncludes?.length || rule.whenModelIncludes.some((w) => model.includes(norm(w)));
    if (!modelIncludesOk) continue;

    const modelEqualsOk = !rule.whenModelEquals?.length || rule.whenModelEquals.some((w) => model === norm(w));
    if (!modelEqualsOk) continue;

    return {
      brand: rule.targetBrand,
      model: rule.targetModel,
      aliasId: rule.id,
    };
  }

  return {
    brand: brandRaw || '',
    model: modelRaw || '',
  };
}

function findModelMatch(
  brandRaw?: string | null,
  modelRaw?: string | null,
  serialRaw?: string | null,
  capacity?: number | null,
  aliasRules: AliasRule[] = []
): MatchResult | null {
  const alias = resolveAlias(aliasRules, brandRaw, modelRaw);

  const brand = norm(alias.brand);
  const model = norm(alias.model);
  const modelCompact = compact(alias.model);
  const cap = Number(capacity || 0);

  const brandEntries = Object.entries(raftModelData);

  let selectedBrand: [string, typeof raftModelData[string]] | null = null;
  for (const [b, entries] of brandEntries) {
    if (norm(b) === brand || brand.includes(norm(b)) || norm(b).includes(brand)) {
      selectedBrand = [b, entries];
      break;
    }
  }

  if (!selectedBrand) {
    if (
      model.includes('LR07') ||
      modelCompact.includes('LR07') ||
      brand.includes('EUROVINIL') ||
      brand === 'EV'
    ) {
      selectedBrand = ['DSB', raftModelData.DSB];
    } else if (model.includes('MKIV') || model.includes('MK IV') || model.includes('SURVIVA')) {
      selectedBrand = ['RFD', raftModelData.RFD];
    }
  }

  if (!selectedBrand) {
    for (const [b, entries] of brandEntries) {
      const candidate = entries.find((e) => {
        const n = norm(e.name);
        const nCompact = compact(e.name);
        return Boolean(
          model && (
            model.includes(n) ||
            n.includes(model) ||
            modelCompact.includes(nCompact) ||
            nCompact.includes(modelCompact)
          )
        );
      });
      if (candidate) {
        selectedBrand = [b, entries];
        break;
      }
    }
  }

  if (!selectedBrand) return null;

  const [brandName, entries] = selectedBrand;

  let entry = entries.find((e) => norm(e.name) === model || compact(e.name) === modelCompact);
  let matchType: MatchResult['matchType'] = 'exact';

  if (!entry) {
    entry = entries.find((e) => {
      const n = norm(e.name);
      const nCompact = compact(e.name);
      return (
        model.includes(n) ||
        n.includes(model) ||
        modelCompact.includes(nCompact) ||
        nCompact.includes(modelCompact)
      );
    });
    if (entry) matchType = 'model-contains';
  }

  if (!entry) {
    if (model.includes('LR07') || modelCompact.includes('LR07')) {
      entry = entries.find((e) => norm(e.name) === 'LR07');
    }
    if (!entry && (model.includes('LR97') || modelCompact.includes('LR97'))) {
      entry = entries.find((e) => norm(e.name) === 'LR97');
    }
    if (!entry && (model.includes('LR05') || modelCompact.includes('LR05'))) {
      entry = entries.find((e) => norm(e.name) === 'LR05');
    }
    if (!entry && model.includes('MKIII')) entry = entries.find((e) => norm(e.name).includes('SURVIVA MKIII'));
    if (!entry && (model.includes('MKIV') || model.includes('SURVIVA'))) {
      entry = entries.find((e) => norm(e.name).includes('SURVIVA MKIV'));
    }

    if (
      !entry &&
      brand.includes('EUROVINIL') &&
      (model.includes('ISO 9650') || model.includes('STD') || model.includes('SOS'))
    ) {
      entry = entries.find((e) => norm(e.name) === 'LR07');
    }

    if (
      !entry &&
      brand.includes('ZODIAC') &&
      (model.includes('COASTAL') || model.includes('COASTER'))
    ) {
      entry = entries.find((e) => norm(e.name) === 'COASTAL');
    }

    if (entry) matchType = 'model-contains';
  }

  if (!entry || !entry.specifications || entry.specifications.length === 0) return null;

  let spec = entry.specifications.find((s) => Number(s.capacity || 0) === cap);
  if (!spec) {
    const withCaps = entry.specifications.filter((s) => Number(s.capacity || 0) > 0);
    if (withCaps.length > 0) {
      spec = withCaps.reduce((best, curr) => {
        const d1 = Math.abs(Number(best.capacity || 0) - cap);
        const d2 = Math.abs(Number(curr.capacity || 0) - cap);
        return d2 < d1 ? curr : best;
      });
      matchType = 'fallback-capacity';
    } else {
      spec = entry.specifications[0];
    }
  }

  return {
    co2: spec?.cylinder?.co2,
    n2: spec?.cylinder?.n2,
    pack: normalizePack(spec?.pack),
    inflationSystem: resolveInflationSystemWithExceptions(
      serialRaw || undefined,
      brandName,
      entry.name,
      entry.inflationSystem?.[0]
    ),
    matchedBrand: brandName,
    matchedModel: entry.name,
    matchSource: alias.aliasId,
    matchType,
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const strict = args.has('--strict');
  const aliasRules = loadAliasRules();

  console.log('\n📘 PREENCHER DETALHES TÉCNICOS DAS JANGADAS (BASE MANUAL)\n');
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'} | strict=${strict ? 'ON' : 'OFF'} | aliases=${aliasRules.length}`);

  const jangadas = await prisma.jangada.findMany({
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
    },
    orderBy: { id: 'asc' },
  });

  let atualizadas = 0;
  let semMatch = 0;
  let preenchidoCo2 = 0;
  let preenchidoN2 = 0;
  let preenchidoSistema = 0;
  let preenchidoPack = 0;
  let divergencias = 0;
  const unmatchedRows: Array<{ serial: string; brand: string; model: string; capacity: number }> = [];
  const plannedChanges: Array<{
    serial: string;
    id: number;
    match: string;
    source: string;
    changes: Record<string, { from: string; to: string }>;
  }> = [];

  for (const j of jangadas) {
    const match = findModelMatch(j.brand, j.model, j.serial, j.capacity, aliasRules);
    if (!match) {
      semMatch++;
      unmatchedRows.push({
        serial: j.serial,
        brand: j.brand || '',
        model: j.model || '',
        capacity: Number(j.capacity || 0),
      });
      continue;
    }

    const updateData: {
      cylinderCo2?: string;
      cylinderN2?: string;
      cylinderSistema?: string;
      packType?: string;
    } = {};

    const co2 = toNumString(match.co2);
    const n2 = toNumString(match.n2);

    const prevCo2 = normalizeNumberText(j.cylinderCo2);
    const prevN2 = normalizeNumberText(j.cylinderN2);
    const nextCo2 = normalizeNumberText(co2);
    const nextN2 = normalizeNumberText(n2);
    const prevSistema = (j.cylinderSistema || '').trim();
    const nextSistema = (match.inflationSystem || '').trim();
    const prevPack = (j.packType || '').trim();
    const nextPack = (match.pack || '').trim();

    const shouldWriteCo2 = Boolean(nextCo2 && (strict ? prevCo2 !== nextCo2 : !prevCo2));
    const shouldWriteN2 = Boolean(nextN2 && (strict ? prevN2 !== nextN2 : !prevN2));
    const shouldWriteSistema = Boolean(nextSistema && (strict ? prevSistema !== nextSistema : !prevSistema));
    const shouldWritePack = Boolean(nextPack && (strict ? prevPack !== nextPack : !prevPack));

    if (shouldWriteCo2 && strict && prevCo2) divergencias++;
    if (shouldWriteN2 && strict && prevN2) divergencias++;
    if (shouldWriteSistema && strict && prevSistema) divergencias++;
    if (shouldWritePack && strict && prevPack) divergencias++;

    if (shouldWriteCo2 && co2) {
      updateData.cylinderCo2 = co2;
      preenchidoCo2++;
    }

    if (shouldWriteN2 && n2) {
      updateData.cylinderN2 = n2;
      preenchidoN2++;
    }

    if (shouldWriteSistema && match.inflationSystem) {
      updateData.cylinderSistema = match.inflationSystem;
      preenchidoSistema++;
    }

    if (shouldWritePack && match.pack) {
      updateData.packType = match.pack;
      preenchidoPack++;
    }

    if (Object.keys(updateData).length > 0) {
      plannedChanges.push({
        serial: j.serial,
        id: j.id,
        match: `${match.matchedBrand}/${match.matchedModel} (${match.matchType})`,
        source: match.matchSource || 'heuristic',
        changes: {
          ...(updateData.cylinderCo2 ? { cylinderCo2: { from: j.cylinderCo2 || '', to: updateData.cylinderCo2 } } : {}),
          ...(updateData.cylinderN2 ? { cylinderN2: { from: j.cylinderN2 || '', to: updateData.cylinderN2 } } : {}),
          ...(updateData.cylinderSistema ? { cylinderSistema: { from: j.cylinderSistema || '', to: updateData.cylinderSistema } } : {}),
          ...(updateData.packType ? { packType: { from: j.packType || '', to: updateData.packType } } : {}),
        },
      });

      if (!dryRun) {
        await prisma.jangada.update({
          where: { id: j.id },
          data: updateData,
        });
      }

      atualizadas++;
    }
  }

  const apos = dryRun
    ? await prisma.jangada.aggregate({
        _count: {
          _all: true,
          cylinderCo2: true,
          cylinderN2: true,
          cylinderSistema: true,
          packType: true,
        },
      })
    : await prisma.jangada.aggregate({
        _count: {
          _all: true,
          cylinderCo2: true,
          cylinderN2: true,
          cylinderSistema: true,
          packType: true,
        },
      });

  const unmatchedByModel = new Map<string, number>();
  for (const row of unmatchedRows) {
    const key = `${row.brand} | ${row.model} | ${row.capacity}`;
    unmatchedByModel.set(key, (unmatchedByModel.get(key) || 0) + 1);
  }

  const topUnmatched = Array.from(unmatchedByModel.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([key, qty]) => ({ key, qty }));

  const outDir = path.join(process.cwd(), 'prisma', 'logs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(outDir, `jangadas_manual_unmatched_${ts}.json`);
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: jangadas.length,
        semMatch,
        topUnmatched,
        rows: unmatchedRows,
      },
      null,
      2
    ),
    'utf8'
  );

  const changesFile = path.join(outDir, `jangadas_manual_changes_${ts}.json`);
  fs.writeFileSync(
    changesFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        mode: dryRun ? 'dry-run' : 'apply',
        strict,
        totalPlannedChanges: plannedChanges.length,
        divergencias,
        sample: plannedChanges.slice(0, 200),
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('============================================================');
  console.log('✅ RESUMO');
  console.log(`📦 Jangadas analisadas: ${jangadas.length}`);
  console.log(`🛠️ Jangadas atualizadas: ${atualizadas}`);
  console.log(`⚠️ Sem correspondência de manual: ${semMatch}`);
  console.log(`\nDetalhes preenchidos:`);
  console.log(`  • CO2: ${preenchidoCo2}`);
  console.log(`  • N2: ${preenchidoN2}`);
  console.log(`  • Sistema insuflação: ${preenchidoSistema}`);
  console.log(`  • Pack type: ${preenchidoPack}`);
  console.log(`  • Divergências (strict): ${divergencias}`);
  console.log(`\nCobertura atual no banco:`);
  console.log(`  • cylinderCo2: ${apos._count.cylinderCo2}/${jangadas.length}`);
  console.log(`  • cylinderN2: ${apos._count.cylinderN2}/${jangadas.length}`);
  console.log(`  • cylinderSistema: ${apos._count.cylinderSistema}/${jangadas.length}`);
  console.log(`  • packType: ${apos._count.packType}/${jangadas.length}`);
  console.log(`\n📄 Relatório de sem-match: ${outFile}`);
  console.log(`📄 Relatório de mudanças ${dryRun ? 'planeadas' : 'aplicadas'}: ${changesFile}`);
  console.log('============================================================\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao preencher detalhes técnicos:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
