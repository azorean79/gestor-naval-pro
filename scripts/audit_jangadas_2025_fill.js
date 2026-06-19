const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.gestornavalpro_DATABASE_URL ||
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const all = await prisma.jangada.findMany({
    select: {
      id: true,
      serial: true,
      packType: true,
      cylinderSerial: true,
      dataFabrico: true,
      capacity: true,
      artigos: true,
    },
  });

  const isFilled = (v) => String(v ?? '').trim().length > 0 && String(v ?? '').trim() !== 'N/D';

  const total = all.length;
  const withPack = all.filter((j) => isFilled(j.packType)).length;
  const withCylinder = all.filter((j) => isFilled(j.cylinderSerial)).length;
  const withFabrico = all.filter((j) => isFilled(j.dataFabrico)).length;
  const withCapacity = all.filter((j) => Number(j.capacity || 0) > 0).length;
  const withArtigos = all.filter((j) => {
    if (!isFilled(j.artigos)) return false;
    try {
      const parsed = JSON.parse(j.artigos);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }).length;

  console.log('Auditoria de preenchimento de Jangadas');
  console.log(`Total: ${total}`);
  console.log(`Com packType: ${withPack}`);
  console.log(`Com cylinderSerial: ${withCylinder}`);
  console.log(`Com dataFabrico: ${withFabrico}`);
  console.log(`Com lotação(capacity): ${withCapacity}`);
  console.log(`Com artigos/validades: ${withArtigos}`);
}

main()
  .catch((error) => {
    console.error('Erro na auditoria:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
