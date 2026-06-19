import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

type CountRow = { total: number };

type CatalogBrandRow = {
  marca: string;
  total: number;
};

async function getCounts() {
  const [jangadas, coletes, catalogRows] = await Promise.all([
    prisma.$queryRawUnsafe<CountRow[]>(`
      SELECT COUNT(*)::int AS total
      FROM "Jangada"
      WHERE regexp_replace(upper("brand"), '[^A-Z0-9]+', '', 'g') = 'SEASAFE'
    `),
    prisma.$queryRawUnsafe<CountRow[]>(`
      SELECT COUNT(*)::int AS total
      FROM "Colete"
      WHERE regexp_replace(upper(coalesce("marca", '')), '[^A-Z0-9]+', '', 'g') = 'SEASAFE'
    `),
    prisma.$queryRawUnsafe<CatalogBrandRow[]>(`
      SELECT "marca", COUNT(*)::int AS total
      FROM "CatalogMarcaModelo"
      WHERE regexp_replace(upper(coalesce("marca", '')), '[^A-Z0-9]+', '', 'g') = 'SEASAFE'
      GROUP BY "marca"
      ORDER BY "marca"
    `),
  ]);

  return {
    jangadas: jangadas[0]?.total ?? 0,
    coletes: coletes[0]?.total ?? 0,
    catalogRows,
  };
}

async function mergeCatalogSeaSafeVariants() {
  const deletedRows = await prisma.$executeRawUnsafe(`
    WITH ranked AS (
      SELECT
        "id",
        row_number() OVER (
          PARTITION BY "tipo", "modeloKey"
          ORDER BY
            CASE WHEN coalesce("origem", '') <> '' THEN 0 ELSE 1 END,
            CASE WHEN coalesce("fabricante", '') <> '' THEN 0 ELSE 1 END,
            CASE WHEN "marca" = 'SEA-SAFE' THEN 0 ELSE 1 END,
            "id"
        ) AS rn
      FROM "CatalogMarcaModelo"
      WHERE regexp_replace(upper(coalesce("marca", '')), '[^A-Z0-9]+', '', 'g') = 'SEASAFE'
    )
    DELETE FROM "CatalogMarcaModelo" c
    USING ranked r
    WHERE c."id" = r."id" AND r.rn > 1
  `);

  const updatedCatalogBrand = await prisma.$executeRawUnsafe(`
    UPDATE "CatalogMarcaModelo"
    SET
      "marca" = 'SEA-SAFE',
      "marcaKey" = 'SEA-SAFE',
      "fabricante" = CASE
        WHEN regexp_replace(upper(coalesce("fabricante", '')), '[^A-Z0-9]+', '', 'g') = 'SEASAFE' THEN 'SEA-SAFE'
        WHEN coalesce("fabricante", '') = '' THEN 'SEA-SAFE'
        ELSE "fabricante"
      END,
      "updatedAt" = NOW()
    WHERE regexp_replace(upper(coalesce("marca", '')), '[^A-Z0-9]+', '', 'g') = 'SEASAFE'
  `);

  return { deletedRows, updatedCatalogBrand };
}

async function applyMerge() {
  const updatedJangadas = await prisma.$executeRawUnsafe(`
    UPDATE "Jangada"
    SET "brand" = 'SEA-SAFE'
    WHERE regexp_replace(upper("brand"), '[^A-Z0-9]+', '', 'g') = 'SEASAFE'
  `);

  const updatedColetes = await prisma.$executeRawUnsafe(`
    UPDATE "Colete"
    SET "marca" = 'SEA-SAFE'
    WHERE regexp_replace(upper(coalesce("marca", '')), '[^A-Z0-9]+', '', 'g') = 'SEASAFE'
  `);

  const catalog = await mergeCatalogSeaSafeVariants();

  return {
    updatedJangadas,
    updatedColetes,
    ...catalog,
  };
}

async function main() {
  const before = await getCounts();

  console.log('\n🔗 MERGE DE MARCA: SEA SAFE / SEASAFE -> SEA-SAFE');
  console.log(`Modo: ${APPLY ? 'APLICAÇÃO' : 'DRY-RUN'}`);
  console.log(`- Jangadas candidatas: ${before.jangadas}`);
  console.log(`- Coletes candidatos: ${before.coletes}`);
  console.log('- Catálogo candidatos por marca:');
  if (!before.catalogRows.length) {
    console.log('  (nenhum)');
  } else {
    for (const row of before.catalogRows) {
      console.log(`  • ${row.marca}: ${row.total}`);
    }
  }

  if (!APPLY) {
    console.log('\n⚠️ DRY-RUN: sem alterações.');
    console.log('Para aplicar: npx tsx scripts/merge_seasafe_brand_variants.ts --apply\n');
    return;
  }

  const result = await applyMerge();
  const after = await getCounts();

  console.log('\n✅ Merge concluído.');
  console.log(`- Jangadas atualizadas: ${result.updatedJangadas}`);
  console.log(`- Coletes atualizados: ${result.updatedColetes}`);
  console.log(`- Catálogo (linhas removidas por duplicado): ${result.deletedRows}`);
  console.log(`- Catálogo (linhas atualizadas para SEA-SAFE): ${result.updatedCatalogBrand}`);
  console.log(`- Candidatos remanescentes em Jangada: ${after.jangadas}`);
  console.log(`- Candidatos remanescentes em Colete: ${after.coletes}`);
  console.log(`- Candidatos remanescentes em Catálogo: ${after.catalogRows.reduce((acc, row) => acc + row.total, 0)}`);
  console.log('');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao unificar SEA SAFE:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
