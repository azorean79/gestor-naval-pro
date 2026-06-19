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

function parseArg(name: string): string | null {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  if (!found) return null;
  return found.slice(prefix.length).trim();
}

function pick<T>(preferred: T | null | undefined, fallback: T | null | undefined): T | null {
  return preferred ?? fallback ?? null;
}

async function main() {
  const keepName = parseArg('keep');
  const mergeName = parseArg('merge');

  if (!keepName || !mergeName) {
    console.error('Uso: npx ts-node scripts/merge_clientes_by_names.ts --keep="Nome canónico" --merge="Nome a fundir"');
    process.exit(1);
  }

  const keep = await prisma.cliente.findFirst({
    where: { nome: { equals: keepName, mode: 'insensitive' } },
  });

  const merge = await prisma.cliente.findFirst({
    where: { nome: { equals: mergeName, mode: 'insensitive' } },
  });

  if (!keep) {
    console.error(`Cliente canónico não encontrado: ${keepName}`);
    process.exit(1);
  }

  if (!merge) {
    console.error(`Cliente para fundir não encontrado: ${mergeName}`);
    process.exit(1);
  }

  if (keep.id === merge.id) {
    console.log('Os dois nomes já apontam para o mesmo cliente. Nada a fazer.');
    return;
  }

  const mergedData = {
    numeroCliente: pick(keep.numeroCliente, merge.numeroCliente),
    nif: pick(keep.nif, merge.nif),
    email: pick(keep.email, merge.email),
    telefone: pick(keep.telefone, merge.telefone),
    telmovel: pick(keep.telmovel, merge.telmovel),
    morada: pick(keep.morada, merge.morada),
    ilha: pick(keep.ilha, merge.ilha),
  };

  const result = await prisma.$transaction(async (tx) => {
    const naviosUpdated = await tx.navio.updateMany({
      where: { clienteId: merge.id },
      data: { clienteId: keep.id },
    });

    const agendasUpdated = await tx.agenda.updateMany({
      where: { clienteId: merge.id },
      data: { clienteId: keep.id },
    });

    const keepUpdated = await tx.cliente.update({
      where: { id: keep.id },
      data: mergedData,
      select: { id: true, nome: true, morada: true, ilha: true },
    });

    await tx.cliente.delete({ where: { id: merge.id } });

    return {
      keepUpdated,
      deletedClienteId: merge.id,
      naviosUpdated: naviosUpdated.count,
      agendasUpdated: agendasUpdated.count,
    };
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
