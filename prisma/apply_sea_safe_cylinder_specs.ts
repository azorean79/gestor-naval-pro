import { PrismaClient } from '@prisma/client';
import { getSeaSafeSpec } from '../src/modules/rafts/seaSafeModelData';

const prisma = new PrismaClient();

async function applySeaSafeCylinderSpecs() {
  console.log('🔧 Applying SEA-SAFE cylinder specifications...\n');

  try {
    // Get all SEA-SAFE jangadas
    const seaSafeJangadas = await prisma.jangada.findMany({
      where: {
        OR: [
          { brand: { equals: 'SEA-SAFE', mode: 'insensitive' } },
          { brand: { equals: 'SEASAFE', mode: 'insensitive' } },
          { model: { contains: 'SEA-SAFE', mode: 'insensitive' } },
          { model: { contains: 'SEASAFE', mode: 'insensitive' } },
          { model: { contains: 'PL ', mode: 'insensitive' } },
          { model: { contains: 'PL-', mode: 'insensitive' } },
        ],
      },
    });

    console.log(`Found ${seaSafeJangadas.length} SEA-SAFE jangadas\n`);

    let updated = 0;
    let skipped = 0;

    for (const jangada of seaSafeJangadas) {
      const spec = getSeaSafeSpec(jangada.model);

      if (!spec) {
        console.log(`⏭️  Skipping ${jangada.serial} - model "${jangada.model}" not found in specs`);
        skipped++;
        continue;
      }

      // Update jangada with cylinder specs
      await prisma.jangada.update({
        where: { id: jangada.id },
        data: {
          cylinderCo2: spec.cylinderCo2,
          cylinderN2: spec.cylinderN2,
          cylinderSistema: spec.cylinderSistema,
          cylinderCabecaDisparoRef: spec.cabecaDisparoRef,
          cylinderTuboCamaraSuperiorRef: spec.tuboCamaraSuperiorRef,
          cylinderTuboCamaraInferiorRef: spec.tuboCamaraInferiorRef,
          valvulasAlivio: spec.valvulaAlivioRef,
        },
      });

      console.log(
        `✅ Updated ${jangada.serial} (${jangada.model}): CO2=${spec.cylinderCo2}, N2=${spec.cylinderN2}, System=${spec.cylinderSistema}`
      );
      updated++;
    }

    console.log(`\n✨ Complete! Updated: ${updated}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applySeaSafeCylinderSpecs();
