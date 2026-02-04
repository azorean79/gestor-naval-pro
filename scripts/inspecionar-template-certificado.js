const path = require('path');
const XLSX = require('xlsx');

const templatePath = path.join(__dirname, '..', 'public', 'templates', 'certificado-template.xlsx');
const wb = XLSX.readFile(templatePath);

console.log('Sheets:', wb.SheetNames);

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const rows = [];
  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 30); r++) {
    const row = [];
    for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + 20); c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row.push(cell ? cell.v : '');
    }
    rows.push(row);
  }
  console.log(`\nSheet: ${sheetName}`);
  console.table(rows);
}
