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

async function main() {
  const navios = await prisma.navio.findMany({
    select: { id: true, nome: true, clienteId: true },
    orderBy: { id: 'asc' },
  });

  const byNorm = new Map<string, Array<{ id: number; nome: string; clienteId: number | null }>>();
  for (const n of navios) {
    const key = normalizeText(n.nome);
    const arr = byNorm.get(key) ?? [];
    arr.push(n);
    byNorm.set(key, arr);
  }

  const duplicatedLogical = [...byNorm.entries()].filter(([, arr]) => arr.length > 1);

  const exemplos = ['NEUZAMAR', 'MESTRE JOSE', 'MESTRE JOSE'];
  const lookup = exemplos.map((e) => ({
    query: e,
    normalized: normalizeText(e),
    matches: byNorm.get(normalizeText(e)) ?? [],
  }));

  const withClient = navios.filter((n) => n.clienteId != null).length;
  const withoutClient = navios.length - withClient;

  console.log(`Total navios: ${navios.length}`);
  console.log(`Com cliente: ${withClient}`);
  console.log(`Sem cliente: ${withoutClient}`);
  console.log(`Duplicados lógicos (nome normalizado): ${duplicatedLogical.length}`);
  if (duplicatedLogical.length) {
    console.log('Top 10 duplicados lógicos:');
    for (const [norm, arr] of duplicatedLogical.slice(0, 10)) {
      console.log(`- ${norm} => ${arr.map((x) => `${x.id}:${x.nome}`).join(' | ')}`);
    }
  }

  console.log('Verificação exemplos:');
  for (const item of lookup) {
    console.log(`- ${item.query} [${item.normalized}] => ${item.matches.map((m) => `${m.id}:${m.nome}`).join(' | ') || 'sem match'}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
