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
    select: { id: true, nome: true, ilha: true, morada: true },
  });

  const byId = new Map(clientes.map((c) => [c.id, c]));

  const allMulti = multi.map((m) => {
    const c = byId.get(m.clienteId!);
    return {
      clienteId: m.clienteId!,
      nome: c?.nome ?? '(desconhecido)',
      ilha: c?.ilha ?? null,
      totalNavios: m._count._all,
      tipo: isClientePadraoIlha(c?.nome ?? '') ? 'padrao-ilha' : isEmpresa(c?.nome ?? '') ? 'empresa' : 'pessoa-ou-indefinido',
    };
  });

  const suspeitos = allMulti.filter((r) => r.tipo === 'pessoa-ou-indefinido');

  console.log('=== SUSPEITOS (múltiplos navios, excluindo cliente padrão/empresa) ===');
  console.table(suspeitos);

  console.log(
    JSON.stringify(
      {
        totalClientesComMultiplos: allMulti.length,
        totalSuspeitos: suspeitos.length,
        suspeitos,
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
