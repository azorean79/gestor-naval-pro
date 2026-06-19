import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

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

const apply = process.argv.includes('--apply');

type ClienteRow = {
  id: number;
  nome: string;
  numeroCliente: string | null;
  nif: string | null;
  email: string | null;
  telefone: string | null;
  telmovel: string | null;
  morada: string | null;
  ilha: string | null;
};

function normalizeText(value: string | undefined | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeName(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean);
}

function isStrictFuzzyMatch(a: ClienteRow, b: ClienteRow): boolean {
  const ta = tokenizeName(a.nome);
  const tb = tokenizeName(b.nome);
  if (ta.length < 2 || tb.length < 2) return false;

  const short = ta.length <= tb.length ? ta : tb;
  const long = ta.length <= tb.length ? tb : ta;

  if (short[0] !== long[0]) return false; // mesmo primeiro nome
  if (short[short.length - 1] !== long[long.length - 1]) return false; // mesmo último apelido

  const longSet = new Set(long);
  const allShortInside = short.every((t) => longSet.has(t));
  if (!allShortInside) return false;

  // Evitar juntar empresas por acidente quando há marcadores empresariais
  const corpMarkers = ['LDA', 'UNIPESSOAL', 'SOCIEDADE', 'CRL'];
  const shortHasCorp = short.some((t) => corpMarkers.includes(t));
  const longHasCorp = long.some((t) => corpMarkers.includes(t));
  if (shortHasCorp !== longHasCorp) return false;

  return true;
}

function score(c: ClienteRow): number {
  let s = 0;
  if (c.numeroCliente) s += 5;
  if (c.nif) s += 5;
  if (c.email) s += 3;
  if (c.telefone) s += 1;
  if (c.telmovel) s += 1;
  if (c.morada && c.morada !== 'Morada não indicada') s += 2;
  if (c.ilha) s += 1;
  s += tokenizeName(c.nome).length >= 4 ? 1 : 0; // favorecer nome mais completo
  return s;
}

function chooseCanonical(group: ClienteRow[]): ClienteRow {
  return [...group].sort((a, b) => {
    const sd = score(b) - score(a);
    if (sd !== 0) return sd;
    return a.id - b.id;
  })[0];
}

function mergeValue<T>(a: T | null, b: T | null): T | null {
  return a ?? b ?? null;
}

class DSU {
  parent: number[];
  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
  }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a: number, b: number) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[rb] = ra;
  }
}

async function main() {
  const clientes = await prisma.cliente.findMany({
    select: {
      id: true,
      nome: true,
      numeroCliente: true,
      nif: true,
      email: true,
      telefone: true,
      telmovel: true,
      morada: true,
      ilha: true,
    },
    orderBy: { id: 'asc' },
  });

  const dsu = new DSU(clientes.length);

  for (let i = 0; i < clientes.length; i++) {
    for (let j = i + 1; j < clientes.length; j++) {
      if (isStrictFuzzyMatch(clientes[i], clientes[j])) {
        dsu.union(i, j);
      }
    }
  }

  const groupsMap = new Map<number, ClienteRow[]>();
  for (let i = 0; i < clientes.length; i++) {
    const r = dsu.find(i);
    if (!groupsMap.has(r)) groupsMap.set(r, []);
    groupsMap.get(r)!.push(clientes[i]);
  }

  const groups = Array.from(groupsMap.values()).filter((g) => g.length > 1);

  const preview = groups.map((g) => {
    const canonical = chooseCanonical(g);
    const duplicates = g.filter((x) => x.id !== canonical.id);
    return {
      canonicalId: canonical.id,
      canonicalNome: canonical.nome,
      duplicateIds: duplicates.map((d) => d.id),
      duplicateNomes: duplicates.map((d) => d.nome),
      size: g.length,
    };
  });

  if (!apply) {
    console.log(JSON.stringify({ mode: 'dry-run', groups: preview.length, preview }, null, 2));
    return;
  }

  let mergedGroups = 0;
  let mergedDeleted = 0;
  let movedNavios = 0;
  let movedAgendas = 0;

  for (const g of groups) {
    const canonical = chooseCanonical(g);
    const duplicates = g.filter((x) => x.id !== canonical.id);
    const duplicateIds = duplicates.map((d) => d.id);
    if (!duplicateIds.length) continue;

    const mergedData = {
      numeroCliente: g.map((x) => x.numeroCliente).find(Boolean) ?? null,
      nif: g.map((x) => x.nif).find(Boolean) ?? null,
      email: g.map((x) => x.email).find(Boolean) ?? null,
      telefone: g.map((x) => x.telefone).find(Boolean) ?? null,
      telmovel: g.map((x) => x.telmovel).find(Boolean) ?? null,
      morada: g.map((x) => x.morada).find((v) => !!v && v !== 'Morada não indicada') ?? mergeValue(canonical.morada, null),
      ilha: g.map((x) => x.ilha).find(Boolean) ?? null,
    };

    const tx = await prisma.$transaction(async (t) => {
      const nav = await t.navio.updateMany({
        where: { clienteId: { in: duplicateIds } },
        data: { clienteId: canonical.id },
      });

      const ag = await t.agenda.updateMany({
        where: { clienteId: { in: duplicateIds } },
        data: { clienteId: canonical.id },
      });

      await t.cliente.update({
        where: { id: canonical.id },
        data: mergedData,
      });

      await t.cliente.deleteMany({ where: { id: { in: duplicateIds } } });

      return { navCount: nav.count, agCount: ag.count };
    });

    mergedGroups += 1;
    mergedDeleted += duplicateIds.length;
    movedNavios += tx.navCount;
    movedAgendas += tx.agCount;
  }

  const remainingNoMorada = await prisma.cliente.count({ where: { OR: [{ morada: null }, { morada: '' }] } });

  console.log(
    JSON.stringify(
      {
        mode: 'apply',
        candidateGroups: preview.length,
        mergedGroups,
        mergedDeleted,
        movedNavios,
        movedAgendas,
        remainingNoMorada,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
