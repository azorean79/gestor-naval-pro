import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import prisma from '../src/lib/prisma';
import { normalizeNavioDisplayName, normalizeNavioNameKey } from '../src/lib/navio-name-normalization';

type NavioRow = {
  id: number;
  nome: string;
  matricula: string;
  ilha: string;
  tipoPesca: string;
  tipoNavio: string | null;
  proprietario: string | null;
  portoRegisto: string | null;
  bandeira: string | null;
  mmsi: string | null;
  imo: string | null;
  callSignal: string | null;
  hruReferencia: string | null;
  hruValidade: string | null;
  radarReflector: string | null;
  radarReflectorValidade: string | null;
  clienteId: number | null;
  serviceStationId: number | null;
  ativo: boolean;
};

type MergePlanActionable = {
  key: string;
  canonicalName: string;
  keep: NavioRow;
  duplicates: NavioRow[];
  skipped: false;
  reason: '';
};

type MergePlanSkipped = {
  key: string;
  canonicalName: string;
  keep: null;
  duplicates: NavioRow[];
  skipped: true;
  reason: string;
};

type MergePlan = MergePlanActionable | MergePlanSkipped;

type MergeRuntimeData = {
  jangadas: Array<{ id: number; shipId: number | null; shipNameManual: string }>;
  inspecoes: Array<{ id: number; navioId: number | null; navioNome: string }>;
  ordensServico: Array<{ id: number; shipId: number | null }>;
  coletes: Array<{ id: number; shipId: number | null }>;
  epirbs: Array<{ id: number; shipId: number | null }>;
  relationCounts: Map<number, number>;
};

function normalizeMatriculaKey(value?: string | null) {
  return String(value || '').replace(/\s+/g, '').toUpperCase().trim();
}

function countFilledFields(navio: NavioRow) {
  const values = [
    navio.matricula,
    navio.ilha,
    navio.tipoPesca,
    navio.tipoNavio,
    navio.proprietario,
    navio.portoRegisto,
    navio.bandeira,
    navio.mmsi,
    navio.imo,
    navio.callSignal,
    navio.hruReferencia,
    navio.hruValidade,
    navio.radarReflector,
    navio.radarReflectorValidade,
    navio.clienteId,
    navio.serviceStationId,
  ];

  return values.reduce<number>((acc, value) => {
    if (value === null || value === undefined) return acc;
    return String(value).trim() ? acc + 1 : acc;
  }, 0);
}

function pickFirstNonEmpty<T>(...values: Array<T | null | undefined>) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      if (value.trim()) return value;
      continue;
    }
    return value;
  }
  return undefined;
}

function formatField(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value.trim() || '—';
  return String(value);
}

function buildRelationCounts(data: Omit<MergeRuntimeData, 'relationCounts'>) {
  const relationCounts = new Map<number, number>();
  const bump = (navioId?: number | null) => {
    if (!navioId) return;
    relationCounts.set(navioId, (relationCounts.get(navioId) || 0) + 1);
  };

  data.jangadas.forEach((row) => bump(row.shipId));
  data.inspecoes.forEach((row) => bump(row.navioId));
  data.ordensServico.forEach((row) => bump(row.shipId));
  data.coletes.forEach((row) => bump(row.shipId));
  data.epirbs.forEach((row) => bump(row.shipId));

  return relationCounts;
}

function buildMergePlans(navios: NavioRow[], relationCounts: Map<number, number>) {
  const grouped = new Map<string, NavioRow[]>();
  for (const navio of navios) {
    const key = normalizeNavioNameKey(navio.nome);
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(navio);
  }

  return Array.from(grouped.entries())
    .map<MergePlan | null>(([key, rows]) => {
      if (rows.length < 2) return null;

      const matriculas = Array.from(new Set(rows.map((row) => normalizeMatriculaKey(row.matricula)).filter(Boolean)));
      if (matriculas.length > 1) {
        return {
          key,
          canonicalName: normalizeNavioDisplayName(rows[0]?.nome || ''),
          keep: null,
          duplicates: rows,
          skipped: true,
          reason: `Múltiplas matrículas (${matriculas.join(', ')})`,
        };
      }

      const canonicalName = rows.find((row) => row.nome === normalizeNavioDisplayName(row.nome))?.nome
        || normalizeNavioDisplayName(rows[0]?.nome || '');

      const keep = [...rows].sort((a, b) => {
        const canonicalDelta = Number(b.nome === canonicalName) - Number(a.nome === canonicalName);
        if (canonicalDelta !== 0) return canonicalDelta;

        const relationDelta = (relationCounts.get(b.id) || 0) - (relationCounts.get(a.id) || 0);
        if (relationDelta !== 0) return relationDelta;

        const filledDelta = countFilledFields(b) - countFilledFields(a);
        if (filledDelta !== 0) return filledDelta;

        return a.id - b.id;
      })[0];

      return {
        key,
        canonicalName,
        keep,
        duplicates: rows.filter((row) => row.id !== keep.id),
        skipped: false,
        reason: '',
      };
    })
    .filter((plan): plan is MergePlan => Boolean(plan));
}

