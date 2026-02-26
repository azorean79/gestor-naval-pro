const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { createCanvas } = require('@napi-rs/canvas');

async function main() {
  const prisma = new PrismaClient();
  const items = await prisma.itemStock.findMany({ where: { imagem: { contains: '/manual-pages/page-' } } });
  const nums = new Set();
  for (const it of items) {
    const m = it.imagem && it.imagem.match(/page-(\d+)\.png/);
    if (m) nums.add(parseInt(m[1], 10));
  }
  if (!nums.size) {
    console.log('No manual page images referenced in DB.');
    await prisma.$disconnect();
    return;
  }
  const outDir = path.join(process.cwd(), 'public', 'manual-pages');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  for (const n of Array.from(nums)) {
    const outPath = path.join(outDir, `page-${n}.png`);
    if (fs.existsSync(outPath)) continue;
    try {
      const w = 1200, h = 1600;
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#222222';
      ctx.font = '40px sans-serif';
      ctx.fillText(`Manual page ${n}`, 60, 120);
      const buf = canvas.toBuffer('image/png');
      fs.writeFileSync(outPath, buf);
      console.log('wrote placeholder', outPath);
    } catch (e) {
      console.error('failed placeholder', n, e);
    }
  }
  await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
