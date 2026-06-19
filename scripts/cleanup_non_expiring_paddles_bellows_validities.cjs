const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const DATABASE_ENV_ORDER = [
  'DIRECT_URL',
  'SUPABASE_DATABASE_URL',
  'DATABASE_URL',
  'gestornavalpro_DATABASE_URL',
  'GESTOR_DB',
  'gestornavalpro_POSTGRES_URL',
];

const resolvedDatabaseEnv = DATABASE_ENV_ORDER.find((name) => String(process.env[name] || '').trim());
const connectionString = resolvedDatabaseEnv ? String(process.env[resolvedDatabaseEnv] || '').trim() : '';

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const isDirectPostgresUrl = /^postgres(ql)?:\/\//i.test(connectionString);

if (!isDirectPostgresUrl) {
  process.env.DATABASE_URL = connectionString;
}

const prisma = isDirectPostgresUrl
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : new PrismaClient();
const APPLY = process.argv.includes('--apply');

const NON_EXPIRING_ITEMS = [
  'paddles',
  'padles',
  'paddle',
  'oars',
  'oar',
  'remos',
  'remo',
  'pagaias',
  'pagaia',
  'bellows',
  'fole',
  'sponges',
  'sponge',
  'esponjas',
  'esponja',
  'bailer',
  'bailer bucket',
  'balde',
  'drinking cup',
  'cup',
  'copo',
  'copo de beber',
  'waterproof torch',
  'torch',
  'lanterna impermeavel',
  'lanterna impermeável',
  'immediate action instructions',
  'survival instructions',
  'instrucoes de acao imediata',
  'instrucoes de sobrevivencia',
  'manual sobrevivencia',
  'reflective tape',
  'fita refletora',
  'fita reflectora',
  'grab handles',
  'grab handle',
  'pegas',
  'pega',
  'painter line',
  'painter',
  'retenida',
  'floating knife',
  'safety knife',
  'faca flutuante',
  'faca de seguranca',
  'rescue signal table',
  'rescue signal card',
  'quadro de sinais',
  'sea anchor',
  'drogue',
  'ancora flutuante',
];