function printPlanSummary(actionablePlans: MergePlanActionable[], skippedPlans: MergePlanSkipped[], totalPlans: number) {
  console.log(`\n🔎 Grupos com variantes de caixa: ${totalPlans}`);
  console.log(`✅ Grupos prontos a unir: ${actionablePlans.length}`);
  console.log(`⏭️  Grupos ignorados por ambiguidade: ${skippedPlans.length}`);

  for (const plan of actionablePlans) {
    console.log(`\n• ${plan.duplicates.map((row) => row.nome).concat(plan.keep.nome).join('  |  ')}`);
    console.log(`  → manter #${plan.keep.id} como "${plan.canonicalName}"`);
    console.log(`  → fundir IDs: ${plan.duplicates.map((row) => row.id).join(', ')}`);
  }

  for (const plan of skippedPlans) {
    console.log(`\n⚠️  Ignorado: ${plan.duplicates.map((row) => `#${row.id} ${row.nome}`).join(' | ')}`);
    console.log(`   Motivo: ${plan.reason}`);
  }
}

function printAssistPlan(plan: MergePlanSkipped, relationCounts: Map<number, number>) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`⚠️  Grupo ambíguo: ${plan.duplicates.map((row) => row.nome).join('  |  ')}`);
  console.log(`Motivo automático: ${plan.reason}`);

  for (const row of plan.duplicates) {
    console.log(`\n#${row.id} — ${row.nome}`);
    console.log(`  matrícula: ${formatField(row.matricula)} | relações: ${relationCounts.get(row.id) || 0} | ativo: ${row.ativo ? 'sim' : 'não'}`);
    console.log(`  ilha: ${formatField(row.ilha)} | tipo pesca: ${formatField(row.tipoPesca)} | tipo navio: ${formatField(row.tipoNavio)}`);
    console.log(`  proprietário: ${formatField(row.proprietario)} | porto: ${formatField(row.portoRegisto)} | bandeira: ${formatField(row.bandeira)}`);
    console.log(`  mmsi: ${formatField(row.mmsi)} | imo: ${formatField(row.imo)} | call signal: ${formatField(row.callSignal)}`);
    console.log(`  clienteId: ${formatField(row.clienteId)} | serviceStationId: ${formatField(row.serviceStationId)}`);
  }
}

function toActionablePlan(plan: MergePlanSkipped, keepId: number, canonicalName?: string): MergePlanActionable {
  const keep = plan.duplicates.find((row) => row.id === keepId);
  if (!keep) {
    throw new Error(`ID inválido para manter: ${keepId}`);
  }

  return {
    key: plan.key,
    canonicalName: normalizeNavioDisplayName(canonicalName || keep.nome),
    keep,
    duplicates: plan.duplicates.filter((row) => row.id !== keep.id),
    skipped: false,
    reason: '',
  };
}

