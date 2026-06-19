import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.gestornavalpro_DATABASE_URL ??
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found.');
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;

const prisma = new PrismaClient();

const APPLY = (process.env.APPLY ?? '').toLowerCase() === 'true';

const PLACEHOLDER_MATRICULAS = new Set(['', 'N/A', 'N/D', 'NA', 'ND', 'DESCONHECIDA', 'DESCONHECIDO']);
const PLACEHOLDER_ILHAS = new Set(['', 'N/A', 'N/D', 'DESCONHECIDA', 'DESCONHECIDO']);

type DispatchEntry = {
  cfr: string;
  conjIdent: string;
  nome: string;
  ilha: string;
};

type DbNavio = {
  id: number;
  nome: string;
  matricula: string;
  ilha: string;
  tipoPesca: string;
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeMatricula(value: string | null | undefined): string {
  return (value ?? '').toUpperCase().replace(/\s+/g, '').trim();
}

function inferTipoPescaFromMatricula(matricula: string): string {
  const m = normalizeMatricula(matricula);
  if (m.endsWith('-L') || m.endsWith('L')) return 'Pesca Local';
  if (m.endsWith('-C') || m.endsWith('C')) return 'Pesca Costeira';
  return 'N/D';
}

function isPlaceholderMatricula(matricula: string | null | undefined): boolean {
  const m = normalizeMatricula(matricula);
  return PLACEHOLDER_MATRICULAS.has(m);
}

function isPlaceholderIlha(ilha: string | null | undefined): boolean {
  return PLACEHOLDER_ILHAS.has(normalizeText(ilha));
}

async function main() {
  const root = process.cwd();
  const dispatchPath = path.join(root, 'tmp_2025_II_embarcacoes_por_ilha.json');
  const reportPath = path.join(root, 'tmp_reconciliacao_despacho_2025_II_resultado.json');

  if (!fs.existsSync(dispatchPath)) {
    throw new Error(`Ficheiro não encontrado: ${dispatchPath}`);
  }

  const dispatchJson = JSON.parse(fs.readFileSync(dispatchPath, 'utf8')) as {
    porIlha: Record<string, { total: number; embarcacoes: Array<{ cfr: string; conjIdent: string; nome: string }> }>;
  };

  const dispatchEntries: DispatchEntry[] = Object.entries(dispatchJson.porIlha).flatMap(([ilha, data]) =>
    data.embarcacoes.map((e) => ({ cfr: e.cfr, conjIdent: normalizeMatricula(e.conjIdent), nome: e.nome.trim(), ilha })),
  );

  const dispatchByMat = new Map<string, DispatchEntry[]>();
  for (const d of dispatchEntries) {
    const arr = dispatchByMat.get(d.conjIdent) ?? [];
    arr.push(d);
    dispatchByMat.set(d.conjIdent, arr);
  }
  const duplicatedDispatchMatriculas = new Set(
    [...dispatchByMat.entries()].filter(([, arr]) => arr.length > 1).map(([mat]) => mat),
  );

  const dbNavios = (await prisma.navio.findMany({
    select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true },
    orderBy: { id: 'asc' },
  })) as DbNavio[];

  const dbByMat = new Map<string, DbNavio[]>();
  const dbByName = new Map<string, DbNavio[]>();

  for (const n of dbNavios) {
    const matKey = normalizeMatricula(n.matricula);
    if (matKey) {
      const arr = dbByMat.get(matKey) ?? [];
      arr.push(n);
      dbByMat.set(matKey, arr);
    }

    const nameKey = normalizeText(n.nome);
    if (nameKey) {
      const arr = dbByName.get(nameKey) ?? [];
      arr.push(n);
      dbByName.set(nameKey, arr);
    }
  }

  const stats = {
    applyMode: APPLY,
    totalDispatch: dispatchEntries.length,
    totalDbBefore: dbNavios.length,
    duplicatedDispatchMatriculas: [...duplicatedDispatchMatriculas],
    inserted: 0,
    updatedByMatricula: 0,
    updatedByNome: 0,
    skippedAmbiguousDispatchMatricula: 0,
    skippedAmbiguousDbMatricula: 0,
    skippedAmbiguousName: 0,
    skippedNameWithDifferentValidMatricula: 0,
    unchanged: 0,
  };

  const samples = {
    inserted: [] as Array<{ nome: string; matricula: string; ilha: string; tipoPesca: string }> ,
    updated: [] as Array<{ id: number; nomeAntes: string; nomeDepois: string; matriculaAntes: string; matriculaDepois: string; ilhaAntes: string; ilhaDepois: string; tipoAntes: string; tipoDepois: string; via: 'matricula' | 'nome' }>,
    skipped: [] as Array<{ reason: string; nome: string; matricula: string; ilha: string }> ,
  };

  for (const d of dispatchEntries) {
    if (!d.conjIdent) {
      stats.skippedAmbiguousDispatchMatricula += 1;
      if (samples.skipped.length < 30) samples.skipped.push({ reason: 'matricula-vazia-no-despacho', nome: d.nome, matricula: d.conjIdent, ilha: d.ilha });
      continue;
    }

    if (duplicatedDispatchMatriculas.has(d.conjIdent)) {
      stats.skippedAmbiguousDispatchMatricula += 1;
      if (samples.skipped.length < 30) samples.skipped.push({ reason: 'matricula-duplicada-no-despacho', nome: d.nome, matricula: d.conjIdent, ilha: d.ilha });
      continue;
    }

    const tipoInferido = inferTipoPescaFromMatricula(d.conjIdent);
    const byMat = dbByMat.get(d.conjIdent) ?? [];

    if (byMat.length > 1) {
      stats.skippedAmbiguousDbMatricula += 1;
      if (samples.skipped.length < 30) samples.skipped.push({ reason: 'matricula-duplicada-na-base', nome: d.nome, matricula: d.conjIdent, ilha: d.ilha });
      continue;
    }

    if (byMat.length === 1) {
      const existing = byMat[0];
      const nextNome = normalizeText(existing.nome) === normalizeText(d.nome) ? existing.nome : d.nome;
      const nextIlha = normalizeText(existing.ilha) === normalizeText(d.ilha) ? existing.ilha : d.ilha;
      const nextTipo = existing.tipoPesca && existing.tipoPesca.trim() && existing.tipoPesca !== 'N/D'
        ? existing.tipoPesca
        : tipoInferido;

      const needsUpdate =
        nextNome !== existing.nome ||
        nextIlha !== existing.ilha ||
        nextTipo !== existing.tipoPesca;

      if (!needsUpdate) {
        stats.unchanged += 1;
        continue;
      }

      if (APPLY) {
        await prisma.navio.update({
          where: { id: existing.id },
          data: { nome: nextNome, ilha: nextIlha, tipoPesca: nextTipo },
        });
      }

      stats.updatedByMatricula += 1;
      if (samples.updated.length < 40) {
        samples.updated.push({
          id: existing.id,
          nomeAntes: existing.nome,
          nomeDepois: nextNome,
          matriculaAntes: existing.matricula,
          matriculaDepois: existing.matricula,
          ilhaAntes: existing.ilha,
          ilhaDepois: nextIlha,
          tipoAntes: existing.tipoPesca,
          tipoDepois: nextTipo,
          via: 'matricula',
        });
      }

      existing.nome = nextNome;
      existing.ilha = nextIlha;
      existing.tipoPesca = nextTipo;
      continue;
    }

    const byName = dbByName.get(normalizeText(d.nome)) ?? [];
    if (byName.length > 1) {
      stats.skippedAmbiguousName += 1;
      if (samples.skipped.length < 30) samples.skipped.push({ reason: 'nome-ambiguo-na-base', nome: d.nome, matricula: d.conjIdent, ilha: d.ilha });
      continue;
    }

    if (byName.length === 1) {
      const existing = byName[0];
      const canReplaceMatricula = isPlaceholderMatricula(existing.matricula) || normalizeMatricula(existing.matricula) === d.conjIdent;

      if (!canReplaceMatricula) {
        stats.skippedNameWithDifferentValidMatricula += 1;
        if (samples.skipped.length < 30) samples.skipped.push({ reason: 'nome-match-mas-matricula-valida-diferente', nome: d.nome, matricula: d.conjIdent, ilha: d.ilha });
        continue;
      }

      const nextMatricula = d.conjIdent;
      const nextIlha = isPlaceholderIlha(existing.ilha) || normalizeText(existing.ilha) !== normalizeText(d.ilha) ? d.ilha : existing.ilha;
      const nextTipo = existing.tipoPesca && existing.tipoPesca.trim() && existing.tipoPesca !== 'N/D'
        ? existing.tipoPesca
        : tipoInferido;

      const needsUpdate =
        nextMatricula !== existing.matricula ||
        nextIlha !== existing.ilha ||
        nextTipo !== existing.tipoPesca ||
        normalizeText(existing.nome) !== normalizeText(d.nome);

      if (!needsUpdate) {
        stats.unchanged += 1;
        continue;
      }

      if (APPLY) {
        await prisma.navio.update({
          where: { id: existing.id },
          data: {
            nome: d.nome,
            matricula: nextMatricula,
            ilha: nextIlha,
            tipoPesca: nextTipo,
          },
        });
      }

      stats.updatedByNome += 1;
      if (samples.updated.length < 40) {
        samples.updated.push({
          id: existing.id,
          nomeAntes: existing.nome,
          nomeDepois: d.nome,
          matriculaAntes: existing.matricula,
          matriculaDepois: nextMatricula,
          ilhaAntes: existing.ilha,
          ilhaDepois: nextIlha,
          tipoAntes: existing.tipoPesca,
          tipoDepois: nextTipo,
          via: 'nome',
        });
      }

      // refresh indexes for subsequent rows
      const oldMat = normalizeMatricula(existing.matricula);
      if (oldMat && dbByMat.has(oldMat)) {
        dbByMat.set(oldMat, (dbByMat.get(oldMat) ?? []).filter((x) => x.id !== existing.id));
      }
      existing.matricula = nextMatricula;
      existing.ilha = nextIlha;
      existing.tipoPesca = nextTipo;
      existing.nome = d.nome;
      dbByMat.set(nextMatricula, [existing]);
      dbByName.set(normalizeText(existing.nome), [existing]);
      continue;
    }

    if (APPLY) {
      const created = await prisma.navio.create({
        data: {
          nome: d.nome,
          matricula: d.conjIdent,
          ilha: d.ilha,
          tipoPesca: tipoInferido,
        },
      });
      dbByMat.set(d.conjIdent, [{
        id: created.id,
        nome: d.nome,
        matricula: d.conjIdent,
        ilha: d.ilha,
        tipoPesca: tipoInferido,
      }]);
      dbByName.set(normalizeText(d.nome), [{
        id: created.id,
        nome: d.nome,
        matricula: d.conjIdent,
        ilha: d.ilha,
        tipoPesca: tipoInferido,
      }]);
    }

    stats.inserted += 1;
    if (samples.inserted.length < 40) {
      samples.inserted.push({ nome: d.nome, matricula: d.conjIdent, ilha: d.ilha, tipoPesca: tipoInferido });
    }
  }

  const totalChanged = stats.inserted + stats.updatedByMatricula + stats.updatedByNome;

  const naviosAfter = await prisma.navio.count();

  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    timestamp: new Date().toISOString(),
    stats: {
      ...stats,
      totalChanged,
      totalDbAfter: naviosAfter,
    },
    samples,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Modo: ${report.mode}`);
  console.log(`- Inseridos: ${stats.inserted}`);
  console.log(`- Atualizados por matrícula: ${stats.updatedByMatricula}`);
  console.log(`- Atualizados por nome: ${stats.updatedByNome}`);
  console.log(`- Sem alteração: ${stats.unchanged}`);
  console.log(`- Ignorados (ambiguidade despacho matrícula): ${stats.skippedAmbiguousDispatchMatricula}`);
  console.log(`- Ignorados (ambiguidade base matrícula): ${stats.skippedAmbiguousDbMatricula}`);
  console.log(`- Ignorados (nome ambíguo): ${stats.skippedAmbiguousName}`);
  console.log(`- Ignorados (nome match com matrícula válida diferente): ${stats.skippedNameWithDifferentValidMatricula}`);
  console.log(`Relatório: ${reportPath}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
