const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

const boletinsDir = path.join(__dirname, '../marcas/boletins');

function extractBoletins() {
  const files = fs.readdirSync(boletinsDir).filter(f => f.endsWith('.pdf'));
  const boletins = [];

  let processed = 0;

  files.forEach(file => {
    const filePath = path.join(boletinsDir, file);
    const pdfParser = new PDFParser();
    pdfParser.loadPDF(filePath);
    pdfParser.on('pdfParser_dataReady', pdfData => {
      const pages = pdfData.formImage.Pages;
      let text = '';
      pages.forEach(page => {
        page.Texts.forEach(t => {
          text += decodeURIComponent(t.R[0].T) + ' ';
        });
        text += '\n';
      });
      boletins.push({ file, text });
      processed++;
      if (processed === files.length) {
        fs.writeFileSync(path.join(boletinsDir, 'boletins-extract.json'), JSON.stringify(boletins, null, 2));
        console.log('Boletins extraídos:', boletins.length);
      }
    });
    pdfParser.on('pdfParser_dataError', err => {
      console.error('Erro ao extrair', file, err);
      processed++;
      if (processed === files.length) {
        fs.writeFileSync(path.join(boletinsDir, 'boletins-extract.json'), JSON.stringify(boletins, null, 2));
        console.log('Boletins extraídos:', boletins.length);
      }
    });
  });
}

extractBoletins();
