const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const PDFParse = require('pdf-parse').PDFParse || (require('pdf-parse').default && require('pdf-parse').default.PDFParse);
let pdfjsLib = null;
const { createCanvas } = require('@napi-rs/canvas');

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = Math.ceil(width);
    canvasAndContext.canvas.height = Math.ceil(height);
  }
  destroy(canvasAndContext) {
    // nothing required for @napi-rs/canvas
  }
}

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
  console.log('Pages to render:', uniquePages.length);

  // load pdfjs (ESM) dynamically then render pages
  try {
    pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
  } catch (e) {
    try {
      pdfjsLib = await import('pdfjs-dist/build/pdf.js');
    } catch (e2) {
      console.error('Unable to import pdfjs-dist build:', e2);
      process.exit(1);
    }
  }

  const uint8 = (buffer instanceof Uint8Array)
    ? buffer
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const loadingTask = pdfjsLib.getDocument({ data: uint8 });
  const pdfDoc = await loadingTask.promise;
  const outDir = path.join(process.cwd(), 'public', 'manual-pages');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const pnum of uniquePages) {
    try {
      const outPath = path.join(outDir, `page-${pnum}.png`);
      if (fs.existsSync(outPath)) {
        console.log('cached', outPath);
        continue;
      }
      const page = await pdfDoc.getPage(pnum);
      const viewport = page.getViewport({ scale: 2 });
      const canvasFactory = new NodeCanvasFactory();
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
      const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport,
        canvasFactory,
      };
      await page.render(renderContext).promise;
      const buf = canvasAndContext.canvas.toBuffer('image/png');
      fs.writeFileSync(outPath, buf);
      console.log('wrote', outPath);
    } catch (e) {
      console.error('render page error', pnum, e);
    }
  }

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
