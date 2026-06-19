const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

function normalizeBrandName(value) {
  const upper = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();

  const compact = upper.replace(/[^A-Z0-9]/g, '');
  if (compact === 'EURIVINIL') return 'EUROVINIL';
  if (compact === 'SEASAFE') return 'SEA-SAFE';

  return upper;
}

function normalizeApplicabilityBrandList(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const items = raw
    .split(',')
    .map((item) => normalizeBrandName(item))
    .filter(Boolean);

  if (items.length === 0) return null;
  return Array.from(new Set(items)).join(', ');
}

async function main() {
  const apply = process.argv.includes('--apply');

  console.log('\n🔠 NORMALIZAR MARCAS DAS JANGADAS PARA MAIÚSCULAS');
  console.log(`Modo: ${apply ? 'APLICAÇÃO' : 'DRY-RUN'}\n`);

  const [jangadas, stockItems] = await Promise.all([
    prisma.jangada.findMany({
      select: { id: true, serial: true, brand: true, model: true },
      orderBy: { id: 'asc' },
    }),
    prisma.stock.findMany({
      where: { NOT: { aplicavelMarcaJangada: null } },
      select: { id: true, referencia: true, descricao: true, aplicavelMarcaJangada: true },
      orderBy: { id: 'asc' },
    }),
  ]);

  const jangadaUpdates = jangadas
    .map((jangada) => {
      const nextBrand = normalizeBrandName(jangada.brand);
      return nextBrand !== String(jangada.brand || '')
        ? { ...jangada, nextBrand }
        : null;
    })
    .filter(Boolean);

  const stockUpdates = stockItems
    .map((item) => {
      const nextBrands = normalizeApplicabilityBrandList(item.aplicavelMarcaJangada);
      return nextBrands !== item.aplicavelMarcaJangada
        ? { ...item, nextBrands }
        : null;
    })
    .filter(Boolean);

  console.log(`Jangadas com marca a normalizar: ${jangadaUpdates.length}`);
  jangadaUpdates.slice(0, 20).forEach((item) => {
    console.log(`  • [${item.id}] ${item.serial || 'SEM-SERIAL'} :: "${item.brand}" -> "${item.nextBrand}" (${item.model || 'SEM-MODELO'})`);
  });
  if (jangadaUpdates.length > 20) {
    console.log(`  … e mais ${jangadaUpdates.length - 20}`);
  }

  console.log(`\nArtigos stock com aplicabilidade de marca a normalizar: ${stockUpdates.length}`);
  stockUpdates.slice(0, 20).forEach((item) => {
    console.log(`  • [${item.id}] ${item.referencia} :: "${item.aplicavelMarcaJangada}" -> "${item.nextBrands}"`);
  });
  if (stockUpdates.length > 20) {
    console.log(`  … e mais ${stockUpdates.length - 20}`);
  }

  if (!apply) {
    console.log('\n⚠️  DRY-RUN — nenhum dado foi alterado.');
    console.log('   Para aplicar: node scripts/normalize_jangada_brand_values.js --apply\n');
    return;
  }

  let updatedJangadas = 0;
  for (const item of jangadaUpdates) {
    await prisma.jangada.update({
      where: { id: item.id },
      data: { brand: item.nextBrand },
    });
    updatedJangadas += 1;
  }

  let updatedStock = 0;
  for (const item of stockUpdates) {
    await prisma.stock.update({
      where: { id: item.id },
      data: { aplicavelMarcaJangada: item.nextBrands },
    });
    updatedStock += 1;
  }

  console.log('\n✅ Normalização concluída.');
  console.log(`   Jangadas atualizadas: ${updatedJangadas}`);
  console.log(`   Artigos stock atualizados: ${updatedStock}\n`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('❌ Erro ao normalizar marcas:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { normalizeBrandName, normalizeApplicabilityBrandList };
