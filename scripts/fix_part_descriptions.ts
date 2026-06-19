#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DESCRIPTION_FIXES: Record<string, string> = {
  '08923009': 'Actuator cable (white)',
};

async function main() {
  console.log('🔧 A corrigir descrições de part numbers no stock...\n');

  let updated = 0;

  for (const [partNumber, description] of Object.entries(DESCRIPTION_FIXES)) {
    const result = await prisma.stock.updateMany({
      where: {
        OR: [
          { codigoFabricante: partNumber },
          { referencia: partNumber },
        ],
      },
      data: {
        descricao: description,
      },
    });

    updated += result.count;
    console.log(`✓ ${partNumber} -> "${description}" (${result.count} registo(s))`);
  }

  console.log(`\n✅ Total atualizado: ${updated}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('❌ Erro:', error?.message || error);
  await prisma.$disconnect();
  process.exit(1);
});
