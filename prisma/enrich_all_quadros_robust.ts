import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();

// Helper functions for parsing cell values
function getCleanText(cell: ExcelJS.Cell): string {
  const val = cell.value;
  if (val === null || val === undefined) return '';
  if (typeof val === 'object' && 'richText' in val) {
    return (val as any).richText.map((t: any) => t.text).join('').trim();
  }
  return String(val).trim();
}

function parseNumber(cell: ExcelJS.Cell): number | null {
  const val = cell.value;
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(',', '.').replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function parseWeightOrText(cell: ExcelJS.Cell): string | null {
  const val = cell.value;
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return String(val);
  const text = String(val).trim();
  return text || null;
}

function parseExcelTime(cell: ExcelJS.Cell): string {
  const val = cell.value;
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    const hours = String(val.getHours()).padStart(2, '0');
    const minutes = String(val.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  if (typeof val === 'number') {
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return String(val).trim();
}

function parseExcelDate(cell: ExcelJS.Cell): Date | null {
  const val = cell.value;
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val;

  const raw = String(val).trim();
  if (!raw) return null;

  // Format MM/YYYY or MM-YYYY
  const myMatch = raw.match(/^(\d{1,2})[/-](\d{4})$/);
  if (myMatch) {
    const month = parseInt(myMatch[1], 10);
    const year = parseInt(myMatch[2], 10);
    return new Date(year, month - 1, 1);
  }

  // Format MM/AA (e.g. 11/07)
  const shortMatch = raw.match(/^(\d{1,2})[/-](\d{2})$/);
  if (shortMatch) {
    const month = parseInt(shortMatch[1], 10);
    const shortYear = parseInt(shortMatch[2], 10);
    const year = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;
    return new Date(year, month - 1, 1);
  }

  // Format YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateToIso(date: Date | null): string {
  if (!date) return '';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatPercentage(cell: ExcelJS.Cell): string {
  const val = cell.value;
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    if (val < 1) return `${(val * 100).toFixed(1)}%`;
    return `${val.toFixed(1)}%`;
  }
  return String(val).trim();
}

function norm(val: any): string {
  return String(val ?? '').replace(/\s+/g, '').toUpperCase();
}

function findLabelInWorksheet(ws: ExcelJS.Worksheet, labels: string[]) {
  const normLabels = labels.map(l => norm(l));
  for (let r = 1; r <= 100; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 20; c++) {
      const val = row.getCell(c).value;
      if (val !== null && val !== undefined) {
        const valNorm = norm(val);
        if (normLabels.includes(valNorm)) {
          return { r, c };
        }
      }
    }
  }
  return null;
}

// Mapeamentos para folha QUADRO
const QUADRO_ARTICLE_MAPPINGS = [
  { name: 'Top Light and Battery', validadeCell: 'C29' },
  { name: 'Inside Light and Battery', validadeCell: 'F23', loteCell: 'I24' },
  { name: 'Drinking Water', validadeCell: 'F63' },
  { name: 'Food Rations', validadeCell: 'F67' },
  { name: 'First Aid Kit', validadeCell: 'J13', loteCell: 'I12', refCell: 'J12', qtyFallback: 1 },
  { name: 'Seasickness Tablets', validadeCell: 'J15', loteCell: 'I14', refCell: 'J14', qtyFallback: 1 },
  { name: 'Parachute Rockets', validadeCell: 'J17', loteCell: 'I16', refCell: 'J16', qtyFallback: 2 },
  { name: 'Red Hand Flares', validadeCell: 'J19', loteCell: 'I18', refCell: 'J18', qtyFallback: 2 },
  { name: 'Floating Smoke Signals', validadeCell: 'J21', loteCell: 'I20', refCell: 'J20', qtyFallback: 1 },
  { name: 'Waterproof Torch', validadeCell: 'J23', loteCell: 'I22', refCell: 'J22', qtyFallback: 1 },
  { name: 'Torch Batteries', validadeCell: 'J25', loteCell: 'I24', refCell: 'J24', qtyFallback: 4 },
];

// Mapeamentos para folha CERTIFICADO
const CERT_ARTICLE_MAPPINGS = [
  { name: 'Inside Light and Battery', validadeCell: 'I26' }, // Emergency pack expiry row 26
  { name: 'First Aid Kit', validadeCell: 'I34' }, // First aid kit row 34
];

async function processCertificateRobust(filePath: string) {
  try {
    return await _processCertificateRobustInner(filePath);
  } catch (err: any) {
    console.error(`  Erro inesperado em ${path.basename(filePath)}:`, err.message);
    return false;
  }
}

async function _processCertificateRobustInner(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
  } catch (err: any) {
    console.error(`  Erro ao abrir arquivo ${filePath}:`, err.message);
    return false;
  }

  const sheetNames = workbook.worksheets.map(w => w.name.toUpperCase());
  
  // Decidir qual folha usar - aceitar variações de nomes
  const hasQuadro = sheetNames.some(s => s === 'QUADRO');
  const hasCert = sheetNames.some(s => s === 'CERTIFICADO' || s === 'CERTIFICATE');
  
  let ws: ExcelJS.Worksheet | undefined;
  if (hasQuadro) {
    ws = workbook.getWorksheet(workbook.worksheets.find(w => w.name.toUpperCase() === 'QUADRO')!.name);
  } else if (hasCert) {
    ws = workbook.getWorksheet(workbook.worksheets.find(w => 
      w.name.toUpperCase() === 'CERTIFICADO' || w.name.toUpperCase() === 'CERTIFICATE'
    )!.name);
  } else {
    // Tentar a primeira folha se não reconhecer nenhuma
    ws = workbook.worksheets[0];
  }

  if (!ws) {
    return false;
  }

  let certNumber = '';
  let serial = '';
  let rawDate: ExcelJS.Cell | null = null;

  if (hasQuadro) {
    certNumber = getCleanText(ws.getCell('H5'));
    serial = getCleanText(ws.getCell('C7'));
    rawDate = ws.getCell('F81');
  } else {
    // Certificado ou SOS
    // Procurar por "Certificate No." ou similar
    const certPos = findLabelInWorksheet(ws, ['CertificateNo.:', 'CertificadoNo.:', 'CertificadoNo']);
    if (certPos) {
      certNumber = getCleanText(ws.getRow(certPos.r).getCell(certPos.c + 2)) || 
                   getCleanText(ws.getRow(certPos.r).getCell(certPos.c + 1)) || 
                   getCleanText(ws.getRow(certPos.r + 1).getCell(certPos.c));
    }
    if (!certNumber) {
      certNumber = path.basename(filePath).replace(/\.xlsx$/i, '').split(' ')[0];
    }

    // Procurar por "Serial No." ou "No. Série"
    const serialPos = findLabelInWorksheet(ws, ['SerialNo.', 'No.Série:', 'No.Série']);
    if (serialPos) {
      // Normalmente está 1 ou 2 linhas abaixo
      serial = getCleanText(ws.getRow(serialPos.r + 2).getCell(serialPos.c)) ||
               getCleanText(ws.getRow(serialPos.r + 1).getCell(serialPos.c)) ||
               getCleanText(ws.getRow(serialPos.r).getCell(serialPos.c + 1));
    }
    
    // Fallback para SOS se não encontrar
    if (!serial) {
      serial = getCleanText(ws.getCell('H12')) || getCleanText(ws.getCell('I12'));
    }

    rawDate = ws.getCell('C47'); // Data da inspecção
  }

  // Normalizar
  serial = serial.replace(/['"\s]+/g, '').toUpperCase();
  certNumber = certNumber.trim();

  if (!serial || !certNumber) {
    return false;
  }

  // Encontrar jangada correspondente na BD
  const dbJangada = await prisma.jangada.findUnique({
    where: { serial }
  });

  if (!dbJangada) {
    return false;
  }

  // Encontrar inspeção correspondente na BD de forma super robusta
  let dbInspecao = await prisma.inspecao.findFirst({
    where: {
      OR: [
        { certificadoNumero: certNumber },
        { certificadoNumero: certNumber.trim() },
        { certificadoNumero: path.basename(filePath).replace(/\.xlsx$/i, '').split(' ')[0] },
        {
          jangadaId: dbJangada.id,
          certificadoNumero: { contains: 'Certificado No.:' }
        }
      ]
    }
  });

  // Fallback por data se não encontrou por certificado
  if (!dbInspecao && rawDate) {
    const parsedDate = formatDateToIso(parseExcelDate(rawDate));
    if (parsedDate) {
      dbInspecao = await prisma.inspecao.findFirst({
        where: {
          jangadaId: dbJangada.id,
          dataInspecao: parsedDate
        }
      });
    }
  }

  // Se mesmo assim não encontrou, criar ou usar a inspeção mais recente da jangada
  if (!dbInspecao) {
    dbInspecao = await prisma.inspecao.findFirst({
      where: { jangadaId: dbJangada.id },
      orderBy: { dataInspecao: 'desc' }
    });
  }

  if (!dbInspecao) {
    return false;
  }

  // 1. Extração de Cilindro
  let cylinderSerial = null;
  let cylinderPesoBruto = null;
  let cylinderTara = null;
  let cylinderCo2 = null;
  let cylinderN2 = null;
  let cylinderDataTeste = null;

  if (hasQuadro) {
    cylinderSerial = parseWeightOrText(ws.getCell('I56'));
    cylinderPesoBruto = parseWeightOrText(ws.getCell('I58'));
    cylinderTara = parseWeightOrText(ws.getCell('I60'));
    cylinderCo2 = parseWeightOrText(ws.getCell('I62'));
    cylinderN2 = parseWeightOrText(ws.getCell('I64'));
    cylinderDataTeste = parseWeightOrText(ws.getCell('I66'));
  } else {
    // CERTIFICADO
    const cylPos = findLabelInWorksheet(ws, ['Cylinders:', 'Cilindros:']);
    if (cylPos) {
      const valRow = ws.getRow(cylPos.r + 2);
      cylinderSerial = parseWeightOrText(valRow.getCell(3)) || parseWeightOrText(valRow.getCell(4));
      cylinderCo2 = parseWeightOrText(valRow.getCell(6));
      cylinderN2 = parseWeightOrText(valRow.getCell(8));
      cylinderDataTeste = parseWeightOrText(valRow.getCell(10));
    }
  }

  // 2. Extração de Testes WP e Ensaios Adicionais
  let wpStartTime = '';
  let wpEndTime = '';
  let tempIn = '';
  let tempOut = '';
  let baroIn = '';
  let baroOut = '';
  let wpUpperStart = null;
  let wpUpperEnd = null;
  let wpUpperDrop = '';
  let wpLowerStart = null;
  let wpLowerEnd = null;
  let wpLowerDrop = '';
  let testeWPUnidadePressao = 'hpa';

  let napDone = '';
  let fsDone = '';
  let giDone = '';
  let loadDone = '';

  if (hasQuadro) {
    const pressureUnitRaw = getCleanText(ws.getCell('D69'));
    testeWPUnidadePressao = pressureUnitRaw.toLowerCase().includes('inh2o') ? 'inh2o' : 
                            pressureUnitRaw.toLowerCase().includes('inhg') ? 'inhg' : 'hpa';

    tempIn = getCleanText(ws.getCell('H69')).replace('Cº', '').replace('º', '').trim();
    tempOut = getCleanText(ws.getCell('J69')).replace('Cº', '').replace('º', '').trim();
    baroIn = getCleanText(ws.getCell('H71')).toLowerCase().replace('hpa', '').trim();
    baroOut = getCleanText(ws.getCell('J71')).toLowerCase().replace('hpa', '').trim();

    wpStartTime = parseExcelTime(ws.getCell('C72'));
    wpUpperStart = parseWeightOrText(ws.getCell('C73'));
    wpUpperEnd = parseWeightOrText(ws.getCell('D73'));
    wpUpperDrop = formatPercentage(ws.getCell('E73'));

    wpLowerStart = parseWeightOrText(ws.getCell('C75'));
    wpLowerEnd = parseWeightOrText(ws.getCell('D75'));
    wpLowerDrop = formatPercentage(ws.getCell('E75'));
    wpEndTime = parseExcelTime(ws.getCell('C76')) || parseExcelTime(ws.getCell('D76'));

    napDone = getCleanText(ws.getCell('H46'));
    fsDone = getCleanText(ws.getCell('H48'));
    giDone = getCleanText(ws.getCell('H50'));
    loadDone = getCleanText(ws.getCell('H52'));
  } else {
    // CERTIFICADO
    const testPos = findLabelInWorksheet(ws, ['Tests:', 'Testes:']);
    if (testPos) {
      const valRow = ws.getRow(testPos.r + 2);
      napDone = getCleanText(valRow.getCell(4)) || getCleanText(valRow.getCell(5));
      giDone = getCleanText(valRow.getCell(7)) || getCleanText(valRow.getCell(8));
      fsDone = getCleanText(valRow.getCell(9)) || getCleanText(valRow.getCell(10));
      loadDone = getCleanText(valRow.getCell(11)) || getCleanText(valRow.getCell(12));
    }
  }

  // 3. Atualizar a Jangada (se esta for a última inspeção)
  const isLatest = dbJangada.ultimoCertificadoNumero === dbInspecao.certificadoNumero || !dbJangada.cylinderSerial;

  if (isLatest) {
    await prisma.jangada.update({
      where: { id: dbJangada.id },
      data: {
        cylinderSerial: cylinderSerial || dbJangada.cylinderSerial,
        cylinderTara: cylinderTara || dbJangada.cylinderTara,
        cylinderPesoBruto: cylinderPesoBruto || dbJangada.cylinderPesoBruto,
        cylinderCo2: cylinderCo2 || dbJangada.cylinderCo2,
        cylinderN2: cylinderN2 || dbJangada.cylinderN2,
        cylinderDataTeste: cylinderDataTeste || dbJangada.cylinderDataTeste,

        testeWP: wpUpperStart ? 'APROVOU' : undefined,
        testeNAP: napDone.toUpperCase().includes('YES') ? 'APROVOU' : (napDone.toUpperCase().includes('N/A') ? 'N/A' : undefined),
        testeFS: fsDone.toUpperCase().includes('YES') ? 'APROVOU' : (fsDone.toUpperCase().includes('N/A') ? 'N/A' : undefined),
        testeGI: giDone.toUpperCase().includes('YES') ? 'APROVOU' : (giDone.toUpperCase().includes('N/A') ? 'N/A' : undefined),
        testeDL: loadDone.toUpperCase().includes('YES') ? 'APROVOU' : (loadDone.toUpperCase().includes('N/A') ? 'N/A' : undefined),

        testeWPUnidadePressao: testeWPUnidadePressao || dbJangada.testeWPUnidadePressao,
        testeWPHoraInicio: wpStartTime || dbJangada.testeWPHoraInicio,
        testeWPHoraFim: wpEndTime || dbJangada.testeWPHoraFim,
        testeWPTemperaturaInicial: tempIn || dbJangada.testeWPTemperaturaInicial,
        testeWPTemperaturaFinal: tempOut || dbJangada.testeWPTemperaturaFinal,
        testeWPPressaoAtmosfericaInicial: baroIn || dbJangada.testeWPPressaoAtmosfericaInicial,
        testeWPPressaoAtmosfericaFinal: baroOut || dbJangada.testeWPPressaoAtmosfericaFinal,

        testeWPCamaraSuperiorInicio: wpUpperStart || dbJangada.testeWPCamaraSuperiorInicio,
        testeWPCamaraSuperiorFim: wpUpperEnd || dbJangada.testeWPCamaraSuperiorFim,
        testeWPCamaraSuperiorQueda: wpUpperDrop || dbJangada.testeWPCamaraSuperiorQueda,
        testeWPCamaraInferiorInicio: wpLowerStart || dbJangada.testeWPCamaraInferiorInicio,
        testeWPCamaraInferiorFim: wpLowerEnd || dbJangada.testeWPCamaraInferiorFim,
        testeWPCamaraInferiorQueda: wpLowerDrop || dbJangada.testeWPCamaraInferiorQueda,
      }
    });
  }

  // 4. Preencher validades dos artigos na BD (ArtigoJangada)
  const mappings = hasQuadro ? QUADRO_ARTICLE_MAPPINGS : CERT_ARTICLE_MAPPINGS;

  for (const mapping of mappings) {
    const cellValidade = ws.getCell(mapping.validadeCell);
    const validadeDate = parseExcelDate(cellValidade);

    if (validadeDate) {
      const lote = (hasQuadro && mapping.loteCell) ? getCleanText(ws.getCell(mapping.loteCell)) : null;
      const referencia = (hasQuadro && mapping.refCell) ? getCleanText(ws.getCell(mapping.refCell)) : null;
      const qty = (hasQuadro && mapping.qtyFallback) ? mapping.qtyFallback : 1;

      // Verificar se já existe esse artigo para a jangada e inspeção
      const existingArticle = await prisma.artigoJangada.findFirst({
        where: {
          jangadaId: dbJangada.id,
          inspecaoId: dbInspecao.id,
          name: mapping.name
        }
      });

      if (existingArticle) {
        await prisma.artigoJangada.update({
          where: { id: existingArticle.id },
          data: { 
            validade: validadeDate,
            codigoFabricante: lote || existingArticle.codigoFabricante,
            referencia: referencia || existingArticle.referencia
          }
        });
      } else {
        await prisma.artigoJangada.create({
          data: {
            name: mapping.name,
            quantidade: qty,
            validade: validadeDate,
            codigoFabricante: lote,
            referencia: referencia,
            jangadaId: dbJangada.id,
            inspecaoId: dbInspecao.id
          }
        });
      }
    }
  }

  return true;
}

async function main() {
  console.log("=== INICIANDO ENRIQUECIMENTO DEFINTIVO E ROBUSTO (2025 E 2026) ===");

  const dirs = ['D:\\CERTIFICADOS 2025', 'D:\\CERTIFICADOS 2026'];
  let totalProcessed = 0;

  for (const dir of dirs) {
    console.log(`Lendo diretório: ${dir}...`);
    try {
      const files = await fs.readdir(dir);
      const xlsxFiles = files.filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$'));
      
      console.log(`Encontrados ${xlsxFiles.length} arquivos excel.`);
      
      let count = 0;
      let matchedCount = 0;
      for (const file of xlsxFiles) {
        count++;
        const filePath = path.join(dir, file);
        const ok = await processCertificateRobust(filePath);
        if (ok) matchedCount++;
        
        if (count % 30 === 0 || count === xlsxFiles.length) {
          console.log(`  Progresso ${dir}: ${count}/${xlsxFiles.length} arquivos analisados. Correspondidos com sucesso: ${matchedCount}`);
        }
      }
      totalProcessed += matchedCount;
    } catch (e: any) {
      console.error(`Erro ao ler diretório ${dir}:`, e.message);
    }
  }

  console.log(`\n=== ENRIQUECIMENTO CONCLUÍDO: ${totalProcessed} INSPEÇÕES ENRIQUECIDAS COM SUCESSO ===`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Erro fatal no enriquecimento:", e);
  await prisma.$disconnect();
  process.exit(1);
});
