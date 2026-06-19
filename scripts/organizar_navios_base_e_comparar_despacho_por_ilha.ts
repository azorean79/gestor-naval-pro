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

type DespachoEntry = {
  cfr: string;
  conjIdent: string;
  nome: string;
  ilha: string;
};

type BaseEntry = {
  id: number;
  nome: string;
  matricula: string;
  ilha: string;
  tipoPesca: string;
};

function normalizeText(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function normalizeMatricula(value: string): string {
  return (value || '').toUpperCase().replace(/\s+/g, '').trim();
}

async function main() {
  const root = process.cwd();
  const despachoPath = path.join(root, 'tmp_2025_II_embarcacoes_por_ilha.json');
  const outputBasePath = path.join(root, 'tmp_navios_base_por_ilha.json');
  const outputComparePath = path.join(root, 'tmp_comparacao_despacho_base_por_ilha.json');

  if (!fs.existsSync(despachoPath)) {
    throw new Error(`Ficheiro não encontrado: ${despachoPath}`);
  }

  const despachoJson = JSON.parse(fs.readFileSync(despachoPath, 'utf8')) as {
    porIlha: Record<string, { total: number; embarcacoes: DespachoEntry[] }>;
  };

  const despachoEntries: DespachoEntry[] = Object.entries(despachoJson.porIlha).flatMap(([ilha, data]) =>
    data.embarcacoes.map((e) => ({ ...e, ilha })),
  );

  const navios = (await prisma.navio.findMany({
    select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true },
  })) as BaseEntry[];

  const baseByIlha: Record<string, { total: number; navios: BaseEntry[] }> = {};
  for (const n of navios) {
    const ilha = (n.ilha || 'Desconhecida').trim();
    if (!baseByIlha[ilha]) baseByIlha[ilha] = { total: 0, navios: [] };
    baseByIlha[ilha].navios.push(n);
    baseByIlha[ilha].total += 1;
  }

  for (const ilha of Object.keys(baseByIlha)) {
    baseByIlha[ilha].navios.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  }

  fs.writeFileSync(
    outputBasePath,
    JSON.stringify(
      {
        totalNaviosBase: navios.length,
        totalIlhasBase: Object.keys(baseByIlha).length,
        porIlha: Object.fromEntries(Object.entries(baseByIlha).sort((a, b) => a[0].localeCompare(b[0], 'pt'))),
      },
      null,
      2,
    ),
    'utf8',
  );

  const byMatricula = new Map<string, BaseEntry>();
  const byNome = new Map<string, BaseEntry[]>();

  for (const n of navios) {
    byMatricula.set(normalizeMatricula(n.matricula), n);

    const keyNome = normalizeText(n.nome);
    const arr = byNome.get(keyNome) ?? [];
    arr.push(n);
    byNome.set(keyNome, arr);
  }

  const missingInBase: DespachoEntry[] = [];
  const matchedByMatricula: Array<{ despacho: DespachoEntry; base: BaseEntry }> = [];
  const matchedByNome: Array<{ despacho: DespachoEntry; base: BaseEntry }> = [];
  const ilhaConflicts: Array<{ despacho: DespachoEntry; base: BaseEntry }> = [];

  for (const d of despachoEntries) {
    const keyMat = normalizeMatricula(d.conjIdent);
    const exact = byMatricula.get(keyMat);

    if (exact) {
      matchedByMatricula.push({ despacho: d, base: exact });
      if (normalizeText(exact.ilha) !== normalizeText(d.ilha)) {
        ilhaConflicts.push({ despacho: d, base: exact });
      }
      continue;
    }

    const nameMatches = byNome.get(normalizeText(d.nome)) ?? [];
    if (nameMatches.length === 1) {
      matchedByNome.push({ despacho: d, base: nameMatches[0] });
      if (normalizeText(nameMatches[0].ilha) !== normalizeText(d.ilha)) {
        ilhaConflicts.push({ despacho: d, base: nameMatches[0] });
      }
      continue;
    }

    missingInBase.push(d);
  }

  const resumoDespacho = Object.entries(despachoJson.porIlha)
    .map(([ilha, data]) => ({ ilha, totalDespacho: data.total }))
    .sort((a, b) => a.ilha.localeCompare(b.ilha, 'pt'));

  const resumoBase = Object.entries(baseByIlha)
    .map(([ilha, data]) => ({ ilha, totalBase: data.total }))
    .sort((a, b) => a.ilha.localeCompare(b.ilha, 'pt'));

  fs.writeFileSync(
    outputComparePath,
    JSON.stringify(
      {
        totals: {
          despacho: despachoEntries.length,
          base: navios.length,
          matchedByMatricula: matchedByMatricula.length,
          matchedByNome: matchedByNome.length,
          missingInBase: missingInBase.length,
          ilhaConflicts: ilhaConflicts.length,
        },
        resumoDespacho,
        resumoBase,
        missingInBase: missingInBase.sort((a, b) => a.ilha.localeCompare(b.ilha, 'pt') || a.nome.localeCompare(b.nome, 'pt')),
        ilhaConflicts: ilhaConflicts
          .map((x) => ({
            despacho: { ilha: x.despacho.ilha, nome: x.despacho.nome, conjIdent: x.despacho.conjIdent, cfr: x.despacho.cfr },
            base: { id: x.base.id, ilha: x.base.ilha, nome: x.base.nome, matricula: x.base.matricula },
          }))
          .sort((a, b) => a.despacho.ilha.localeCompare(b.despacho.ilha, 'pt') || a.despacho.nome.localeCompare(b.despacho.nome, 'pt')),
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log('Organização por ilha (base) e comparação com despacho concluídas.');
  console.log(`- Total base: ${navios.length}`);
  console.log(`- Total despacho: ${despachoEntries.length}`);
  console.log(`- Match por matrícula: ${matchedByMatricula.length}`);
  console.log(`- Match por nome único: ${matchedByNome.length}`);
  console.log(`- Faltantes na base: ${missingInBase.length}`);
  console.log(`- Conflitos de ilha: ${ilhaConflicts.length}`);
  console.log(`BASE JSON: ${outputBasePath}`);
  console.log(`COMPARE JSON: ${outputComparePath}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
