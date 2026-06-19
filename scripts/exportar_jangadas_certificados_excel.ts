// Script: exportar_jangadas_certificados_excel.ts
// Descrição: Exporta todos os dados detalhados de jangadas, certificados e inspeções para Excel, preenchendo o template.

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

type ArtigoExport = {
  item?: string;
  name?: string;
  validade?: string;
};

type JangadaExport = {
  serial?: string;
  navio?: string;
  marca_modelo?: string;
  lotacao?: number | string;
  data_fabrico?: string;
  data_inspecao?: string;
  data_proxima_inspecao?: string;
  artigos?: ArtigoExport[];
  co2?: string;
  n2?: string;
  teste_hidraulico?: string;
  cilindro_serial?: string;
  hru?: string;
  posto_servico?: string;
  pack_type?: string;
  flag?: string;
  file?: string;
};

// Caminhos dos dados e template
const DATA_PATH = './scripts/jangadas_navios_detalhes_completos.json';
const TEMPLATE_PATH = './templates/template quadro.xlsx';
const OUTPUT_PATH = './export_jangadas_certificados.xlsx';

async function main() {
  // Carregar dados
  const jangadas = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as JangadaExport[];

  // Carregar template
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
  const sheet = workbook.worksheets[0];

  // Cabeçalhos (ajustar conforme o template)
  const header = [
    'Serial', 'Navio', 'Marca/Modelo', 'Lotação', 'Data Fabrico', 'Data Inspeção', 'Data Próxima Inspeção',
    'Artigos', 'CO2', 'N2', 'Teste Hidráulico', 'Cilindro Serial', 'HRU', 'Posto Serviço', 'Pack Type', 'Flag', 'Ficheiro'
  ];
  // Escrever cabeçalho
  sheet.addRow(header);

  // Preencher linhas
  for (const j of jangadas) {
    sheet.addRow([
      j.serial, j.navio, j.marca_modelo, j.lotacao, j.data_fabrico, j.data_inspecao, j.data_proxima_inspecao,
      (j.artigos || []).map((a: ArtigoExport) => `${a.item || a.name || ''} (${a.validade || ''})`).join(', '),
      j.co2, j.n2, j.teste_hidraulico, j.cilindro_serial, j.hru, j.posto_servico, j.pack_type, j.flag, j.file
    ]);
  }

  await workbook.xlsx.writeFile(OUTPUT_PATH);
  console.log('Exportação Excel concluída:', OUTPUT_PATH);
}

main();
