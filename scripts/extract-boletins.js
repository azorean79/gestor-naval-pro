const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const boletinsDir = path.join(__dirname, '../marcas/boletins');

async function extractBoletins() {
  const files = fs.readdirSync(boletinsDir).filter(f => f.endsWith('.pdf'));
  const boletins = [];

  for (const file of files) {
    const filePath = path.join(boletinsDir, file);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    boletins.push({
      file,
      text: pdfData.text
    });
  }

  fs.writeFileSync(path.join(__dirname, '../marcas/boletins/boletins-extract.json'), JSON.stringify(boletins, null, 2));
  console.log('Boletins extraídos:', boletins.length);
}

extractBoletins();
