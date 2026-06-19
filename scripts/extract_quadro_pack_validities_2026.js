const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT = process.cwd();
const CERT_DIR = path.join(ROOT, 'CERTIFICADOS 2026');
const OUT_JSON = path.join(ROOT, 'scripts', 'jangadas_pack_validades_2026.json');
const OUT_CSV = path.join(ROOT, 'scripts', 'jangadas_pack_validades_2026.csv');

function norm(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isNonExpiringItem(value) {
  const v = norm(value);
  return [
    'RAMPA',
    'BOARDING RAMP',
    'BOARDING RAMP OR LADDER',
    'RAMPA OU ESCADA',
    'ESCADA',
    'LADDER',
  ].includes(v);
}

function parseFilenameShipName(fileName) {
  return clean(fileName.replace(/\.xlsx$/i, '').replace(/^AZ\d{2}-\d+\s*/i, ''));
}

function isLikelyLabelValue(value) {
  const v = norm(value);
  if (!v) return true;
  if (v.includes('NAME OF SHIP')) return true;
  if (v.includes('NOME DO NAVIO')) return true;
  if (v.includes('SHIP OWNER')) return true;
  if (v.includes('ARMADOR')) return true;
  if (v.includes('DATE OF MANUF')) return true;
  if (v.includes('DATA DE FABR')) return true;
  if (v.includes('DATE OF INSPECTION')) return true;
  if (v.includes('DATA DA INSPECCAO')) return true;
  if (v.includes('DATE NEXT INSPECTION')) return true;
  if (v.includes('DATA DA PROXIMA INSPECCAO')) return true;
  if (v.includes('SERIAL NO')) return true;
  if (v.includes('NO. SERIE')) return true;
  if (v === 'TYPE' || v === 'TIPO') return true;
  if (v === 'CERTIFICATE NO.' || v === 'CERTIFICADO NO.') return true;
  return false;
}

function sanitizeShipName(value) {
  const v = clean(value);
  if (!v) return '';
  if (isLikelyLabelValue(v)) return '';
  return v;
}

function sanitizeRaftSerial(value) {
  const v = clean(value);
  if (!v) return '';
  if (isLikelyLabelValue(v)) return '';
  const compact = v.replace(/[^A-Za-z0-9]/g, '');
  if (compact.length < 5) return '';
  return v;
}

function matrix(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  return rows.map((row) => row.map((cell) => clean(cell)));
}

function getCell(rows, r, c) {
  if (r < 0 || c < 0) return '';
  return rows[r]?.[c] ?? '';
}

function findLabel(rows, labels) {
  const labelsNorm = labels.map(norm);
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c += 1) {
      const current = norm(row[c]);
      if (!current) continue;
      if (labelsNorm.some((x) => current === x || current.startsWith(x))) return { r, c };
    }
  }
  return null;
}

function valueNear(rows, pos) {
  if (!pos) return '';
  const candidates = [
    getCell(rows, pos.r, pos.c + 1),
    getCell(rows, pos.r, pos.c + 2),
    getCell(rows, pos.r + 1, pos.c),
    getCell(rows, pos.r + 1, pos.c + 1),
    getCell(rows, pos.r + 1, pos.c + 2),
    getCell(rows, pos.r, pos.c + 3),
    getCell(rows, pos.r + 2, pos.c + 1),
  ];

  for (const value of candidates) {
    const v = clean(value);
    if (!v) continue;
    const upper = norm(v);
    if (upper.includes('EMERGENCY PACK TYPE')) continue;
    if (upper.includes('EQUIPAMENTO JANGADA')) continue;
    if (upper.includes('RAFT EQUIPMENT')) continue;
    if (isLikelyLabelValue(v)) continue;
    return v;
  }
  return '';
}

function isDateLike(value) {
  const v = clean(value);
  if (!v) return false;
  if (/^\d{1,2}[\/-]\d{2,4}$/.test(v)) return true;
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(v)) return true;
  if (/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\/?\d{2,4}$/i.test(v)) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
  return false;
}

