import fs from 'fs';
import path from 'path';

const marcas = ['RFD', 'EUROVINIL'];
const pastaMarcas = path.join(__dirname, '../marcas');
const pastaContentores = path.join(__dirname, '../contentores');

function listarPDFs(pasta: string) {
  return fs.readdirSync(pasta)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => path.join(pasta, file));
}

function indexarPDFs() {
  const index = {
    marcas: {},
    contentores: []
  };

  for (const marca of marcas) {
    const pasta = path.join(pastaMarcas, marca);
    if (fs.existsSync(pasta)) {
      index.marcas[marca] = listarPDFs(pasta);
    } else {
      index.marcas[marca] = [];
    }
  }

  if (fs.existsSync(pastaContentores)) {
    index.contentores = listarPDFs(pastaContentores);
  }

  fs.writeFileSync('index-pdfs-marcas-contentores.json', JSON.stringify(index, null, 2), 'utf-8');
  console.log('Indexação dos PDFs concluída. Arquivo: index-pdfs-marcas-contentores.json');
}

indexarPDFs();
