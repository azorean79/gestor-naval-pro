const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, 'import_certificados_2025_report.json');
const outPath = path.join(__dirname, '..', 'prisma', 'update_jangadas_inspecoes_2025.sql');

if (!fs.existsSync(reportPath)) {
  console.error('Report file not found:', reportPath);
  process.exit(2);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const rows = (report.sample || []).concat(report.unresolved || []);

const lines = [];
lines.push('-- Updates generated from scripts/import_certificados_2025_report.json');
lines.push('BEGIN;');

for (const r of rows) {
  if (!r.raftSerial) continue;
  const serial = String(r.raftSerial).replace(/'/g, "''");
  const ins = r.inspectionDate ? r.inspectionDate : null;
  const next = r.nextInspectionDate ? r.nextInspectionDate : null;
  if (!ins && !next) continue;
  const insVal = ins ? `'${ins}'` : 'NULL';
  const nextVal = next ? `'${next}'` : 'NULL';
  lines.push(`UPDATE "Jangada" SET "dataInspecao" = ${insVal}, "dataProxInspecao" = ${nextVal} WHERE serial = '${serial}';`);
}

lines.push('COMMIT;');

fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log('Wrote', outPath);
