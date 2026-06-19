const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

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

const prisma = new PrismaClient({
  datasources: { db: { url: connectionString } },
});

async function main() {
  const before = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS total
    FROM "Jangada"
    WHERE UPPER(TRIM("brand")) = 'ZODIAC'
      AND UPPER(TRIM("model")) = 'COASTER'
  `);

  const beforeCount = Array.isArray(before) ? Number(before[0]?.total || 0) : 0;
  console.log(`Jangadas ZODIAC com modelo COASTER antes: ${beforeCount}`);

  const updated = await prisma.$executeRawUnsafe(`
    UPDATE "Jangada"
    SET "model" = 'COASTAL'
    WHERE UPPER(TRIM("brand")) = 'ZODIAC'
      AND UPPER(TRIM("model")) = 'COASTER'
  `);

  console.log(`Registos atualizados: ${Number(updated || 0)}`);

  const after = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS total
    FROM "Jangada"
    WHERE UPPER(TRIM("brand")) = 'ZODIAC'
      AND UPPER(TRIM("model")) = 'COASTER'
  `);

  const afterCount = Array.isArray(after) ? Number(after[0]?.total || 0) : 0;
  console.log(`Jangadas ZODIAC com modelo COASTER depois: ${afterCount}`);

  const coastal = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS total
    FROM "Jangada"
    WHERE UPPER(TRIM("brand")) = 'ZODIAC'
      AND UPPER(TRIM("model")) = 'COASTAL'
  `);

  const coastalCount = Array.isArray(coastal) ? Number(coastal[0]?.total || 0) : 0;
  console.log(`Jangadas ZODIAC com modelo COASTAL agora: ${coastalCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