function parseDateToIso(raw) {
  const value = clean(raw);
  if (!value) return '';

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    let y = dmy[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }

  const dt = new Date(value);
  if (!Number.isNaN(dt.getTime())) {
    const y = String(dt.getUTCFullYear());
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

function isNoiseItem(value) {
  const v = norm(value);
  if (!v) return true;
  if (v.length <= 2) return true;
  if (v.startsWith('QUADRO DE INSPECCAO')) return true;
  if (v.startsWith('LIFERAFT INSPECTION')) return true;
  if (v.includes('ENSAIOS DE PRESSAO')) return true;
  if (v.includes('PRESSURE TEST')) return true;
  if (v.includes('SERVICE STATION')) return true;
  if (v.includes('ESTACAO DE SERVICO')) return true;
  if (v.includes('DATA DE INSP')) return true;
  if (v.includes('INSPECTION DATE')) return true;
  if (v.includes('JANGADA - EXTERIOR')) return true;
  if (v.includes('LIFERAFT - EXTERNAL')) return true;
  if (v.includes('JANGADA - INTERIOR')) return true;
  if (v.includes('LIFERAFT - INTERNAL')) return true;
  if (v.includes('EQUIPAMENTO JANGADA')) return true;
  if (v.includes('RAFT EQUIPMENT')) return true;
  if (v.includes('EQUIP. DE EMERGENCIA')) return true;
  if (v.includes('EMERGENCY PACK')) return true;
  if (v.includes('CILINDRO CO2')) return true;
  if (v.includes('CYLINDER CO2')) return true;
  if (v.includes('CARGA CO2')) return true;
  if (v.includes('CARGA N2')) return true;
  if (v.includes('CO2 CHARGE')) return true;
  if (v.includes('N2 CHARGE')) return true;
  if (v.includes('HYD. TEST')) return true;
  if (v.includes('HYD TEST')) return true;
  if (v.includes('TESTE HID')) return true;
  if (v.includes('DATA FABRICO')) return true;
  if (v.includes('MANUF. DATE')) return true;
  if (v.includes('OREY TECNICA')) return true;
  return false;
}

function findLikelyItem(row, dateCol) {
  for (let c = dateCol - 1; c >= 0; c -= 1) {
    const value = clean(row[c]);
    if (!value) continue;
    if (isDateLike(value)) continue;
    if (/^\(?\d+\)?$/.test(value)) continue;
    if (isNoiseItem(value)) continue;
    return value;
  }
  return '';
}

function parseCertificado(rows) {
  const certNoPos = findLabel(rows, ['CERTIFICATE NO.:', 'CERTIFICADO NO.:', 'CERTIFICADO NO']);
  const shipPos = findLabel(rows, ['NAME OF SHIP:', 'NOME DO NAVIO']);
  const ownerPos = findLabel(rows, ['SHIP OWNER:', 'ARMADOR:']);
  const serialPos = findLabel(rows, ['SERIAL NO.', 'NO. SÉRIE:', 'NO. SERIE:']);
  const typePos = findLabel(rows, ['TYPE:', 'TIPO:']);
  const insPos = findLabel(rows, ['DATE OF INSPECTION:', 'DATA DA INSPECÇÃO:', 'DATA DA INSPECAO:']);
  const nextPos = findLabel(rows, ['DATE NEXT INSPECTION:', 'DATA DA PRÓXIMA INSPECÇÃO:', 'DATA DA PROXIMA INSPECAO:']);

  return {
    certNo: clean(valueNear(rows, certNoPos)),
    raftSerial: sanitizeRaftSerial(valueNear(rows, serialPos)),
    shipName: sanitizeShipName(valueNear(rows, shipPos)),
    owner: clean(valueNear(rows, ownerPos)),
    type: clean(valueNear(rows, typePos)),
    inspectionDate: parseDateToIso(valueNear(rows, insPos)),
    nextInspectionDate: parseDateToIso(valueNear(rows, nextPos)),
  };
}

function parseQuadro(rows) {
  const out = {
    raftSerial: '',
    shipName: '',
    emergencyPackType: '',
    validities: [],
  };

  const raftPos = findLabel(rows, ['JANGADA:', 'LIFERAFT:']);
  out.raftSerial = clean(valueNear(rows, raftPos));

  const shipPos = findLabel(rows, ['NAVIO:', 'SHIP:']);
  out.shipName = clean(valueNear(rows, shipPos));

  const packPos = findLabel(rows, ['EMERGENCY PACK TYPE']);
  out.emergencyPackType = clean(valueNear(rows, packPos));

  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c += 1) {
      const cell = clean(row[c]);
      if (!isDateLike(cell)) continue;

      const item = findLikelyItem(row, c);
      if (!item) continue;
      if (isNonExpiringItem(item)) continue;

      out.validities.push({ item, validade: cell, row: r + 1 });
    }
  }

  const unique = new Map();
  for (const it of out.validities) {
    const key = `${norm(it.item)}|${norm(it.validade)}`;
    if (!unique.has(key)) unique.set(key, it);
  }
  out.validities = Array.from(unique.values());

  return out;
}

