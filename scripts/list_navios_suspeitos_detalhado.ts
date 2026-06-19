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

const CORP_MARKERS = [
  'LDA',
  'UNIPESSOAL',
  'SOCIEDADE',
  'CRL',
  'EMPRESA',
  'TURISMO',
  'ACTIVIDADES',
  'ATIVIDADES',
  'BOAT',
  'CHARTER',
  'CENTER',
  'CENTRO',
];

function normalizeText(value: string | undefined | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isClientePadraoIlha(nome: string): boolean {
  return normalizeText(nome).startsWith('CLIENTE ');
}

function isEmpresa(nome: string): boolean {
  const n = normalizeText(nome);
  return CORP_MARKERS.some((m) => n.includes(m));
}

function isLikelyDuplicate(navios: Array<{ nome: string; matricula: string }>): boolean {
  const byNome = new Map<string, number>();
  const matriculas = new Set<string>();

  for (const n of navios) {
    const nn = normalizeText(n.nome);
    byNome.set(nn, (byNome.get(nn) ?? 0) + 1);

    const m = normalizeText(n.matricula);
    if (m && m !== 'N A' && m !== 'N D' && m !== 'NA' && m !== 'ND') {
      if (matriculas.has(m)) return true;
      matriculas.add(m);
    }
  }

  for (const count of byNome.values()) {
    if (count > 1) return true;
  }

  return false;
}

async function main() {
  const grouped = await prisma.navio.groupBy({
    by: ['clienteId'],
    where: { clienteId: { not: null } },
    _count: { _all: true },
  });

  const multi = grouped
    .filter((g) => (g._count._all ?? 0) > 1)
    .sort((a, b) => (b._count._all ?? 0) - (a._count._all ?? 0));

  const ids = multi.map((m) => m.clienteId!).filter((x): x is number => x !== null);
  const clientes = await prisma.cliente.findMany({
    where: { id: { in: ids } },
    select: { id: true, nome: true, ilha: true },
  });

  const byId = new Map(clientes.map((c) => [c.id, c]));

  const suspeitos = multi
    .map((m) => {
      const c = byId.get(m.clienteId!);
      const nome = c?.nome ?? '(desconhecido)';
      const tipo = isClientePadraoIlha(nome) ? 'padrao-ilha' : isEmpresa(nome) ? 'empresa' : 'pessoa-ou-indefinido';
      return {
        clienteId: m.clienteId!,
        nome,
        ilha: c?.ilha ?? null,
        totalNavios: m._count._all,
        tipo,
      };
    })
    .filter((r) => r.tipo === 'pessoa-ou-indefinido');

  const detailed = [] as Array<{
    clienteId: number;
    cliente: string;
    ilha: string | null;
    totalNavios: number;
    duplicadoProvavel: boolean;
    navios: Array<{ id: number; nome: string; matricula: string; ilha: string; tipoPesca: string }>;
  }>;

  for (const s of suspeitos) {
    const navios = await prisma.navio.findMany({
      where: { clienteId: s.clienteId },
      select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true },
      orderBy: [{ nome: 'asc' }, { matricula: 'asc' }],
    });

    detailed.push({
      clienteId: s.clienteId,
      cliente: s.nome,
      ilha: s.ilha,
      totalNavios: s.totalNavios,
      duplicadoProvavel: isLikelyDuplicate(navios.map((n) => ({ nome: n.nome, matricula: n.matricula }))),
      navios,
    });
  }

  console.log('=== DETALHE DOS SUSPEITOS ===');
  for (const d of detailed) {
    console.log(`\nCliente #${d.clienteId}: ${d.cliente} | Ilha: ${d.ilha ?? 'N/D'} | Navios: ${d.totalNavios} | Duplicado provável: ${d.duplicadoProvavel ? 'SIM' : 'NÃO'}`);
    console.table(d.navios);
  }

  console.log(JSON.stringify({ totalSuspeitos: detailed.length, detailed }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
