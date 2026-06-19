const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizePackType(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'N/D';

  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized === 'N/D' || normalized === 'ND') return 'N/D';

  if (normalized.includes('SOLAS A') || normalized === 'SOLAS-A') return 'SOLAS A';
  if (normalized.includes('SOLAS B') || normalized === 'SOLAS-B' || normalized === 'SOLAS "B"') return 'SOLAS B';
  if (normalized.includes('ISO')) return 'ISO-RAFT';
  if (normalized.includes('COASTAL') || normalized.includes('<24H') || normalized.includes('< 24H') || normalized.includes('*- 24H')) return 'COASTAL';
  if (normalized.includes('OFFSHORE')) return 'OFFSHORE';

  // Regra de negócio atual:
  // - E / Simplificado Reduzido / ORC / Standard => R
  // - R => SIMPLIFICADO MÍNIMO
  if (normalized === 'E') return 'R';
  if (normalized === 'STD' || normalized.startsWith('STD ') || normalized === 'STANDARD') return 'R';
  if (normalized.includes('ORC')) return 'R';
  if (normalized.includes('REDUZ') || normalized === 'SIMP RED' || normalized === 'SIMP. RED') return 'R';
  if (normalized.includes('SIMPL') && !normalized.includes('MIN')) return 'R';

  if (normalized === 'R') return 'SIMPLIFICADO MÍNIMO';
  if (normalized === 'NIN') return 'SIMPLIFICADO MÍNIMO';
  if (normalized.includes('MIN')) return 'SIMPLIFICADO MÍNIMO';

  return raw;
}

async function main() {
  const jangadas = await prisma.jangada.findMany({
    select: { id: true, packType: true },
  });

  let updated = 0;
  const byTransition = new Map();

  for (const j of jangadas) {
    const from = String(j.packType ?? '').trim();
    const to = normalizePackType(j.packType);

    if (to !== from) {
      await prisma.jangada.update({
        where: { id: j.id },
        data: { packType: to },
      });
      updated += 1;
      const key = `${from || '(vazio)'} -> ${to}`;
      byTransition.set(key, (byTransition.get(key) || 0) + 1);
    }
  }

  const grouped = await prisma.jangada.groupBy({
    by: ['packType'],
    _count: { _all: true },
    orderBy: { _count: { packType: 'desc' } },
  });

  console.log(
    JSON.stringify(
      {
        total: jangadas.length,
        updated,
        transitions: Object.fromEntries(Array.from(byTransition.entries()).sort((a, b) => b[1] - a[1])),
        byPackType: grouped,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('Erro ao normalizar packType:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
