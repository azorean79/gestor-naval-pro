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
const PLACEHOLDER_ILHAS = new Set(['', 'N A', 'N D', 'DESCONHECIDA', 'DESCONHECIDO']);

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
  return PLACEHOLDER_MATRICULAS.has(normalizeMatricula(matricula));
}

function isPlaceholderIlha(ilha: string | null | undefined): boolean {
  return PLACEHOLDER_ILHAS.has(normalizeText(ilha));
}

async function main() {
  const root = process.cwd();
  const dispatchPath = path.join(root, 'tmp_2025_II_embarcacoes_por_ilha.json');
  const reportPath = path.join(root, 'tmp_reconciliacao_despacho_2025_II_pendencias_fechadas.json');

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
    if (!d.conjIdent) continue;
    const arr = dispatchByMat.get(d.conjIdent) ?? [];
    arr.push(d);
    dispatchByMat.set(d.conjIdent, arr);
  }

  const dbNavios = (await prisma.navio.findMany({
    select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true },
    orderBy: { id: 'asc' },
  })) as DbNavio[];

  const dbByMat = new Map<string, DbNavio[]>();
  const dbByName = new Map<string, DbNavio[]>();

  for (const n of dbNavios) {
    const mk = normalizeMatricula(n.matricula);
    const nk = normalizeText(n.nome);
    if (mk) {
      const arr = dbByMat.get(mk) ?? [];
      arr.push(n);
      dbByMat.set(mk, arr);
    }
    if (nk) {
      const arr = dbByName.get(nk) ?? [];
      arr.push(n);
      dbByName.set(nk, arr);
    }
  }

  const stats = {
    applyMode: APPLY,
    totalDispatchMatriculas: dispatchByMat.size,
    alreadyCovered: 0,
    updatedFromPlaceholderByName: 0,
    updatedWithIlhaByMatricula: 0,
    insertedMissingMatriculas: 0,
    skippedAmbiguousByName: 0,
    skippedAmbiguousByMatricula: 0,
  };

  const samples = {
    updated: [] as Array<{ id: number; motivo: string; antes: { nome: string; matricula: string; ilha: string; tipoPesca: string }; depois: { nome: string; matricula: string; ilha: string; tipoPesca: string } }>,
    inserted: [] as Array<{ nome: string; matricula: string; ilha: string; tipoPesca: string; origem: string }>,
    skipped: [] as Array<{ matricula: string; reason: string; nomesDespacho: string[]; ilhasDespacho: string[] }>,
  };

  for (const [matricula, entries] of dispatchByMat.entries()) {
    const representative = entries[0];
    const nomes = [...new Set(entries.map((e) => e.nome))];
    const ilhas = [...new Set(entries.map((e) => e.ilha))];
    const tipoInferido = inferTipoPescaFromMatricula(matricula);

    const existingByMat = dbByMat.get(matricula) ?? [];

    if (existingByMat.length > 1) {
      stats.skippedAmbiguousByMatricula += 1;
      if (samples.skipped.length < 30) {
        samples.skipped.push({ matricula, reason: 'matricula-duplicada-na-base', nomesDespacho: nomes, ilhasDespacho: ilhas });
      }
      continue;
    }

    if (existingByMat.length === 1) {
      const ex = existingByMat[0];
      const nomePreferido = nomes.includes(ex.nome) ? ex.nome : representative.nome;
      const ilhaPreferida = ilhas.includes(ex.ilha) ? ex.ilha : representative.ilha;
      const tipoPreferido = ex.tipoPesca && ex.tipoPesca !== 'N/D' ? ex.tipoPesca : tipoInferido;

      const needsUpdate =
        normalizeText(ex.nome) !== normalizeText(nomePreferido) ||
        normalizeText(ex.ilha) !== normalizeText(ilhaPreferida) ||
        normalizeText(ex.tipoPesca) !== normalizeText(tipoPreferido);

      if (!needsUpdate) {
        stats.alreadyCovered += 1;
        continue;
      }

      if (APPLY) {
        await prisma.navio.update({
          where: { id: ex.id },
          data: {
            nome: nomePreferido,
            ilha: ilhaPreferida,
            tipoPesca: tipoPreferido,
          },
        });
      }

      stats.updatedWithIlhaByMatricula += 1;
      if (samples.updated.length < 30) {
        samples.updated.push({
          id: ex.id,
          motivo: 'atualizacao-por-matricula-existente',
          antes: { nome: ex.nome, matricula: ex.matricula, ilha: ex.ilha, tipoPesca: ex.tipoPesca },
          depois: { nome: nomePreferido, matricula: ex.matricula, ilha: ilhaPreferida, tipoPesca: tipoPreferido },
        });
      }

      ex.nome = nomePreferido;
      ex.ilha = ilhaPreferida;
      ex.tipoPesca = tipoPreferido;
      continue;
    }

    // Matricula dispatch não existe na base -> tentar aproveitar navio por nome com matrícula placeholder
    const candidatesByName: DbNavio[] = [];
    for (const n of nomes) {
      const hits = dbByName.get(normalizeText(n)) ?? [];
      for (const h of hits) candidatesByName.push(h);
    }

    const uniqueById = new Map<number, DbNavio>();
    for (const c of candidatesByName) uniqueById.set(c.id, c);
    const uniqueCandidates = [...uniqueById.values()];

    const placeholderCandidates = uniqueCandidates.filter((c) => isPlaceholderMatricula(c.matricula));

    if (placeholderCandidates.length === 1) {
      const target = placeholderCandidates[0];
      const nomeDepois = nomes.includes(target.nome) ? target.nome : representative.nome;
      const ilhaDepois = isPlaceholderIlha(target.ilha) ? representative.ilha : target.ilha;
      const tipoDepois = target.tipoPesca && target.tipoPesca !== 'N/D' ? target.tipoPesca : tipoInferido;

      if (APPLY) {
        await prisma.navio.update({
          where: { id: target.id },
          data: {
            nome: nomeDepois,
            matricula,
            ilha: ilhaDepois,
            tipoPesca: tipoDepois,
          },
        });
      }

      stats.updatedFromPlaceholderByName += 1;
      if (samples.updated.length < 30) {
        samples.updated.push({
          id: target.id,
          motivo: 'upgrade-matricula-por-nome-placeholder',
          antes: { nome: target.nome, matricula: target.matricula, ilha: target.ilha, tipoPesca: target.tipoPesca },
          depois: { nome: nomeDepois, matricula, ilha: ilhaDepois, tipoPesca: tipoDepois },
        });
      }

      target.nome = nomeDepois;
      target.matricula = matricula;
      target.ilha = ilhaDepois;
      target.tipoPesca = tipoDepois;
      dbByMat.set(matricula, [target]);
      dbByName.set(normalizeText(target.nome), [target]);
      continue;
    }

    if (placeholderCandidates.length > 1) {
      stats.skippedAmbiguousByName += 1;
      if (samples.skipped.length < 30) {
        samples.skipped.push({ matricula, reason: 'multiplos-candidatos-placeholder-por-nome', nomesDespacho: nomes, ilhasDespacho: ilhas });
      }
      continue;
    }

    // Sem candidato placeholder -> inserir novo navio com matrícula do despacho
    if (APPLY) {
      const created = await prisma.navio.create({
        data: {
          nome: representative.nome,
          matricula,
          ilha: representative.ilha,
          tipoPesca: tipoInferido,
        },
      });

      const newRow: DbNavio = {
        id: created.id,
        nome: representative.nome,
        matricula,
        ilha: representative.ilha,
        tipoPesca: tipoInferido,
      };
      dbByMat.set(matricula, [newRow]);
      dbByName.set(normalizeText(representative.nome), [newRow]);
    }

    stats.insertedMissingMatriculas += 1;
    if (samples.inserted.length < 30) {
      samples.inserted.push({
        nome: representative.nome,
        matricula,
        ilha: representative.ilha,
        tipoPesca: tipoInferido,
        origem: nomes.length > 1 ? `matricula-com-${nomes.length}-nomes-no-despacho` : 'matricula-ausente-na-base',
      });
    }
  }

  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    timestamp: new Date().toISOString(),
    stats,
    samples,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Modo: ${report.mode}`);
  console.log(`- Matrículas despacho: ${stats.totalDispatchMatriculas}`);
  console.log(`- Já cobertas: ${stats.alreadyCovered}`);
  console.log(`- Atualizadas por matrícula existente: ${stats.updatedWithIlhaByMatricula}`);
  console.log(`- Atualizadas por nome (placeholder): ${stats.updatedFromPlaceholderByName}`);
  console.log(`- Inseridas (matrícula ausente): ${stats.insertedMissingMatriculas}`);
  console.log(`- Ignoradas por ambiguidade de nome: ${stats.skippedAmbiguousByName}`);
  console.log(`- Ignoradas por ambiguidade de matrícula: ${stats.skippedAmbiguousByMatricula}`);
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
