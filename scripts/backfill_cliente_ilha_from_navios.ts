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

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isInvalidIlha(value: string | null | undefined): boolean {
  const v = normalize(value);
  return !v || v === 'N/A' || v === 'N D' || v === 'N/D' || v === 'DESCONHECIDA';
}

async function main() {
  const clientes = await prisma.cliente.findMany({
    where: { OR: [{ ilha: null }, { ilha: '' }] },
    select: { id: true, nome: true, ilha: true },
    orderBy: { id: 'asc' },
  });

  let atualizados = 0;
  const detalhes: Array<{ clienteId: number; nome: string; ilhaNova: string; evidencias: Record<string, number> }> = [];

  for (const c of clientes) {
    const navios = await prisma.navio.findMany({
      where: { clienteId: c.id },
      select: { ilha: true },
    });

    if (!navios.length) continue;

    const counts = new Map<string, number>();
    for (const n of navios) {
      if (isInvalidIlha(n.ilha)) continue;
      const key = (n.ilha ?? '').trim();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    if (!counts.size) continue;

    const ordered = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const [ilhaTop, topCount] = ordered[0];
    const secondCount = ordered[1]?.[1] ?? 0;

    // Atualiza apenas se houver predominância clara
    if (topCount < 1 || topCount === secondCount) continue;

    await prisma.cliente.update({
      where: { id: c.id },
      data: { ilha: ilhaTop },
    });

    atualizados += 1;
    detalhes.push({
      clienteId: c.id,
      nome: c.nome,
      ilhaNova: ilhaTop,
      evidencias: Object.fromEntries(ordered),
    });
  }

  const semIlha = await prisma.cliente.count({ where: { OR: [{ ilha: null }, { ilha: '' }] } });

  console.log(
    JSON.stringify(
      {
        clientesSemIlhaAntes: clientes.length,
        atualizados,
        clientesSemIlhaDepois: semIlha,
        detalhes,
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
