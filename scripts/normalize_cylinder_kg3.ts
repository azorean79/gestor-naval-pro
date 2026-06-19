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
  console.error('❌ No database connection string found.');
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;
const prisma = new PrismaClient();

function asText(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function normalizeKg3(value: string | null | undefined): string | null {
  const text = asText(value);
  if (!text) return null;

  const normalized = text.replace(',', '.');
  const numericMatch = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!numericMatch) return null;

  const parsed = Number(numericMatch[0]);
  if (!Number.isFinite(parsed)) return null;

  return parsed.toFixed(3);
}

async function main() {
  console.log('\n⚙️  RETROATIVO: Normalizar cilindro para kg com 3 casas decimais\n');

  const jangadas = await prisma.jangada.findMany({
    select: {
      id: true,
      serial: true,
      cylinderTara: true,
      cylinderPesoBruto: true,
      cylinderCo2: true,
      cylinderN2: true,
    },
  });

  let scanned = 0;
  let updated = 0;
  let invalidToNull = 0;

  for (const j of jangadas) {
    scanned += 1;

    const newTara = normalizeKg3(j.cylinderTara);
    const newPesoBruto = normalizeKg3(j.cylinderPesoBruto);
    const newCo2 = normalizeKg3(j.cylinderCo2);
    const newN2 = normalizeKg3(j.cylinderN2);

    const shouldUpdate =
      j.cylinderTara !== newTara ||
      j.cylinderPesoBruto !== newPesoBruto ||
      j.cylinderCo2 !== newCo2 ||
      j.cylinderN2 !== newN2;

    if (!shouldUpdate) continue;

    const becameNullCount =
      (j.cylinderTara && !newTara ? 1 : 0) +
      (j.cylinderPesoBruto && !newPesoBruto ? 1 : 0) +
      (j.cylinderCo2 && !newCo2 ? 1 : 0) +
      (j.cylinderN2 && !newN2 ? 1 : 0);

    invalidToNull += becameNullCount;

    await prisma.jangada.update({
      where: { id: j.id },
      data: {
        cylinderTara: newTara,
        cylinderPesoBruto: newPesoBruto,
        cylinderCo2: newCo2,
        cylinderN2: newN2,
      },
    });

    updated += 1;
  }

  console.log(`✅ Jangadas analisadas: ${scanned}`);
  console.log(`✅ Jangadas atualizadas: ${updated}`);
  console.log(`ℹ️  Valores inválidos convertidos para null: ${invalidToNull}`);
  console.log('\n🏁 Correção retroativa concluída.\n');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Erro na correção retroativa:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