const PREFILTER_TERMS = [
  'padd', 'oar', 'remo', 'pagaia', 'bellows', 'fole',
  'sponge', 'esponj', 'bailer', 'balde', 'cup', 'copo', 'waterproof torch', 'lanterna imperme',
  'immediate action', 'survival instruction', 'manual',
  'reflective', 'fita', 'grab handle', 'pega',
  'painter', 'retenida', 'floating knife', 'safety knife', 'faca',
  'rescue signal', 'quadro de sinais', 'sea anchor', 'drogue', 'ancora',
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchesNonExpiringItem(value) {
  const normalized = normalize(value);
  if (!normalized) return false;

  return NON_EXPIRING_ITEMS.some((item) => {
    const alias = normalize(item);
    return (
      normalized === alias ||
      normalized.startsWith(`${alias} `) ||
      normalized.endsWith(` ${alias}`) ||
      normalized.includes(` ${alias} `)
    );
  });
}

function uniq(values) {
  return Array.from(new Set(values.filter((value) => value != null)));
}

function takeSample(rows, mapper) {
  return rows.slice(0, 12).map(mapper);
}

async function fetchPreview() {
  const validadeCandidates = await prisma.certificadoValidade.findMany({
    where: {
      OR: PREFILTER_TERMS.map((term) => ({ item: { contains: term, mode: 'insensitive' } })),
    },
    include: {
      certificado: {
        select: {
          id: true,
          sourceYear: true,
          fileName: true,
          certificadoNumero: true,
          raftSerial: true,
          shipName: true,
          validitiesCount: true,
        },
      },
    },
    orderBy: [{ certificadoId: 'asc' }, { id: 'asc' }],
  });

  const artigoCandidates = await prisma.artigoJangada.findMany({
    where: {
      validade: { not: null },
      OR: PREFILTER_TERMS.map((term) => ({ name: { contains: term, mode: 'insensitive' } })),
    },
    include: {
      Jangada: {
        select: {
          id: true,
          serial: true,
          brand: true,
          model: true,
          owner: true,
        },
      },
    },
    orderBy: [{ jangadaId: 'asc' }, { id: 'asc' }],
  });

  const validadeRows = validadeCandidates.filter((row) => matchesNonExpiringItem(row.item));
  const artigoRows = artigoCandidates.filter((row) => matchesNonExpiringItem(row.name));

  const affectedCertificadoIds = uniq(validadeRows.map((row) => row.certificadoId));
  const affectedJangadaIds = uniq(artigoRows.map((row) => row.jangadaId));

  return {
    validadeRows,
    artigoRows,
    affectedCertificadoIds,
    affectedJangadaIds,
    validadeSample: takeSample(validadeRows, (row) => ({
      id: row.id,
      item: row.item,
      validade: row.validade,
      certificadoId: row.certificadoId,
      sourceYear: row.certificado?.sourceYear ?? null,
      certificadoNumero: row.certificado?.certificadoNumero || null,
      fileName: row.certificado?.fileName || null,
      raftSerial: row.certificado?.raftSerial || null,
      shipName: row.certificado?.shipName || null,
    })),
    artigoSample: takeSample(artigoRows, (row) => ({
      id: row.id,
      name: row.name,
      validade: row.validade,
      referencia: row.referencia || null,
      jangadaId: row.jangadaId,
      jangadaSerial: row.Jangada?.serial || null,
      jangadaModelo: [row.Jangada?.brand, row.Jangada?.model].filter(Boolean).join(' '),
    })),
  };
}

async function applyCleanup(preview) {
  const validadeIds = preview.validadeRows.map((row) => row.id);
  const artigoIds = preview.artigoRows.map((row) => row.id);

  return prisma.$transaction(async (tx) => {
    let deletedValidades = 0;
    let updatedArtigos = 0;

    if (validadeIds.length > 0) {
      const result = await tx.certificadoValidade.deleteMany({
        where: { id: { in: validadeIds } },
      });
      deletedValidades = Number(result.count || 0);
    }

    if (artigoIds.length > 0) {
      const result = await tx.artigoJangada.updateMany({
        where: { id: { in: artigoIds } },
        data: { validade: null },
      });
      updatedArtigos = Number(result.count || 0);
    }

    for (const certificadoId of preview.affectedCertificadoIds) {
      const remaining = await tx.certificadoValidade.count({
        where: { certificadoId },
      });

      await tx.certificadoExtraido.update({
        where: { id: certificadoId },
        data: {
          validitiesCount: remaining,
          hasQuadro: remaining > 0,
        },
      });
    }

    return {
      deletedValidades,
      updatedArtigos,
      recountedCertificates: preview.affectedCertificadoIds.length,
    };
  }, {
    maxWait: 10000,
    timeout: 60000,
  });
}

async function main() {
  const preview = await fetchPreview();

  console.log('Pré-visualização da limpeza de itens sem validade gerida (equipamento não consumível):');
  console.log(`- Fonte da ligação BD: ${resolvedDatabaseEnv || 'desconhecida'}${isDirectPostgresUrl ? ' (direct)' : ' (runtime)'}`);
  console.log(`- CertificadoValidade a remover: ${preview.validadeRows.length}`);
  console.log(`- Certificados afetados: ${preview.affectedCertificadoIds.length}`);
  console.log(`- ArtigoJangada com validade a limpar (validade=null): ${preview.artigoRows.length}`);
  console.log(`- Jangadas afetadas: ${preview.affectedJangadaIds.length}`);
  console.log('- InspecaoArtigo não é alterado por este script para evitar apagar registos operacionais históricos.');

  if (preview.validadeSample.length > 0) {
    console.log('\nAmostra de CertificadoValidade afetado:');
    preview.validadeSample.forEach((row) => {
      console.log(
        `  #${row.id} | ano=${row.sourceYear || '-'} | cert=${row.certificadoNumero || row.certificadoId} | jangada=${row.raftSerial || '-'} | item=${row.item} | validade=${row.validade} | ficheiro=${row.fileName || '-'}`
      );
    });
  }

  if (preview.artigoSample.length > 0) {
    console.log('\nAmostra de ArtigoJangada afetado:');
    preview.artigoSample.forEach((row) => {
      console.log(
        `  #${row.id} | jangada=${row.jangadaSerial || row.jangadaId} | item=${row.name} | validade=${row.validade ? new Date(row.validade).toISOString().slice(0, 10) : '-'} | ref=${row.referencia || '-'}`
      );
    });
  }

  if (!APPLY) {
    console.log('\nModo preview: nada foi alterado. Use --apply para executar.');
    return;
  }

  const result = await applyCleanup(preview);
  console.log('\n✓ Limpeza aplicada com sucesso.');
  console.log(`- CertificadoValidade removidos: ${result.deletedValidades}`);
  console.log(`- ArtigoJangada com validade anulada: ${result.updatedArtigos}`);
  console.log(`- Certificados com validitiesCount recalculado: ${result.recountedCertificates}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
