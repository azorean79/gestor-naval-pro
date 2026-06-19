#!/usr/bin/env tsx
/**
 * Define a válvula de alívio padrão Eurovinil (PRV VA70) nas jangadas existentes.
 * Campo: Jangada.valvulasAlivio
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EUROVINIL_PRV = '10359166'; // PRV VA70 complete

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');

  console.log(`🧷 Aplicar válvula de alívio Eurovinil (${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'})`);

  const rows = await prisma.jangada.findMany({
    where: {
      OR: [
        { brand: { contains: 'EUROVINIL', mode: 'insensitive' } },
        { model: { contains: 'SYNTESY', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      serial: true,
      brand: true,
      model: true,
      valvulasAlivio: true,
    },
    orderBy: [{ model: 'asc' }, { serial: 'asc' }],
  });

  let changed = 0;
  let already = 0;

  for (const row of rows) {
    const current = String(row.valvulasAlivio || '').trim();
    if (current === EUROVINIL_PRV) {
      already += 1;
      continue;
    }

    changed += 1;
    console.log(`↻ [${row.serial}] ${current || '—'} -> ${EUROVINIL_PRV}`);

    if (!dryRun) {
      await prisma.jangada.update({
        where: { id: row.id },
        data: { valvulasAlivio: EUROVINIL_PRV },
      });
    }
  }

  console.log('\n✅ Concluído');
  console.log(`   Jangadas analisadas: ${rows.length}`);
  console.log(`   Atualizadas: ${changed}`);
  console.log(`   Já corretas: ${already}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao aplicar válvula de alívio Eurovinil:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
