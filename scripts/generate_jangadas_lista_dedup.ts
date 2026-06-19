import * as fs from 'fs';
import * as path from 'path';

const reportPath = path.join(__dirname, 'import_certificados_2025_report.json');
const artigosPath = path.join(__dirname, 'jangadas_pack_validades_2025.json');
const outPath = path.join(__dirname, 'jangadas_lista_completa_dedup.csv');

if (!fs.existsSync(reportPath)) {
  console.error('Ficheiro de report não encontrado:', reportPath);
  process.exit(1);
}
if (!fs.existsSync(artigosPath)) {
  console.error('Ficheiro de artigos não encontrado:', artigosPath);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const artigosData = JSON.parse(fs.readFileSync(artigosPath, 'utf8'));

const artigosMap = new Map<string, any[]>();
for (const row of artigosData.rows || []) {
  if (row.raftSerial && Array.isArray(row.validities)) {
    artigosMap.set(String(row.raftSerial).trim(), row.validities);
  }
}

const rows = (report.sample || []).concat(report.unresolved || []);

// Map serial -> merged entry
const map = new Map<string, any>();
for (const r of rows) {
  const serial = r.raftSerial ? String(r.raftSerial).trim() : '';
  if (!serial) continue; // skip entries without serial
  const existing = map.get(serial) || {};
  // Merge preferring existing values, otherwise take from r
  const merged: any = {
    serial,
    navio: existing.navio || r.shipName || '',
    marca_modelo: existing.marca_modelo || r.brandModel || '',
    lotacao: existing.lotacao || r.capacity || '',
    pack_type: existing.pack_type || r.emergencyPackType || r.packType || '',
    data_fabrico: existing.data_fabrico || r.dateManuf || '',
    data_inspecao: existing.data_inspecao || r.inspectionDate || '',
    data_prox_inspecao: existing.data_prox_inspecao || r.nextInspectionDate || '',
    artigos: [] as any[],
  };
  // merge artigos from artigosMap and from previous merged
  const a1 = artigosMap.get(serial) || [];
  const a2 = existing.artigos || [];
  const combined = [] as any[];
  for (const it of a2.concat(a1)) {
    const key = (it.item ?? it.name ?? JSON.stringify(it)).toString();
    if (!combined.find(c => (c.item ?? JSON.stringify(c)) === (it.item ?? it))) combined.push(it);
  }
  merged.artigos = combined;
  map.set(serial, merged);
}

const uniques = Array.from(map.values()).sort((a, b) => (a.serial > b.serial ? 1 : -1));

const header = ['num','serial','navio','marca_modelo','lotacao','pack_type','artigos_count','artigos_json'];
const lines = [header.join(';')];
for (let i = 0; i < uniques.length; i++) {
  const u = uniques[i];
  const artigosJson = JSON.stringify(u.artigos || []);
  lines.push([i+1, u.serial || '', u.navio || '', u.marca_modelo || '', u.lotacao || '', u.pack_type || '', (u.artigos||[]).length, artigosJson].join(';'));
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Gerado:', outPath, 'registos:', uniques.length);

process.exit(0);
