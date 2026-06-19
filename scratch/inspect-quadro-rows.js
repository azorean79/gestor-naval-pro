const ExcelJS = require('exceljs');

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('c:/Users/julio/Desktop/APLICACAO MASTER/oreyazores26/templates/template quadro.xlsx');
  const ws = workbook.getWorksheet('QUADRO') || workbook.worksheets[0];

  console.log("Inspecting template cells...");
  for (let r = 21; r <= 27; r++) {
    const rowCells = [];
    for (let c = 1; c <= 12; c++) {
      const cell = ws.getCell(r, c);
      const colLetter = String.fromCharCode(64 + c);
      rowCells.push(`${colLetter}${r}: value="${cell.value || ''}"`);
    }
    console.log(`Row ${r}:`, rowCells.join(' | '));
  }
}

main().catch(console.error);
