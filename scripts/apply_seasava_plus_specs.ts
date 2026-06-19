#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Spec = {
  co2: string;
  n2: string;
};

const CAPACITY_SPECS: Record<number, Spec> = {
  4: { co2: '1.400', n2: '0.040' },
  6: { co2: '1.980', n2: '0.060' },
  8: { co2: '2.500', n2: '0.160' },
  10: { co2: '4.770', n2: '0.140' },
  12: { co2: '4.770', n2: '0.140' },
};

function isThannerLegacy(serial?: string | null) {
  const s = (serial || '').replace(/\s+/g, '').toUpperCase();
  return s.startsWith('41') || s.startsWith('4');
}

function getSystem(serial?: string | null) {
  return isThannerLegacy(serial) ? 'THANNER' : 'Leafield GIST';
}

function getValvulasAtestar(system: string) {
  if (system === 'THANNER') {
    return 'Valve, Topping-up A8/1 (Thanner) P/N 20431001';
  }
  return 'GIST Inlet Check Valve 2.2mm (câmara inferior) P/N 08209009 | GIST Inlet Check Valve 2.8mm (câmara superior) P/N 08210009';
}

function getValvulasAlivio(system: string) {
  if (system === 'THANNER') {
    return 'Valve, pressure relief OTS65 2.90 psi (Thanner) P/N 08152009';
  }
  return 'GIST PRV A10 2.8 Psi (câmara superior e inferior) P/N 08223009';
}

function getDefaultContainerModel(capacity?: number | null) {
  const numericCapacity = Number(capacity || 0);
  if (!Number.isFinite(numericCapacity) || numericCapacity <= 0) return 'MK16';
  if (numericCapacity <= 8) return 'MK18';
  if (numericCapacity <= 12) return 'MK16';
  return 'MK16';
}

async function main() {
  console.log('🔧 Aplicar especificações técnicas SEASAVA PLUS...');

  const rows = await prisma.jangada.findMany({
    where: { model: { contains: 'SEASAVA PLUS', mode: 'insensitive' } },
    select: {
      id: true,
      serial: true,
      capacity: true,
      cylinderCo2: true,
      cylinderN2: true,
      cylinderSistema: true,
      launchType: true,
      containerModel: true,
      valvulasAtestar: true,
      valvulasAlivio: true,
    },
    orderBy: { id: 'asc' },
  });

  let updated = 0;
  let skippedNoSpec = 0;

  for (const row of rows) {
    const spec = CAPACITY_SPECS[Number(row.capacity || 0)];
    if (!spec) {
      skippedNoSpec++;
      continue;
    }

    const system = getSystem(row.serial);

    await prisma.jangada.update({
      where: { id: row.id },
      data: {
        cylinderCo2: spec.co2,
        cylinderN2: spec.n2,
        cylinderSistema: system,
        launchType: 'TO',
        containerModel: row.containerModel || getDefaultContainerModel(Number(row.capacity || 0)),
        valvulasAtestar: getValvulasAtestar(system),
        valvulasAlivio: getValvulasAlivio(system),
      },
    });

    updated++;
  }

  const counts = await prisma.jangada.aggregate({
    where: { model: { contains: 'SEASAVA PLUS', mode: 'insensitive' } },
    _count: {
      _all: true,
      launchType: true,
      containerModel: true,
      valvulasAtestar: true,
      valvulasAlivio: true,
      cylinderCo2: true,
      cylinderN2: true,
      cylinderSistema: true,
    },
  });

  console.log(JSON.stringify({
    total: rows.length,
    updated,
    skippedNoSpec,
    filled: counts._count,
  }, null, 2));
}

main()
  .catch((err) => {
    console.error('❌ Erro ao aplicar specs SEASAVA PLUS:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
