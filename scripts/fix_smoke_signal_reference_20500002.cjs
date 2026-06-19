const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.gestornavalpro_DATABASE_URL ||
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const APPLY = process.argv.includes('--apply');
const ALIAS_REF = 'JNG-F26194E7';
const CANONICAL_REF = '20500002';
const ALIAS_DESCRIPTION = 'Sinal fumígeno';
const CANONICAL_DESCRIPTION = 'Potes de Fumo / Smoke Signals';
const MANUFACTURER_CODE = 'FLR5010';

const NAME_TOKENS = [
  'sinal fumígeno',
  'sinal fumigeno',
  'smoke signals',
  'floating smoke signals',
  'pote de fumo',
  'potes de fumo',
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function appendUnique(base, extra) {
  const left = String(base || '').trim();
  const right = String(extra || '').trim();
  if (!right) return left || null;
  if (!left) return right;
  if (left.includes(right)) return left;
  return `${left} | ${right}`;
}

function isSmokeSignalName(name) {
  const normalized = normalize(name);
  if (!normalized) return false;
  return NAME_TOKENS.some((token) => normalized.includes(normalize(token)));
}

function sqlQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildArtigoWhereClause() {
  const tokenClauses = NAME_TOKENS.map((token) => {
    const normalizedToken = normalize(token).replace(/'/g, "''");
    return `translate(lower(coalesce(name, '')), 'áàãâäéèêëíìîïóòõôöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') LIKE '%${normalizedToken.replace(/ /g, '%')}%'`;
  });

  return `(
    referencia = ${sqlQuote(ALIAS_REF)}
    OR (
      (referencia IS NULL OR referencia = '' OR referencia = ${sqlQuote(ALIAS_REF)})
      AND (${tokenClauses.join(' OR ')})
    )
  )`;
}

async function ensureCanonicalStock(tx) {
  const existing = await tx.stock.findUnique({ where: { referencia: CANONICAL_REF } });
  if (existing) {
    return tx.stock.update({
      where: { id: existing.id },
      data: {
        descricao: existing.descricao || CANONICAL_DESCRIPTION,
        associavelJangada: true,
        codigoFabricante: existing.codigoFabricante || MANUFACTURER_CODE,
      },
    });
  }

  return tx.stock.create({
    data: {
      referencia: CANONICAL_REF,
      descricao: CANONICAL_DESCRIPTION,
      categoria: 'PIROTECNIA',
      associavelJangada: true,
      codigoFabricante: MANUFACTURER_CODE,
      estadoArtigo: 'ATIVO',
      precoVenda: 0,
      quantidade: 0,
    },
  });
}

async function fetchPreview() {
  const aliasStock = await prisma.stock.findUnique({ where: { referencia: ALIAS_REF } });
  const canonicalStock = await prisma.stock.findUnique({ where: { referencia: CANONICAL_REF } });
  const artigoAlias = await prisma.artigo.findMany({ where: { referencia: ALIAS_REF } });
  const artigoCanonical = await prisma.artigo.findMany({ where: { referencia: CANONICAL_REF } });
  const aliasArtigosJangada = await prisma.artigoJangada.findMany({
    where: { referencia: ALIAS_REF },
    select: { id: true, name: true, jangadaId: true, referencia: true },
  });

  const byNameWithoutCanonical = await prisma.artigoJangada.findMany({
    where: {
      AND: [
        {
          OR: NAME_TOKENS.map((token) => ({ name: { contains: token, mode: 'insensitive' } })),
        },
        {
          OR: [
            { referencia: null },
            { referencia: '' },
            { referencia: ALIAS_REF },
          ],
        },
      ],
    },
    select: { id: true, name: true, jangadaId: true, referencia: true },
  });

  return {
    aliasStock,
    canonicalStock,
    artigoAlias,
    artigoCanonical,
    aliasArtigosJangada,
    byNameWithoutCanonical,
  };
}

async function main() {
  const preview = await fetchPreview();

  console.log(`Alias stock (${ALIAS_REF}): ${preview.aliasStock ? `id=${preview.aliasStock.id} desc=${preview.aliasStock.descricao}` : 'não encontrado'}`);
  console.log(`Canonical stock (${CANONICAL_REF}): ${preview.canonicalStock ? `id=${preview.canonicalStock.id} desc=${preview.canonicalStock.descricao}` : 'não encontrado'}`);
  console.log(`ArtigoJangada com alias direto: ${preview.aliasArtigosJangada.length}`);
  console.log(`ArtigoJangada por nome fumígeno/smoke sem canónica: ${preview.byNameWithoutCanonical.length}`);
  console.log(`Artigo(s) genéricos com alias em Artigo: ${preview.artigoAlias.length}`);

  if (!APPLY) {
    console.log('\nModo preview: nada foi alterado. Use --apply para executar.');
    return;
  }

  const whereClause = buildArtigoWhereClause();

  await prisma.$transaction(async (tx) => {
    const canonicalStock = await ensureCanonicalStock(tx);

    const updatedArtigosJangada = await tx.$executeRawUnsafe(`
      UPDATE "ArtigoJangada"
      SET referencia = ${sqlQuote(CANONICAL_REF)},
          "updatedAt" = NOW()
      WHERE ${whereClause}
    `);

    const updatedArtigo = await tx.artigo.updateMany({
      where: {
        OR: [
          { referencia: ALIAS_REF },
          {
            AND: [
              { referencia: null },
              { name: { equals: ALIAS_DESCRIPTION, mode: 'insensitive' } },
            ],
          },
        ],
      },
      data: {
        referencia: CANONICAL_REF,
        descricao: CANONICAL_DESCRIPTION,
      },
    });

    const aliasStock = await tx.stock.findUnique({ where: { referencia: ALIAS_REF } });
    if (aliasStock) {
      await tx.stock.update({
        where: { id: aliasStock.id },
        data: {
          referenciaSubstituta: CANONICAL_REF,
          associavelJangada: false,
          observacoes: appendUnique(aliasStock.observacoes, `Alias consolidado manualmente em ${CANONICAL_REF} (${new Date().toISOString().slice(0, 10)})`),
        },
      });
    }

    await tx.stock.update({
      where: { id: canonicalStock.id },
      data: {
        associavelJangada: true,
        codigoFabricante: canonicalStock.codigoFabricante || MANUFACTURER_CODE,
        descricao: canonicalStock.descricao || CANONICAL_DESCRIPTION,
      },
    });

    console.log(`ArtigoJangada atualizados: ${updatedArtigosJangada}`);
    console.log(`Artigo atualizados: ${updatedArtigo.count}`);
    console.log(`Stock canónico garantido: id=${canonicalStock.id}`);
    console.log(aliasStock
      ? `Alias stock ${ALIAS_REF} marcado com referência substituta ${CANONICAL_REF}`
      : `Alias stock ${ALIAS_REF} não existia; apenas foi garantido o canónico.`
    );
  });

  console.log(`\n✓ Correção concluída: ${ALIAS_REF} -> ${CANONICAL_REF}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });