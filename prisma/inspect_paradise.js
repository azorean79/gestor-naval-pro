const XLSX = require('xlsx');

function main() {
  const filePath = 'D:\\CERTIFICADOS 2025\\AZ25-171 PARADISE.xlsx';
  console.log(`Lendo arquivo: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  console.log('Folhas:', workbook.SheetNames);

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log("\nPrimeiras 50 linhas:");
  data.slice(0, 50).forEach((row, index) => {
    if (row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
      console.log(`Linha ${index + 1}:`, row.slice(0, 15));
    }
  });
}

main();
