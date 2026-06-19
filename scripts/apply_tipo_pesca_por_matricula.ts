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

function inferByMatricula(matricula?: string | null): 'Pesca Local' | 'Pesca Costeira' | null {
  const m = (matricula || '').trim().toUpperCase();
  if (!m) return null;
  if (m.endsWith('L')) return 'Pesca Local';
  if (m.endsWith('C')) return 'Pesca Costeira';
  return null;
}

async function main() {
  const navios = await prisma.navio.findMany({
    select: { id: true, matricula: true, tipoPesca: true },
  });

  let updated = 0;
  let local = 0;
  let costeira = 0;
  let skipped = 0;

  for (const n of navios) {
    const tipo = inferByMatricula(n.matricula);
    if (!tipo) {
      skipped += 1;
      continue;
    }

    if (tipo === 'Pesca Local') local += 1;
    if (tipo === 'Pesca Costeira') costeira += 1;

    if (n.tipoPesca !== tipo) {
      await prisma.navio.update({ where: { id: n.id }, data: { tipoPesca: tipo } });
      updated += 1;
    }
  }

  console.log(`Navios analisados: ${navios.length}`);
  console.log(`Com matrícula final L: ${local}`);
  console.log(`Com matrícula final C: ${costeira}`);
  console.log(`Sem regra por matrícula: ${skipped}`);
  console.log(`Navios atualizados agora: ${updated}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
