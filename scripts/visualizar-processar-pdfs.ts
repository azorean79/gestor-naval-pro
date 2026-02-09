import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const indexPath = path.join(__dirname, '../index-pdfs-marcas-contentores.json');

async function processarPDF(pdfPath: string) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  return {
    path: pdfPath,
    numPages: data.numpages,
    info: data.info,
    textSample: data.text.substring(0, 500), // Exemplo: primeiros 500 caracteres
  };
}

async function visualizarProcessar() {
  if (!fs.existsSync(indexPath)) {
    console.error('Arquivo de indexação não encontrado. Rode o script de indexação primeiro.');
    return;
  }
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const resultados: any[] = [];

  for (const marca in index.marcas) {
    for (const pdfPath of index.marcas[marca]) {
      resultados.push(await processarPDF(pdfPath));
    }
  }
  for (const pdfPath of index.contentores) {
    resultados.push(await processarPDF(pdfPath));
  }

  fs.writeFileSync('resultados-pdfs.json', JSON.stringify(resultados, null, 2), 'utf-8');
  console.log('Processamento concluído. Veja resultados em resultados-pdfs.json');
}

visualizarProcessar();
