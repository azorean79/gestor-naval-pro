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

async function main() {
  const byCliente = await prisma.navio.groupBy({
    by: ['clienteId'],
    where: { clienteId: { not: null } },
    _count: { _all: true },
  });

  const multi = byCliente
    .filter((g) => (g._count._all ?? 0) > 1)
    .sort((a, b) => (b._count._all ?? 0) - (a._count._all ?? 0));

  if (!multi.length) {
    console.log('Nenhum cliente com mais de 1 navio.');
    return;
  }

  const ids = multi.map((m) => m.clienteId!).filter((id): id is number => id !== null);
  const clientes = await prisma.cliente.findMany({
    where: { id: { in: ids } },
    select: { id: true, nome: true, ilha: true },
  });

  const clienteById = new Map(clientes.map((c) => [c.id, c]));

  const rows = [] as Array<{
    clienteId: number;
    nome: string;
    ilha: string | null;
    totalNavios: number;
  }>;

  for (const m of multi) {
    const cid = m.clienteId!;
    const c = clienteById.get(cid);
    rows.push({
      clienteId: cid,
      nome: c?.nome ?? '(desconhecido)',
      ilha: c?.ilha ?? null,
      totalNavios: m._count._all,
    });
  }

  console.table(rows);
  console.log(JSON.stringify({ totalClientesComVariosNavios: rows.length, rows }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
