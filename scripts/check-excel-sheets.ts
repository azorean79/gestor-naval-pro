import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const CERT_DIR = 'C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\LIFERAFT1.0\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025';
const testFile = 'AZ25-001 NANCI MARIA.xlsx';

function checkExcelSheets() {
  const filePath = path.join(CERT_DIR, testFile);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }

  console.log(`📊 Verificando abas do arquivo: ${testFile}`);
  console.log(`📁 Caminho: ${filePath}`);
  console.log('');

  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    console.log(`📋 Abas encontradas (${workbook.SheetNames.length}):`);
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`   ${index}: "${sheetName}"`);
    });

    console.log('');
    console.log('🔍 Verificando conteúdo da primeira aba:');
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const firstSheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    console.log(`   Linhas: ${firstSheetData.length}`);
    if (firstSheetData.length > 0) {
      console.log(`   Primeiras 3 linhas:`);
      for (let i = 0; i < Math.min(3, firstSheetData.length); i++) {
        console.log(`     ${i + 1}: ${JSON.stringify(firstSheetData[i])}`);
      }
    }

    if (workbook.SheetNames.length > 1) {
      console.log('');
      console.log('🔍 Verificando conteúdo da segunda aba:');
      const secondSheet = workbook.Sheets[workbook.SheetNames[1]];
      const secondSheetData = XLSX.utils.sheet_to_json(secondSheet, { header: 1 });
      console.log(`   Linhas: ${secondSheetData.length}`);
      if (secondSheetData.length > 0) {
        console.log(`   Primeiras 3 linhas:`);
        for (let i = 0; i < Math.min(3, secondSheetData.length); i++) {
          console.log(`     ${i + 1}: ${JSON.stringify(secondSheetData[i])}`);
        }
      }
    }

  } catch (error) {
    if (error instanceof Error) {
      console.log(`💥 Erro ao ler arquivo: ${error.message}`);
    } else {
      console.log('💥 Erro ao ler arquivo desconhecido:', error);
    }
  }
}

checkExcelSheets();