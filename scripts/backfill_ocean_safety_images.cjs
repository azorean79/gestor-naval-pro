const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const ROOT = path.join(__dirname, '..');
const dbPath = path.join(ROOT, 'prisma', 'local.db');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + dbPath } } });

const IMAGE_MAP_PATH = path.join(ROOT, 'documentacao', 'ocean_safety_image_map.json');
const PHOTO_DIRS = [
  { dir: 'public/ocean-safety-spares', urlPrefix: '/ocean-safety-spares' },
  { dir: 'public/uploads/ocean-safety', urlPrefix: '/uploads/ocean-safety' },
];

async function main() {
  const photoMap = {};

  // Load image map from JSON
  if (fs.existsSync(IMAGE_MAP_PATH)) {
    const map = JSON.parse(fs.readFileSync(IMAGE_MAP_PATH, 'utf8'));
    Object.assign(photoMap, map);
    console.log(`Loaded ${Object.keys(map).length} entries from ocean_safety_image_map.json`);
  }

  // Scan directories for additional images
  for (const { dir, urlPrefix } of PHOTO_DIRS) {
    const fullPath = path.join(ROOT, dir);
    if (!fs.existsSync(fullPath)) continue;
    const files = fs.readdirSync(fullPath);
    for (const file of files) {
      const parsed = path.parse(file);
      const ref = parsed.name.toUpperCase();
      const url = `${urlPrefix}/${file}`;
      if (!photoMap[ref]) {
        photoMap[ref] = url;
      }
    }
    console.log(`Scanned ${dir}: ${files.length} files`);
  }

  console.log(`Total unique references in photo map: ${Object.keys(photoMap).length}`);

  // Query stock items WITHOUT foto
  const items = await prisma.stock.findMany({
    where: { estadoArtigo: 'ATIVO', foto: null },
    select: { id: true, referencia: true, descricao: true, codigoFabricante: true },
  });

  console.log(`Active stock items without foto: ${items.length}`);

  let updated = 0;
  for (const item of items) {
    if (!item.referencia) continue;
    const ref = item.referencia.toUpperCase().trim();
    const url = photoMap[ref];
    if (url) {
      await prisma.stock.update({ where: { id: item.id }, data: { foto: url } });
      console.log(`  UPDATED #${item.id} ${item.referencia} → ${url}`);
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} stock items.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
