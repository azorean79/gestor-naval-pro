#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🛠️ A garantir coluna "foto" em "Stock"...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Stock"
    ADD COLUMN IF NOT EXISTS "foto" TEXT
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Stock_foto_idx"
    ON "Stock" ("foto")
  `);

  console.log('✅ Coluna "foto" pronta.');

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('❌ Erro:', error?.message || error);
  await prisma.$disconnect();
  process.exit(1);
});
