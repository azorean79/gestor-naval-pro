// Script: exportar_jangadas_certificados_pdf.ts
// Descrição: Exporta todos os dados detalhados de jangadas, certificados e inspeções para PDF.

import fs from 'fs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const DATA_PATH = './scripts/jangadas_navios_detalhes_completos.json';
const OUTPUT_PATH = './export_jangadas_certificados.pdf';

function formatArtigos(artigos: ArtigoExport[] = []) {
  return artigos.map((a: ArtigoExport) => `${a.item || a.name || ''} (${a.validade || ''})`).join(', ');
}

async function main() {
  const jangadas = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as JangadaExport[];
  const doc = new jsPDF({ orientation: 'landscape' });

  const header = [
    'Serial', 'Navio', 'Marca/Modelo', 'Lotação', 'Data Fabrico', 'Data Inspeção', 'Data Próxima Inspeção',
    'Artigos', 'CO2', 'N2', 'Teste Hidráulico', 'Cilindro Serial', 'HRU', 'Posto Serviço', 'Pack Type', 'Flag', 'Ficheiro'
  ];

  const rows = jangadas.map((j: JangadaExport) => [
    j.serial ?? '',
    j.navio ?? '',
    j.marca_modelo ?? '',
    j.lotacao ?? '',
    j.data_fabrico ?? '',
    j.data_inspecao ?? '',
    j.data_proxima_inspecao ?? '',
    formatArtigos(j.artigos),
    j.co2 ?? '',
    j.n2 ?? '',
    j.teste_hidraulico ?? '',
    j.cilindro_serial ?? '',
    j.hru ?? '',
    j.posto_servico ?? '',
    j.pack_type ?? '',
    j.flag ?? '',
    j.file ?? '',
  ]);

  autoTable(doc, {
    head: [header],
    body: rows,
    startY: 20,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [22, 160, 133] },
    margin: { left: 10, right: 10 },
    tableWidth: 'auto',
  });

  doc.save(OUTPUT_PATH);
  console.log('Exportação PDF concluída:', OUTPUT_PATH);
}

main();