function parseFile(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const certName = wb.SheetNames.find((s) => norm(s) === 'CERTIFICADO') || wb.SheetNames[0];
  const quadroName = wb.SheetNames.find((s) => norm(s) === 'QUADRO');

  const certRows = certName ? matrix(wb.Sheets[certName]) : [];
  const quadroRows = quadroName ? matrix(wb.Sheets[quadroName]) : [];

  const cert = parseCertificado(certRows);
  const quadro = quadroRows.length ? parseQuadro(quadroRows) : { raftSerial: '', shipName: '', emergencyPackType: '', validities: [] };

  const raftSerial = sanitizeRaftSerial(quadro.raftSerial || cert.raftSerial);
  const shipName = sanitizeShipName(quadro.shipName || cert.shipName) || parseFilenameShipName(path.basename(filePath));

  return {
    file: path.basename(filePath),
    certNumber: clean(cert.certNo),
    raftSerial,
    shipName,
    owner: clean(cert.owner),
    raftType: clean(cert.type),
    inspectionDate: clean(cert.inspectionDate),
    nextInspectionDate: clean(cert.nextInspectionDate),
    emergencyPackType: clean(quadro.emergencyPackType),
    validities: quadro.validities,
    hasQuadro: Boolean(quadroName),
  };
}

function csvEscape(value) {
  const text = clean(value);
  if (text.includes(';') || text.includes('"') || text.includes('\n')) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows) {
  const header = ['file', 'certNumber', 'raftSerial', 'shipName', 'owner', 'inspectionDate', 'nextInspectionDate', 'emergencyPackType', 'item', 'validade'];
  const lines = [header.join(';')];

  for (const row of rows) {
    const base = [
      row.file,
      row.certNumber,
      row.raftSerial,
      row.shipName,
      row.owner,
      row.inspectionDate,
      row.nextInspectionDate,
      row.emergencyPackType,
    ];

    if (!row.validities.length) {
      lines.push([...base, '', ''].map(csvEscape).join(';'));
      continue;
    }

    for (const v of row.validities) {
      lines.push([...base, v.item, v.validade].map(csvEscape).join(';'));
    }
  }

  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(CERT_DIR)) {
    console.error(`Pasta não encontrada: ${CERT_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CERT_DIR).filter((f) => f.toLowerCase().endsWith('.xlsx')).sort((a, b) => a.localeCompare(b));
  const extracted = files.map((f) => parseFile(path.join(CERT_DIR, f)));

  for (const row of extracted) {
    row.validities = row.validities.filter((entry) => {
      const rowText = norm((entry.item || '') + ' ' + (entry.validade || ''));
      if (!entry.item || !entry.validade) return false;
      if (isNoiseItem(entry.item)) return false;
      if (isNonExpiringItem(entry.item)) return false;
      if (rowText.includes('TESTE HID') || rowText.includes('HYD TEST')) return false;
      if (rowText.includes('DATA FABRICO') || rowText.includes('MANUF. DATE')) return false;
      if (rowText.includes('INSPECTION DATE') || rowText.includes('DATA DE INSP')) return false;
      if (rowText.includes('OREY TECNICA')) return false;
      return true;
    });
  }

  const payload = {
    timestamp: new Date().toISOString(),
    sourceDir: path.relative(ROOT, CERT_DIR),
    fileCount: files.length,
    raftsWithSerial: extracted.filter((x) => x.raftSerial).length,
    raftsWithShip: extracted.filter((x) => x.shipName).length,
    raftsWithQuadro: extracted.filter((x) => x.hasQuadro).length,
    raftsWithValidities: extracted.filter((x) => x.validities.length > 0).length,
    rows: extracted,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(OUT_CSV, toCsv(extracted), 'utf8');

  console.log('Extração 2026 concluída.');
  console.log(`Ficheiros analisados: ${payload.fileCount}`);
  console.log(`Jangadas com série: ${payload.raftsWithSerial}`);
  console.log(`Jangadas com navio: ${payload.raftsWithShip}`);
  console.log(`Com QUADRO: ${payload.raftsWithQuadro}`);
  console.log(`Com validades extraídas: ${payload.raftsWithValidities}`);
  console.log(`JSON: ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`CSV: ${path.relative(ROOT, OUT_CSV)}`);
}

main();
