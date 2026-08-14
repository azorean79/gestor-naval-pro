const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const dbPath = path.join(ROOT, 'prisma', 'local.db');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + dbPath } } });

const ref = process.argv[2]?.toUpperCase().trim();
if (!ref) {
  console.error('Usage: node scripts/doctor_ocean_safety_photo.cjs <REFERENCIA>');
  console.error('Example: node scripts/doctor_ocean_safety_photo.cjs OSL9507');
  process.exit(1);
}

(async () => {
  console.log(`=== Verifying photo for ${ref} ===`);
  // Step 1: Verify
  execSync(`node "${path.join(__dirname, 'verify_stock_photo_ref.cjs')}" "${ref}"`, { stdio: 'inherit', cwd: ROOT });
  // Step 2: Backfill
  const imageMapPath = path.join(ROOT, 'documentacao', 'ocean_safety_image_map.json');
  if (require('fs').existsSync(imageMapPath)) {
    const map = JSON.parse(require('fs').readFileSync(imageMapPath, 'utf8'));
    if (map[ref]) {
      const item = await prisma.stock.findFirst({ where: { referencia: { contains: ref } }, select: { id: true } });
      if (item) {
        await prisma.stock.update({ where: { id: item.id }, data: { foto: map[ref] } });
        console.log(`Updated foto for #${item.id}: ${map[ref]}`);
      } else {
        console.log('No stock item found');
      }
    } else {
      console.log(`Reference ${ref} not found in image map`);
    }
  }
  // Step 3: Verify again
  execSync(`node "${path.join(__dirname, 'verify_stock_photo_ref.cjs')}" "${ref}"`, { stdio: 'inherit', cwd: ROOT });
  await prisma.$disconnect();
})();
