const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Diretory com PDFs dos manuais
const marcasDir = path.join(__dirname, '..', 'MARCAS');

// Diretório de saída para imagens extraídas
const extractDir = path.join(__dirname, '..', 'public', 'manual-images');

if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

console.log('📄 Procurando arquivos PDF nos manuais...\n');

try {
  // Listar todos os PDFs
  const pdfs = fs.readdirSync(marcasDir)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => path.join(marcasDir, f));

  console.log(`✅ Encontrados ${pdfs.length} arquivos PDF:`);
  pdfs.forEach(pdf => {
    const name = path.basename(pdf);
    console.log(`  - ${name}`);
  });

  console.log('\n⚠️  Para extrair imagens, é necessário ter `pdfimages` instalado:');
  console.log('   brew install poppler  (macOS)');
  console.log('   apt-get install poppler-utils  (Linux)');
  console.log('   choco install poppler  (Windows)');

  console.log('\n📋 Para extrair especificações do LR97:');
  console.log('   Você pode usar: pdftotext MARCAS/LR97.pdf -');
  console.log('   Ou converter com: pdftoppm MARCAS/LR97.pdf image -png');

} catch (error) {
  console.error('❌ Erro:', error.message);
}
