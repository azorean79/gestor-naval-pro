/**
 * Backfill script: SEA-SAFE painter lines (retenidas) and PRV (válvulas de alívio)
 *
 * Rules:
 * 1. painterLength: set "25 m" for any SEA-SAFE jangada with null painterLength
 *    (SOLAS minimum for stowage heights up to ~10 m; user can override per vessel later)
 * 2. valvulasAlivio: only for PL / KI series where still null
 *    - PL-4, PL 4, PL4 variants (≤6 p) → SF-VLV-S
 *    - PL-12, KI-12 and larger       → SF-VLV-M
 *    SEASAVA PLUS already has PRV references from prior data; skip those.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** Resolve valve ref by model name */
function resolveValvulaAlivio(model, capacity) {
  const m = String(model || '').toUpperCase().replace(/\s+/g, '');
  // SEASAVA PLUS / other brands that already have data → skip (handled via null guard)
  // PL-4, PL4, PL 4 variants (≤ 6 persons)
  if (/^PL[-\s]?[46R]/.test(m) || capacity <= 6) return 'SF-VLV-S';
  // PL-12, KI-12 or any larger PL model
  return 'SF-VLV-M';
}

async function main() {
  console.log('🔧 SEA-SAFE specs backfill: painter lines + PRV\n');

  // Fetch all jangadas likely to be SEA-SAFE brand
  const jangadas = await prisma.jangada.findMany({
    where: {
      OR: [
        { brand: { contains: 'SEA', mode: 'insensitive' } },
        { brand: { contains: 'SAVA', mode: 'insensitive' } },
        { model: { contains: 'SEASAVA', mode: 'insensitive' } },
        { model: { startsWith: 'PL-', mode: 'insensitive' } },
        { model: { startsWith: 'PL ', mode: 'insensitive' } },
        { model: { startsWith: 'KI-', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      serial: true,
      brand: true,
      model: true,
      capacity: true,
      launchType: true,
      painterLength: true,
      maxStowageHeight: true,
      valvulasAlivio: true,
    },
  });

  console.log(`Found ${jangadas.length} SEA-SAFE candidate jangadas\n`);

  let painterUpdated = 0;
  let valvulaUpdated = 0;
  let skipped = 0;

  for (const j of jangadas) {
    const updates = {};

    // --- painter line ---
    if (!j.painterLength) {
      updates.painterLength = '25 m';
    }

    // --- PRV / válvula de alívio --- only for truly null entries (SEASAVA PLUS already has values)
    if (!j.valvulasAlivio) {
      const isPLorKI =
        /^PL[-\s]/i.test(j.model) ||
        /^KI[-\s]/i.test(j.model);
      if (isPLorKI) {
        updates.valvulasAlivio = resolveValvulaAlivio(j.model, j.capacity);
      }
    }

    if (Object.keys(updates).length === 0) {
      console.log(`⏭️  ${j.serial} (${j.model}) — nada a actualizar`);
      skipped++;
      continue;
    }

    await prisma.jangada.update({ where: { id: j.id }, data: updates });

    const parts = [];
    if (updates.painterLength) { parts.push(`retenida=${updates.painterLength}`); painterUpdated++; }
    if (updates.valvulasAlivio) { parts.push(`PRV=${updates.valvulasAlivio}`); valvulaUpdated++; }
    console.log(`✅ ${j.serial} (${j.model}, cap=${j.capacity}) → ${parts.join(', ')}`);
  }

  console.log(`
✨ Concluído!
   Retenidas actualizadas : ${painterUpdated}
   PRV actualizadas       : ${valvulaUpdated}
   Ignoradas              : ${skipped}
  `);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