async function applyMergePlan(plan: MergePlanActionable) {
  const duplicateIds = plan.duplicates.map((row) => row.id);
  const nameVariants = Array.from(new Set([plan.keep.nome, ...plan.duplicates.map((row) => row.nome)]));

  const mergedData = {
    nome: plan.canonicalName,
    matricula: pickFirstNonEmpty(plan.keep.matricula, ...plan.duplicates.map((row) => row.matricula)) || '',
    ilha: pickFirstNonEmpty(plan.keep.ilha, ...plan.duplicates.map((row) => row.ilha)) || '',
    tipoPesca: pickFirstNonEmpty(plan.keep.tipoPesca, ...plan.duplicates.map((row) => row.tipoPesca)) || '',
    tipoNavio: pickFirstNonEmpty(plan.keep.tipoNavio, ...plan.duplicates.map((row) => row.tipoNavio)) || null,
    proprietario: pickFirstNonEmpty(plan.keep.proprietario, ...plan.duplicates.map((row) => row.proprietario)) || null,
    portoRegisto: pickFirstNonEmpty(plan.keep.portoRegisto, ...plan.duplicates.map((row) => row.portoRegisto)) || null,
    bandeira: pickFirstNonEmpty(plan.keep.bandeira, ...plan.duplicates.map((row) => row.bandeira)) || null,
    mmsi: pickFirstNonEmpty(plan.keep.mmsi, ...plan.duplicates.map((row) => row.mmsi)) || null,
    imo: pickFirstNonEmpty(plan.keep.imo, ...plan.duplicates.map((row) => row.imo)) || null,
    callSignal: pickFirstNonEmpty(plan.keep.callSignal, ...plan.duplicates.map((row) => row.callSignal)) || null,
    hruReferencia: pickFirstNonEmpty(plan.keep.hruReferencia, ...plan.duplicates.map((row) => row.hruReferencia)) || null,
    hruValidade: pickFirstNonEmpty(plan.keep.hruValidade, ...plan.duplicates.map((row) => row.hruValidade)) || null,
    radarReflector: pickFirstNonEmpty(plan.keep.radarReflector, ...plan.duplicates.map((row) => row.radarReflector)) || null,
    radarReflectorValidade: pickFirstNonEmpty(plan.keep.radarReflectorValidade, ...plan.duplicates.map((row) => row.radarReflectorValidade)) || null,
    clienteId: pickFirstNonEmpty(plan.keep.clienteId, ...plan.duplicates.map((row) => row.clienteId)) || null,
    serviceStationId: pickFirstNonEmpty(plan.keep.serviceStationId, ...plan.duplicates.map((row) => row.serviceStationId)) || null,
    ativo: plan.keep.ativo || plan.duplicates.some((row) => row.ativo),
  };

  await prisma.$transaction(async (tx) => {
    await tx.navio.update({
      where: { id: plan.keep.id },
      data: mergedData,
    });

    await tx.jangada.updateMany({
      where: { shipId: { in: duplicateIds } },
      data: { shipId: plan.keep.id, shipNameManual: plan.canonicalName },
    });

    for (const variant of nameVariants) {
      await tx.jangada.updateMany({
        where: {
          shipNameManual: {
            equals: variant,
            mode: 'insensitive',
          },
        },
        data: { shipNameManual: plan.canonicalName },
      });

      await tx.inspecao.updateMany({
        where: {
          navioNome: {
            equals: variant,
            mode: 'insensitive',
          },
        },
        data: { navioNome: plan.canonicalName },
      });

      await tx.certificadoExtraido.updateMany({
        where: {
          shipName: {
            equals: variant,
            mode: 'insensitive',
          },
        },
        data: { shipName: plan.canonicalName },
      });
    }

    await tx.inspecao.updateMany({
      where: { navioId: { in: duplicateIds } },
      data: { navioId: plan.keep.id, navioNome: plan.canonicalName },
    });

    await tx.ordemServico.updateMany({
      where: { shipId: { in: duplicateIds } },
      data: { shipId: plan.keep.id },
    });

    await tx.colete.updateMany({
      where: { shipId: { in: duplicateIds } },
      data: { shipId: plan.keep.id },
    });

    await tx.epirb.updateMany({
      where: { shipId: { in: duplicateIds } },
      data: { shipId: plan.keep.id },
    });

    await tx.navio.deleteMany({
      where: { id: { in: duplicateIds } },
    });
  });

  console.log(`✅ Unido: ${nameVariants.join(' / ')} → ${plan.canonicalName} (mantido #${plan.keep.id})`);
}

