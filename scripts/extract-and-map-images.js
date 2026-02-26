const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const pdfLib = require('pdf-parse');
  const PDFParse = pdfLib.PDFParse || (pdfLib.default && pdfLib.default.PDFParse);
  if (!PDFParse) {
    console.error('PDFParse class not available from pdf-parse');
    process.exit(1);
  }

  const pdfPath = path.join(process.cwd(), 'manuais', 'Service Manual for Marine MK IV.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF not found at', pdfPath);
    process.exit(1);
  }

  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });

  console.log('Extracting page text...');
  const textRes = await parser.getText();
  const pages = (textRes && textRes.pages) || [];
  console.log('Pages with text:', pages.length);

  console.log('Extracting images... (this may take a while)');
  const imgRes = await parser.getImage({ imageBuffer: true, imageDataUrl: false });
  const imgPages = imgRes.pages || [];
  console.log('Pages with images:', imgPages.length);

  const outDir = path.join(process.cwd(), 'public', 'manual-images');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
    console.log('Created output dir', outDir);
  }

  const imageIndexByPage = {};
  console.log('Iterating image pages to write files...');
  for (const p of imgPages) {
    const pageNum = p.pageNumber;
    imageIndexByPage[pageNum] = [];
    for (let i = 0; i < p.images.length; i++) {
      const img = p.images[i];
      const buf = (img && img.data && img.data.length) ? Buffer.from(img.data) : (img && img.dataUrl) ? Buffer.from(img.dataUrl.split(',').pop(), 'base64') : null;
      if (!buf || buf.length === 0) continue;
      const name = `manual-page-${pageNum}-img-${i + 1}.png`;
      const filePath = path.join(outDir, name);
      try {
        fs.writeFileSync(filePath, buf);
        imageIndexByPage[pageNum].push({ name, path: `/manual-images/${name}` });
      } catch (e) {
        console.error('Failed to write image', name, e);
      }
    }
  }

  // Load parts-extracted
  const partsPath = path.join(process.cwd(), 'manuais', 'parts-extracted.json');
  if (!fs.existsSync(partsPath)) {
    console.error('parts-extracted.json not found. Run extract-parts.js first.');
    process.exit(1);
  }
  const partsRaw = JSON.parse(fs.readFileSync(partsPath, 'utf8'));
  const parts = partsRaw.parts || {};

  // Map part -> pages by searching page text
  const pageTextMap = {};
  for (const pg of pages) {
    pageTextMap[pg.num] = pg.text || '';
  }

  let mapped = 0;
  for (const pn of Object.keys(parts)) {
    try {
      if (pn.trim().length < 3) continue;
      // search pages for pn
      const matchedPages = [];
      for (const [numStr, txt] of Object.entries(pageTextMap)) {
        if (!txt) continue;
        if (txt.indexOf(pn) !== -1) matchedPages.push(parseInt(numStr, 10));
      }

      let chosenImage = null;
      if (matchedPages.length) {
        for (const pg of matchedPages) {
          const imgs = imageIndexByPage[pg] || [];
          if (imgs.length) {
            chosenImage = imgs[0];
            break;
          }
        }
      }

      if (!chosenImage) continue;

      // update DB itemStock where codigoFabricante = pn
      const item = await prisma.itemStock.findFirst({ where: { codigoFabricante: pn } });
      if (!item) continue;

      await prisma.itemStock.update({ where: { id: item.id }, data: { imagem: chosenImage.path } });
      console.log('Mapped image for', pn, '->', chosenImage.path);
      mapped++;
    } catch (err) {
      console.error('error mapping image for', pn, err);
    }
  }

  console.log('Mapped images for', mapped, 'parts');
  await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
