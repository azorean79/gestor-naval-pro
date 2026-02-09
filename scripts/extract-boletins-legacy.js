const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const boletinsDir = path.join(__dirname, '../marcas/boletins');

async function extractBoletins() {
  const files = fs.readdirSync(boletinsDir).filter(f => f.endsWith('.pdf'));
  const boletins = [];

  for (const file of files) {
    const filePath = path.join(boletinsDir, file);
    const dataBuffer = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    boletins.push({ file, text });
  }

  fs.writeFileSync(path.join(boletinsDir, 'boletins-extract.json'), JSON.stringify(boletins, null, 2));
  console.log('Boletins extraídos:', boletins.length);
}

extractBoletins();
