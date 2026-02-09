import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const CERT_DIR = 'C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\LIFERAFT1.0\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025';
const testFile = 'AZ25-001 NANCI MARIA.xlsx';

// Convert Excel to text preserving structure (same as in quadro-inspecao-analyzer.ts)
async function excelToStructuredText(buffer: Buffer, sheetIndex: number = 1): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];

    if (!sheet) {
      throw new Error(`Sheet at index ${sheetIndex} not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }

    let text = '';
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

    // Extract all cells with their values in order
    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        const cellValue = sheet[cell]?.v || '';
        rowData.push(String(cellValue).trim());
      }
      // Join row data and add to text
      const rowText = rowData.filter(v => v).join(' | ');
      if (rowText) text += rowText + '\n';
    }

    return text;
  } catch (error) {
    console.error('Error converting Excel to text:', error);
    throw error;
  }
}

async function testExcelConversion() {
  const filePath = path.join(CERT_DIR, testFile);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }

  console.log(`🔄 Testando conversão Excel para texto: ${testFile}`);
  console.log('');

  try {
    const buffer = fs.readFileSync(filePath);
    const text = await excelToStructuredText(buffer, 1); // Use second sheet

    console.log('📄 Texto extraído (primeiras 20 linhas):');
    console.log('=' .repeat(80));
    const lines = text.split('\n').filter(line => line.trim());
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      console.log(`${(i + 1).toString().padStart(2, '0')}: ${lines[i]}`);
    }
    console.log('=' .repeat(80));
    console.log(`📊 Total de linhas com conteúdo: ${lines.length}`);

  } catch (error) {
    if (error instanceof Error) {
      console.log(`💥 Erro na conversão: ${error.message}`);
    } else {
      console.log('💥 Erro na conversão desconhecida:', error);
    }
  }
}

testExcelConversion();