// Script para listar todas as jangadas dos certificados 2025
// Usa exceljs para ler os arquivos xlsx listados no relatório JSON

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const reportPath = path.join(__dirname, 'import_certificados_2025_report.json');
const baseDir = path.join(__dirname, '../CERTIFICADOS 2025');

async function main() {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const files = report.sample.map(item => item.file);
  const uniqueFiles = [...new Set(files)];
  let jangadas = [];

  for (const file of uniqueFiles) {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn('Arquivo não encontrado:', filePath);
      continue;
    }
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      worksheet.eachRow((row, rowNumber) => {
        // Adapte conforme o layout real do arquivo
        jangadas.push({
          arquivo: file,
          linha: rowNumber,
          dados: row.values
        });
      });
    } catch (e) {
      console.error('Erro ao ler', filePath, e.message);
    }
  }

  // Exibe todas as jangadas encontradas (sem limite)
  console.log(JSON.stringify(jangadas, null, 2));
}

main();
