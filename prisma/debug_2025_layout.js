const XLSX = require('xlsx');

function main() {
  const filePath = 'D:\\CERTIFICADOS 2025\\AZ25-006 ESPIRITO SANTO.xlsx';
  console.log(`Abrindo ficheiro: ${filePath}...`);

  const wb = XLSX.readFile(filePath, { cellDates: false });
  const cSheet = wb.Sheets["CERTIFICADO"];
  if (cSheet) {
    const cRows = XLSX.utils.sheet_to_json(cSheet, { header: 1 });
    console.log("\n--- Linhas 16 a 90 da folha CERTIFICADO ---");
    for (let r = 15; r < 90; r++) {
      if (cRows[r] && cRows[r].some(cell => cell !== null && cell !== undefined && cell !== '')) {
        console.log(`Linha ${r + 1}:`, cRows[r]);
      }
    }
  }
}

main();
