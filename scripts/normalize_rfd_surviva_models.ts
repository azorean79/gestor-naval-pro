import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

type CandidateRow = {
  id: number;
  brand: string | null;
  model: string | null;
};

type CatalogCandidateRow = {
  id: number;
  tipo: 'COLETE' | 'JANGADA';
  marca: string | null;
  modelo: string | null;
  marcaKey?: string | null;
  modeloKey?: string | null;
};

function normalizeSignature(value: string | null | undefined): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

function toSurvivaModel(value: string | null | undefined): string | null {
  const sig = normalizeSignature(value);
  const compact = sig.replace(/^RFD/, '');
  const hasSurviva = compact.includes('SURVIVA');

  if (hasSurviva && (compact.includes('MKI') || compact.includes('MK1'))) return 'SURVIVA MKIV TO';
  if (hasSurviva && (compact.includes('MKII') || compact.includes('MK2'))) return 'SURVIVA MKII';
  if (hasSurviva && (compact.includes('MKIII') || compact.includes('MK3'))) return 'SURVIVA MKIII';
  if (hasSurviva && (compact.includes('MKIV') || compact.includes('MK4'))) return 'SURVIVA MKIV';

  if (compact === 'MKI' || compact === 'MK1') return 'SURVIVA MKIV TO';
  if (compact === 'MKII' || compact === 'MK2') return 'SURVIVA MKII';
  if (compact === 'MKIII' || compact === 'MK3') return 'SURVIVA MKIII';
  if (compact === 'MKIV' || compact === 'MK4') return 'SURVIVA MKIV';
  return null;
}

async function main() {
  const jangadas = await prisma.jangada.findMany({
    where: {
      brand: { contains: 'RFD', mode: 'insensitive' },
    },
    select: { id: true, brand: true, model: true },
  });

  const jangadaCandidates = jangadas
    .map((row) => ({ ...row, nextModel: toSurvivaModel(row.model) }))
    .filter((row) => !!row.nextModel && row.nextModel !== (row.model || '').toUpperCase());

  const catalogRows = await prisma.$queryRawUnsafe<CatalogCandidateRow[]>(`
    SELECT "id", "tipo", "marca", "modelo", "marcaKey", "modeloKey"
    FROM "CatalogMarcaModelo"
    WHERE "tipo" = 'JANGADA'
      AND UPPER(COALESCE("marca", '')) LIKE '%RFD%'
  `);

  const catalogCandidates = catalogRows
    .map((row) => ({ ...row, nextModel: toSurvivaModel(row.modelo) }))
    .filter((row) => !!row.nextModel && row.nextModel !== String(row.modelo || '').toUpperCase());

  console.log('\n🔁 NORMALIZAR MODELOS RFD MK* -> SURVIVA MK* / MKIV TO');
  console.log(`Modo: ${APPLY ? 'APLICAÇÃO' : 'DRY-RUN'}`);
  console.log(`- Jangadas candidatas: ${jangadaCandidates.length}`);
  console.log(`- Catálogo candidatas: ${catalogCandidates.length}`);

  if (!APPLY) {
    console.log('\n⚠️ DRY-RUN: sem alterações.');
    console.log('Para aplicar: npx tsx scripts/normalize_rfd_surviva_models.ts --apply\n');
    return;
  }

  let updatedJangadas = 0;
  for (const row of jangadaCandidates) {
    await prisma.jangada.update({
      where: { id: row.id },
      data: { model: row.nextModel! },
    });
    updatedJangadas += 1;
  }

  let updatedCatalog = 0;
  for (const row of catalogCandidates) {
    const modeloKey = row.nextModel!.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const marcaKey = (row.marcaKey || row.marca || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

    const duplicate = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
      `
      SELECT "id"
      FROM "CatalogMarcaModelo"
      WHERE "tipo" = $1::"CatalogTipoEquipamento"
        AND "marcaKey" = $2
        AND "modeloKey" = $3
        AND "id" <> $4
      LIMIT 1
      `,
      row.tipo,
      marcaKey,
      modeloKey,
      row.id
    );

    if (duplicate.length) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "CatalogMarcaModelo" WHERE "id" = $1`,
        row.id
      );
      updatedCatalog += 1;
      continue;
    }

    await prisma.$executeRawUnsafe(
      `
      UPDATE "CatalogMarcaModelo"
      SET "modelo" = $1,
          "modeloKey" = $2,
          "updatedAt" = NOW()
      WHERE "id" = $3
      `,
      row.nextModel,
      modeloKey,
      row.id
    );
    updatedCatalog += 1;
  }

  console.log('\n✅ Normalização concluída.');
  console.log(`- Jangadas atualizadas: ${updatedJangadas}`);
  console.log(`- Catálogo atualizado: ${updatedCatalog}`);
  console.log('');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao normalizar modelos RFD:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
