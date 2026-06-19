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

function isInvalidMatricula(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.trim().toUpperCase();
  return v === 'N/A' || v === 'N-D' || v === 'N/D' || v === 'NA' || v === 'ND';
}

async function main() {
  const ratinhos = await prisma.navio.findMany({
    where: { nome: { equals: 'RATINHO', mode: 'insensitive' } },
    select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true, clienteId: true },
    orderBy: { id: 'asc' },
  });

  if (ratinhos.length <= 1) {
    console.log(JSON.stringify({ message: 'Sem duplicados para RATINHO', ratinhos }, null, 2));
    return;
  }

  const keep =
    ratinhos.find((n) => !isInvalidMatricula(n.matricula)) ??
    ratinhos[0];

  const duplicates = ratinhos.filter((n) => n.id !== keep.id);
  const duplicateIds = duplicates.map((n) => n.id);

  const result = await prisma.$transaction(async (tx) => {
    const jangadas = await tx.jangada.updateMany({
      where: { shipId: { in: duplicateIds } },
      data: { shipId: keep.id },
    });

    const inspecoes = await tx.inspecao.updateMany({
      where: { navioId: { in: duplicateIds } },
      data: { navioId: keep.id },
    });

    const keepUpdated = await tx.navio.update({
      where: { id: keep.id },
      data: { nome: 'RATINHO' },
      select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true, clienteId: true },
    });

    const deleted = await tx.navio.deleteMany({ where: { id: { in: duplicateIds } } });

    return {
      keep: keepUpdated,
      removedIds: duplicateIds,
      moved: {
        jangadas: jangadas.count,
        inspecoes: inspecoes.count,
      },
      deleted: deleted.count,
    };
  });

  const after = await prisma.navio.findMany({
    where: { nome: { equals: 'RATINHO', mode: 'insensitive' } },
    select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true, clienteId: true },
  });

  console.log(JSON.stringify({ before: ratinhos, result, after }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
