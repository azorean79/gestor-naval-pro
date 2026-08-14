const path = require('path');
const { PrismaClient } = require('@prisma/client');

const ROOT = path.join(__dirname, '..');
const dbPath = path.join(ROOT, 'prisma', 'local.db');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + dbPath } } });

const ref = process.argv[2]?.toUpperCase().trim();
if (!ref) {
  console.error('Usage: node scripts/verify_stock_photo_ref.cjs <REFERENCIA>');
  console.error('Example: node scripts/verify_stock_photo_ref.cjs OSL9507');
  process.exit(1);
}

(async () => {
  const item = await prisma.stock.findFirst({
    where: { referencia: { contains: ref } },
    select: { id: true, referencia: true, descricao: true, foto: true, codigoFabricante: true },
  });
  if (!item) {
    console.log(`No stock item found with referencia containing "${ref}"`);
    await prisma.$disconnect();
    return;
  }
  console.log('Stock item:', JSON.stringify(item, null, 2));
  if (item.foto) {
    const fullPath = path.join(ROOT, 'public', item.foto.replace(/^\//, ''));
    if (require('fs').existsSync(fullPath)) {
      console.log('✓ Photo file exists on disk');
    } else {
      console.log('✗ Photo file MISSING on disk:', fullPath);
    }
  } else {
    console.log('No foto field set.');
    // Check if there's an image file matching the reference
    const dirs = ['public/ocean-safety-spares', 'public/uploads/ocean-safety'];
    for (const dir of dirs) {
      const fullDir = path.join(ROOT, dir);
      if (!require('fs').existsSync(fullDir)) continue;
      const files = require('fs').readdirSync(fullDir);
      const match = files.find(f => path.parse(f).name.toUpperCase() === ref);
      if (match) {
        console.log(`Found matching file: ${dir}/${match}`);
      }
    }
  }
  await prisma.$disconnect();
})();
