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

function normalizeCompact(value: string | null | undefined): string {
  return normalizeText(value).replace(/\s+/g, '');
}

function isBadOwner(v: string | null | undefined): boolean {
  const n = normalizeText(v);
  if (!n) return true;
  if (['N D', 'N A', 'NA', 'ND', 'DESCONHECIDO', 'DESCONHECIDA'].includes(n)) return true;
  if (n.includes('OREY')) return true;
  if (n.includes('SERVICE STATION')) return true;
  return false;
}

async function main() {
  const jangadas = await prisma.jangada.findMany({
    select: {
      owner: true,
      shipNameManual: true,
      shipId: true,
    },
  });

  const valid = jangadas.filter((j) => {
    const shipName = j.shipNameManual || '';
    return !!normalizeCompact(shipName) && !isBadOwner(j.owner);
  });

  const shipSet = new Set<string>();
  const ownerSet = new Set<string>();

  for (const j of valid) {
    const shipName = j.shipNameManual || '';
    shipSet.add(normalizeCompact(shipName));
    ownerSet.add(normalizeCompact(j.owner));
  }

  console.log(
    JSON.stringify(
      {
        jangadasTotal: jangadas.length,
        jangadasValidOwnerAndShip: valid.length,
        uniqueShipsWithOwnerEvidence: shipSet.size,
        uniqueOwners: ownerSet.size,
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