async function runAssistMode(skippedPlans: MergePlanSkipped[], relationCounts: Map<number, number>) {
  if (skippedPlans.length === 0) {
    console.log('\nNão há grupos ambíguos para rever em modo assistido.');
    return;
  }

  const rl = createInterface({ input, output });
  let appliedCount = 0;
  let skippedCount = 0;

  try {
    console.log('\n🧭 Modo assistido — revê os grupos ambíguos e decide manualmente se devem ser unidos.');

    for (let index = 0; index < skippedPlans.length; index += 1) {
      const plan = skippedPlans[index];
      console.log(`\n[${index + 1}/${skippedPlans.length}]`);
      printAssistPlan(plan, relationCounts);

      const action = (await rl.question('Ação? [m] unir manualmente / [s] saltar / [q] sair: ')).trim().toLowerCase() || 's';

      if (action === 'q') {
        console.log('\nModo assistido terminado pelo utilizador.');
        break;
      }

      if (action !== 'm') {
        skippedCount += 1;
        continue;
      }

      const validIds = plan.duplicates.map((row) => row.id);
      let keepId: number | null = null;

      while (keepId === null) {
        const keepAnswer = (await rl.question(`ID a manter (${validIds.join(', ')}), ou Enter para cancelar: `)).trim();
        if (!keepAnswer) break;

        const parsed = Number(keepAnswer);
        if (Number.isInteger(parsed) && validIds.includes(parsed)) {
          keepId = parsed;
          break;
        }

        console.log('ID inválido.');
      }

      if (keepId === null) {
        skippedCount += 1;
        continue;
      }

      const keepRow = plan.duplicates.find((row) => row.id === keepId)!;
      const suggestedCanonicalName = normalizeNavioDisplayName(keepRow.nome);
      const canonicalNameInput = await rl.question(`Nome canónico [${suggestedCanonicalName}]: `);
      const canonicalName = normalizeNavioDisplayName(canonicalNameInput.trim() || suggestedCanonicalName);

      const confirmation = (await rl.question(`Confirmar união manual para "${canonicalName}" mantendo #${keepId}? [y/N]: `))
        .trim()
        .toLowerCase();

      if (confirmation !== 'y' && confirmation !== 'yes' && confirmation !== 's') {
        skippedCount += 1;
        continue;
      }

      const actionablePlan = toActionablePlan(plan, keepId, canonicalName);
      await applyMergePlan(actionablePlan);
      appliedCount += 1;
    }
  } finally {
    rl.close();
  }

  console.log(`\n🧾 Modo assistido concluído. Uniões aplicadas manualmente: ${appliedCount}. Grupos saltados: ${skippedCount}.`);
}

async function main() {
  const apply = process.argv.includes('--apply');
  const assist = process.argv.includes('--assist');

  const [navios, jangadas, inspecoes, ordensServico, coletes, epirbs] = await Promise.all([
    prisma.navio.findMany({
      select: {
        id: true,
        nome: true,
        matricula: true,
        ilha: true,
        tipoPesca: true,
        tipoNavio: true,
        proprietario: true,
        portoRegisto: true,
        bandeira: true,
        mmsi: true,
        imo: true,
        callSignal: true,
        hruReferencia: true,
        hruValidade: true,
        radarReflector: true,
        radarReflectorValidade: true,
        clienteId: true,
        serviceStationId: true,
        ativo: true,
      },
      orderBy: [{ nome: 'asc' }, { id: 'asc' }],
    }),
    prisma.jangada.findMany({ select: { id: true, shipId: true, shipNameManual: true } }),
    prisma.inspecao.findMany({ select: { id: true, navioId: true, navioNome: true } }),
    prisma.ordemServico.findMany({ select: { id: true, shipId: true } }),
    prisma.colete.findMany({ select: { id: true, shipId: true } }),
    prisma.epirb.findMany({ select: { id: true, shipId: true } }).catch(() => []),
  ]);

  const relationCounts = buildRelationCounts({ jangadas, inspecoes, ordensServico, coletes, epirbs });
  const mergePlans = buildMergePlans(navios, relationCounts);

  const actionablePlans = mergePlans.filter(
    (plan): plan is MergePlanActionable => !plan.skipped && plan.duplicates.length > 0,
  );
  const skippedPlans = mergePlans.filter((plan): plan is MergePlanSkipped => plan.skipped);

  printPlanSummary(actionablePlans, skippedPlans, mergePlans.length);

  if (assist) {
    await runAssistMode(skippedPlans, relationCounts);
    return;
  }

  if (!apply) {
    console.log('\nModo preview — usa --apply para efetivar as uniões automáticas ou --assist para rever os casos ambíguos.');
    return;
  }

  for (const plan of actionablePlans) {
    await applyMergePlan(plan);
  }

  console.log(`\n🎉 Concluído. Grupos unidos: ${actionablePlans.length}`);
}

main()
  .catch((error) => {
    console.error('❌ Erro ao unir navios:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });