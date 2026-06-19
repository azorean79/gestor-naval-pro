// Script: exportar_jangadas_template_quadro_excel.ts
// Descrição: Para cada jangada/certificado, duplica o template 'template quadro.xls' e preenche célula a célula, gerando um ficheiro Excel com uma folha por jangada.

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const DATA_PATH = './scripts/jangadas_navios_detalhes_completos.json';
const TEMPLATE_PATH = './templates/template quadro.xlsx';
const OUTPUT_PATH = './export_jangadas_template_quadro.xlsx';

// Mapeamento dos campos para células do template (ajustar conforme o template real)
const cellMap = {
  serial: 'B2',
  navio: 'B3',
  marca_modelo: 'B4',
  lotacao: 'B5',
  data_fabrico: 'B6',
  data_inspecao: 'B7',
  data_proxima_inspecao: 'B8',
  co2: 'B9',
  n2: 'B10',
  teste_hidraulico: 'B11',
  cilindro_serial: 'B12',
  hru: 'B13',
  posto_servico: 'B14',
  pack_type: 'B15',
  flag: 'B16',
  file: 'B17',
};

async function main() {
  const jangadas = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
  const templateSheet = workbook.worksheets[0];

  jangadas.forEach((j: any, idx: number) => {
    const sheet = workbook.addWorksheet(`Quadro ${j.serial || idx + 1}`);
    templateSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        sheet.getCell(rowNumber, colNumber).value = cell.value;
        sheet.getCell(rowNumber, colNumber).style = { ...cell.style };
      });
    });
    // Preencher campos principais
    for (const [campo, cell] of Object.entries(cellMap)) {
      sheet.getCell(cell).value = j[campo] || '';
    }
    // Preencher artigos (exemplo: a partir da linha 20)
    let artigoRow = 20;
    (j.artigos || []).forEach((a: any) => {
      sheet.getCell(`A${artigoRow}`).value = a.item || a.name || '';
      sheet.getCell(`B${artigoRow}`).value = a.quantidade || '';
      sheet.getCell(`C${artigoRow}`).value = a.validade || '';
      sheet.getCell(`D${artigoRow}`).value = a.referencia || '';
      artigoRow++;
    });
  });

  // Remover a folha de template original
  workbook.removeWorksheet(templateSheet.id);
  await workbook.xlsx.writeFile(OUTPUT_PATH);
  console.log('Exportação Excel (template quadro) concluída:', OUTPUT_PATH);
}

main();
