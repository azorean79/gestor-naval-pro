import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

function safe(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj.result === 'string') return obj.result.trim();
    if (typeof obj.text === 'string') return obj.text.trim();
  }
  return String(v).trim();
}

const files = [
  'AZ25-005 PÃO DE CRISTO.xlsx',
  'AZ25-012 GRAÇAS A DEUS.xlsx',
  'AZ25-028 ILHA DE SÃO MIGUEL.xlsx',
  'AZ25-032 BIANCA E FABIANA.xlsx',
];

for (const f of files) {
  const full = path.join(process.cwd(), 'CERTIFICADOS 2025', f);
  if (!fs.existsSync(full)) {
    console.log('MISSING', f);
    continue;
  }

  const wb = XLSX.readFile(full, { cellDates: true });
  const certSheetName = wb.SheetNames.find((s) => s.toUpperCase().includes('CERTIFICADO')) ?? wb.SheetNames[0];
  const ws = wb.Sheets[certSheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false }) as unknown[][];

  console.log('\n==============================');
  console.log(f, 'sheet=', certSheetName, 'rows=', rows.length);

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const cell = safe(row[c]);
      if (!cell) continue;
      const up = cell.toUpperCase();
      if (up.includes('OWNER') || up.includes('ARMADOR') || up.includes('NOME DO NAVIO') || up.includes('NAME OF SHIP')) {
        console.log(`\n[${r},${c}] ${cell}`);
        for (let rr = Math.max(0, r - 1); rr <= Math.min(rows.length - 1, r + 4); rr++) {
          const vals: string[] = [];
          for (let cc = Math.max(0, c - 1); cc <= c + 8; cc++) {
            const v = safe(rows[rr]?.[cc]);
            vals.push(v || '.');
          }
          console.log(`  row ${rr}:`, vals.join(' | '));
        }
      }
    }
  }
}
