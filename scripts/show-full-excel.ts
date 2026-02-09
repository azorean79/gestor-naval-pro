import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const CERT_DIR = 'C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\LIFERAFT1.0\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025';
const testFile = 'AZ25-001 NANCI MARIA.xlsx';

async function showFullExcelContent() {
  const filePath = path.join(CERT_DIR, testFile);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }

  console.log(`📊 Analisando arquivo: ${testFile}`);
  console.log(`📁 Caminho: ${filePath}`);
  console.log('');

  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    console.log(`📋 Abas encontradas: ${workbook.SheetNames.length}`);
    workbook.SheetNames.forEach((name, index) => {
      console.log(`   ${index}: "${name}"`);
    });
    console.log('');

    // Focus on the QUADRO sheet (index 1)
    const sheet = workbook.Sheets[workbook.SheetNames[1]];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

    console.log('🔍 Conteúdo completo da aba QUADRO:');
    console.log('='.repeat(80));

    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        const cellValue = sheet[cell]?.v || '';
        if (cellValue) {
          rowData.push(String(cellValue).trim());
        }
      }

      if (rowData.length > 0) {
        const lineNumber = String(row + 1).padStart(2, '0');
        const rowText = rowData.join(' | ');
        console.log(`${lineNumber}: ${rowText}`);
      }
    }

  } catch (error) {
    console.error('Erro ao analisar arquivo:', error);
  }
}

showFullExcelContent().catch(console.error);