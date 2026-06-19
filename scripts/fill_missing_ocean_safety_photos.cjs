const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PLACEHOLDER = '/uploads/ocean-safety/placeholder-ocean-safety.svg';

function isOceanSafetyStock(row) {
  const ref = String(row.referencia || '').toUpperCase();
  const code = String(row.codigoFabricante || '').toUpperCase();
  const desc = String(row.descricao || '').toUpperCase();
  return (
    ref.startsWith('OS-') ||
    ref.startsWith('OSL') ||
    code.startsWith('OSL') ||
    desc.includes('OCEAN SAFETY') ||
    desc.includes('OCEAN ISO') ||
    desc.includes('SOLAS COMPACT') ||
    desc.includes('CHARTER 2.0')
  );
}

async function main() {
  const rows = await prisma.stock.findMany({
    select: { id: true, referencia: true, descricao: true, codigoFabricante: true, foto: true },
  });

  const targets = rows.filter((r) => isOceanSafetyStock(r) && !String(r.foto || '').trim());

  for (const row of targets) {
    await prisma.stock.update({
      where: { id: row.id },
      data: { foto: PLACEHOLDER },
    });
  }

  console.log(`Updated Ocean Safety placeholder photos: ${targets.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
