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

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isGenericClienteName(name: string): boolean {
  const n = normalizeText(name);
  return n.startsWith('CLIENTE SAO MIGUEL') || n.startsWith('CLIENTE SANTA MARIA') || n.startsWith('CLIENTE ');
}

async function main() {
  const navios = await prisma.navio.findMany({
    select: {
      id: true,
      nome: true,
      clienteId: true,
      cliente: { select: { nome: true } },
    },
  });

  const total = navios.length;
  const semCliente = navios.filter((n) => !n.clienteId).length;
  const comCliente = total - semCliente;
  const comClienteGenerico = navios.filter((n) => n.cliente?.nome && isGenericClienteName(n.cliente.nome)).length;

  const topGenericos: Record<string, number> = {};
  for (const n of navios) {
    const nomeCliente = n.cliente?.nome;
    if (!nomeCliente || !isGenericClienteName(nomeCliente)) continue;
    topGenericos[nomeCliente] = (topGenericos[nomeCliente] ?? 0) + 1;
  }

  console.log(
    JSON.stringify(
      {
        total,
        comCliente,
        semCliente,
        comClienteGenerico,
        breakdownClientesGenericos: Object.entries(topGenericos)
          .sort((a, b) => b[1] - a[1])
          .map(([nome, count]) => ({ nome, count })),
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
