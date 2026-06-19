#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

const prisma = new PrismaClient();

interface ManualPart {
  part_number: string;
  description: string;
  source_page: number;
}

const PARTS_JSON_PATH = path.join(process.cwd(), 'tmp_mkiv_parts.json');
const ASSETS_BASE_DIR = path.join(
  process.cwd(),
  'manuais',
  'Service_Manual_Marine_MK_IV_PT_HTML',
  'assets'
);

function pageToImageName(page: number): string {
  return `page_${String(page).padStart(4, '0')}.jpg`;
}

function pageToApiPhotoUrl(page: number): string {
  return `/api/manuais-assets/Service_Manual_Marine_MK_IV_PT_HTML/assets/${pageToImageName(page)}`;
}

async function main() {
  console.log('🖼️ A associar fotos do manual aos artigos de stock (MK IV)...\n');

  if (!fs.existsSync(PARTS_JSON_PATH)) {
    throw new Error(`Ficheiro não encontrado: ${PARTS_JSON_PATH}`);
  }

  const parts = JSON.parse(fs.readFileSync(PARTS_JSON_PATH, 'utf-8')) as ManualPart[];
  const pageByPartNumber = new Map<string, number>();

  for (const part of parts) {
    const pn = String(part.part_number || '').trim();
    const pg = Number(part.source_page || 0);

    if (!pn || !Number.isFinite(pg) || pg <= 0) continue;
    if (!pageByPartNumber.has(pn)) pageByPartNumber.set(pn, pg);
  }

  console.log(`📦 Part numbers com página mapeada: ${pageByPartNumber.size}`);

  let updatedRows = 0;
  let processed = 0;
  let missingPageImage = 0;
  let missingInStock = 0;

  for (const [partNumber, page] of pageByPartNumber.entries()) {
    const imageName = pageToImageName(page);
    const localImagePath = path.join(ASSETS_BASE_DIR, imageName);

    if (!fs.existsSync(localImagePath)) {
      missingPageImage++;
      continue;
    }

    const fotoUrl = pageToApiPhotoUrl(page);

    const result = await prisma.$executeRawUnsafe(
      `UPDATE "Stock"
       SET "foto" = $1,
           "updatedAt" = NOW()
       WHERE "codigoFabricante" = $2 OR "referencia" = $2`,
      fotoUrl,
      partNumber
    );

    processed++;

    if (result > 0) {
      updatedRows += Number(result);
      console.log(`✓ ${partNumber} -> ${fotoUrl} (${result} registo(s))`);
    } else {
      missingInStock++;
    }
  }

  const totalWithPhotoRows = await prisma.$queryRawUnsafe<Array<{ count: bigint | number | string }>>(
    `SELECT COUNT(*)::bigint AS count FROM "Stock" WHERE "foto" IS NOT NULL`
  );
  const totalWithPhoto = Number(totalWithPhotoRows?.[0]?.count ?? 0);
  const totalStock = await prisma.stock.count();

  console.log('\n✅ Concluído!');
  console.log(`   Part numbers processados: ${processed}`);
  console.log(`   Registos atualizados: ${updatedRows}`);
  console.log(`   Sem imagem de página: ${missingPageImage}`);
  console.log(`   Não encontrados no stock: ${missingInStock}`);
  console.log(`   Stock com foto: ${totalWithPhoto}/${totalStock}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('❌ Erro:', error?.message || error);
  await prisma.$disconnect();
  process.exit(1);
});
