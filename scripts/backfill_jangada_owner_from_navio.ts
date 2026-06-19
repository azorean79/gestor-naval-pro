import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
// Carrega variáveis de ambiente primeiro de .env.local, depois de .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Busca a connection string do banco
const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.gestornavalpro_DATABASE_URL ??
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

// Inicializa PrismaClient
const prisma = new PrismaClient({
  datasources: { db: { url: connectionString } }
});

async function main() {
  // Busca jangadas sem owner ou owner vazio, mas com shipId
  const rows = await prisma.jangada.findMany({
    where: {
      OR: [{ owner: 'N/D' }, { owner: '' }],
      shipId: { not: null },
    },
    select: {
      id: true,
      serial: true,
      owner: true,
      shipId: true,
    },
  });

  // Busca navios e clientes relacionados
  const shipIds = Array.from(new Set(rows.map((r) => r.shipId).filter((id): id is number => id !== null)));
  const navios = await prisma.navio.findMany({
    where: { id: { in: shipIds } },
    select: {
      id: true,
      nome: true,
      clienteId: true,
      cliente: { select: { id: true, nome: true } },
    },
  });

  const navioById = new Map(navios.map((n) => [n.id, n]));

  let updated = 0;
  let skippedNoClient = 0;

  // Atualiza owner das jangadas
  for (const row of rows) {
    const navio = row.shipId ? navioById.get(row.shipId) : null;
    const clienteNome = navio?.cliente?.nome?.trim();
    if (!clienteNome) {
      skippedNoClient += 1;
      continue;
    }

    await prisma.jangada.update({
      where: { id: row.id },
      data: { owner: clienteNome },
    });
    updated += 1;
  }

  // Estatísticas finais
  const withOwner = await prisma.jangada.count({ where: { owner: { not: 'N/D' } } });
  const total = await prisma.jangada.count();

  console.log(JSON.stringify({
    scanned: rows.length,
    updated,
    skippedNoClient,
    total,
    withOwner,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Erro no backfill owner:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
