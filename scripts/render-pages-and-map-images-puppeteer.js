const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const puppeteer = require('puppeteer');
const PDFParse = require('pdf-parse').PDFParse || (require('pdf-parse').default && require('pdf-parse').default.PDFParse);

async function main() {
  const prisma = new PrismaClient();
  const partsPath = path.join(process.cwd(), 'manuais', 'parts-extracted.json');
  if (!fs.existsSync(partsPath)) {
    console.error('parts-extracted.json not found. Run scripts/extract-parts.js first.');
    process.exit(1);
  }
  const partsRaw = JSON.parse(fs.readFileSync(partsPath, 'utf8'));
  const parts = partsRaw.parts || {};

  const pdfPath = path.join(process.cwd(), 'manuais', 'Service Manual for Marine MK IV.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF not found at', pdfPath);
    process.exit(1);
  }
  const buffer = fs.readFileSync(pdfPath);

  // Use pdf-parse to get per-page text quickly
  const parser = new PDFParse({ data: buffer });
  const textRes = await parser.getText();
  const pages = (textRes && textRes.pages) || [];
  const pageTextMap = {};
  for (const pg of pages) pageTextMap[pg.num] = pg.text || '';

  // map parts to first matching page
  const partToPage = {};
  for (const pn of Object.keys(parts)) {
    if (!pn || pn.trim().length < 3) continue;
    for (const [numStr, txt] of Object.entries(pageTextMap)) {
      if (!txt) continue;
      if (txt.indexOf(pn) !== -1) {
        partToPage[pn] = parseInt(numStr, 10);
        break;
      }
    }
  }

  const uniquePages = Array.from(new Set(Object.values(partToPage))).filter(Boolean);
  console.log('Pages to render via Puppeteer:', uniquePages.length);

  const outDir = path.join(process.cwd(), 'public', 'manual-pages');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600 });

  for (const pnum of uniquePages) {
    try {
      const fileUrl = `file://${pdfPath.replace(/\\/g, '/')}#page=${pnum}`;
      await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      // give viewer some time to render
      await page.waitForTimeout(800);
      const outPath = path.join(outDir, `page-${pnum}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
      console.log('wrote', outPath);
    } catch (e) {
      console.error('puppeteer render error', pnum, e);
    }
  }

  await browser.close();

  // map images to ItemStock records
  let mapped = 0;
  for (const [pn, pnum] of Object.entries(partToPage)) {
    try {
      if (!pnum) continue;
      const imgPath = `/manual-pages/page-${pnum}.png`;
      const item = await prisma.itemStock.findFirst({ where: { codigoFabricante: pn } });
      if (!item) continue;
      await prisma.itemStock.update({ where: { id: item.id }, data: { imagem: imgPath } });
      mapped++;
      console.log('mapped', pn, '->', imgPath);
    } catch (err) {
      console.error('db map err', pn, err);
    }
  }

  console.log('Mapped images for', mapped, 'items');
  await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
