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

function normalizeText(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const args = process.argv.slice(2);
const ilhaArg = args.find((a) => a.startsWith('--ilha='));
const tipoArg = args.find((a) => a.startsWith('--tipo='));
const clienteArg = args.find((a) => a.startsWith('--cliente='));

const ilhaFilters = (ilhaArg?.split('=')[1] ?? '')
  .split(',')
  .map((s) => normalizeText(s))
  .filter(Boolean);

const tipoFilters = (tipoArg?.split('=')[1] ?? '')
  .split(',')
  .map((s) => normalizeText(s))
  .filter(Boolean);

const clienteFilterRaw = (clienteArg?.split('=')[1] ?? 'todos').toLowerCase();
const clienteFilter: 'todos' | 'com' | 'sem' =
  clienteFilterRaw === 'com' || clienteFilterRaw === 'sem' ? clienteFilterRaw : 'todos';

async function main() {
  const whereCliente =
    clienteFilter === 'com'
      ? { clienteId: { not: null as null } }
      : clienteFilter === 'sem'
        ? { clienteId: null as null }
        : undefined;

  const totalNavios = await prisma.navio.count();
  const comCliente = await prisma.navio.count({ where: { clienteId: { not: null } } });
  const semCliente = await prisma.navio.count({ where: { clienteId: null } });

  const totalNaviosFiltrados = await prisma.navio.count({ where: whereCliente });

  const clientesComMorada = await prisma.cliente.count({ where: { morada: { not: null } } });
  const clientesSemMorada = await prisma.cliente.count({ where: { morada: null } });

  const byIlhaRaw = await prisma.navio.groupBy({
    by: ['ilha'],
    _count: { _all: true },
    where: whereCliente,
    orderBy: { ilha: 'asc' },
  });

  const byTipoRaw = await prisma.navio.groupBy({
    by: ['tipoPesca'],
    _count: { _all: true },
    where: whereCliente,
    orderBy: { tipoPesca: 'asc' },
  });

  const byIlha = byIlhaRaw.filter((x) => {
    if (!ilhaFilters.length) return true;
    const ilhaNorm = normalizeText(x.ilha);
    return ilhaFilters.some((f) => ilhaNorm.includes(f));
  });

  const byTipo = byTipoRaw.filter((x) => {
    if (!tipoFilters.length) return true;
    const tipoNorm = normalizeText(x.tipoPesca);
    return tipoFilters.some((f) => tipoNorm.includes(f));
  });

  const byIlhaHorizontal = byIlha
    .map((x) => `${x.ilha}(${x._count._all})`)
    .join(' | ');

  const byTipoHorizontal = byTipo
    .map((x) => `${x.tipoPesca}(${x._count._all})`)
    .join(' | ');

  console.log(`ILHAS: ${byIlhaHorizontal}`);
  console.log(`TIPOS: ${byTipoHorizontal}`);

  console.log(
    JSON.stringify(
      {
        filtros: {
          ilha: ilhaFilters,
          tipo: tipoFilters,
          cliente: clienteFilter,
        },
        totalNavios,
        totalNaviosFiltrados,
        comCliente,
        semCliente,
        clientesComMorada,
        clientesSemMorada,
        byIlha,
        byTipo,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
