import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.gestornavalpro_DATABASE_URL ??
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

function normalizeName(value: string): string {
  return value
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

  const knownByNorm = new Map<string, number>();
  for (const n of navios) {
    if (!n.clienteId) continue;
    const key = normalizeName(n.nome);
    if (!knownByNorm.has(key)) {
      knownByNorm.set(key, n.clienteId);
    }
  }

  let updated = 0;
  let candidates = 0;

  for (const n of navios) {
    if (n.clienteId) continue;
    const key = normalizeName(n.nome);
    const clienteId = knownByNorm.get(key);
    if (!clienteId) continue;
    candidates += 1;
    await prisma.navio.update({ where: { id: n.id }, data: { clienteId } });
    updated += 1;
  }

  const withoutClient = await prisma.navio.count({ where: { clienteId: null } });
  const withClient = await prisma.navio.count({ where: { clienteId: { not: null } } });

  console.log(JSON.stringify({
    total: navios.length,
    candidates,
    updated,
    withClient,
    withoutClient,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Erro no backfill Navio.clienteId:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
