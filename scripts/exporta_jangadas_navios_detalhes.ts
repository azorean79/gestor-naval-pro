import fs from 'fs';

// Caminhos dos arquivos de origem
const reportPath = 'scripts/import_certificados_2025_report.json';
const artigosPath = 'scripts/jangadas_pack_validades_2025.json';
const outputPath = 'scripts/jangadas_navios_detalhes_completos.json';

// Carrega os dados dos arquivos
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const artigosData = JSON.parse(fs.readFileSync(artigosPath, 'utf8'));

// Cria um mapa serial -> artigos/validities
const artigosMap = new Map();
for (const row of artigosData.rows || []) {
  if (row.raftSerial && Array.isArray(row.validities)) {
    artigosMap.set(String(row.raftSerial).trim(), row.validities);
  }
}

// Monta a lista completa
const jangadasDetalhes = [];
for (const jangada of report.sample.concat(report.unresolved || [])) {
  if (!jangada.raftSerial) continue;
  const serial = String(jangada.raftSerial).trim();
  jangadasDetalhes.push({
    navio: jangada.shipName,
    serial,
    marca_modelo: jangada.brandModel,
    lotacao: jangada.capacity,
    data_fabrico: jangada.dateManuf,
    data_inspecao: jangada.inspectionDate,
    data_proxima_inspecao: jangada.nextInspectionDate,
    artigos: artigosMap.get(serial) || [],
    co2: jangada.co2Charge,
    n2: jangada.n2Charge,
    teste_hidraulico: jangada.hydTest,
    cilindro_serial: jangada.cylinderSerial,
    hru: jangada.hruValue,
    posto_servico: jangada.serviceStation,
    pack_type: jangada.emergencyPackType,
    flag: jangada.flag,
    file: jangada.file,
  });
}

fs.writeFileSync(outputPath, JSON.stringify(jangadasDetalhes, null, 2), 'utf8');
console.log('Exportação concluída:', outputPath);
