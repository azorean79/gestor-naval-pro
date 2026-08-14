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
    // Fraction of a day
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

function formatPercentage(cell: ExcelJS.Cell): string {
  const val = cell.value;
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    // If it's a decimal like 0.015, convert to percentage
    if (val < 1) {
      return `${(val * 100).toFixed(1)}%`;
    }
    return `${val.toFixed(1)}%`;
  }
  return String(val).trim();
}

function parsePressureUnit(cellValue: string): string {
  const lower = cellValue.toLowerCase();
  if (lower.includes('mbar [ x ]') || lower.includes('mbar[x]')) return 'mbar';
  if (lower.includes('inh2o [ x ]') || lower.includes('inh2o[x]')) return 'inh2o';
  if (lower.includes('inhg [ x ]') || lower.includes('inhg[x]')) return 'inhg';
  return 'mbar'; // default fallback
}

// Normalized mappings with lotes and references
const ARTICLE_MAPPINGS: Array<{ 
  name: string; 
  validadeCell: string; 
  loteCell?: string; 
  refCell?: string; 
  qtyFallback?: number;
}> = [
  { name: 'Top Light and Battery', validadeCell: 'C29' },                                        // Luzes exteriores
  { name: 'Inside Light and Battery', validadeCell: 'F23', loteCell: 'I24' },                   // Bateria/Luz interior
  { name: 'Drinking Water', validadeCell: 'F63' },                                              // Água
  { name: 'Food Rations', validadeCell: 'F67' },                                                // Rações
  { name: 'First Aid Kit', validadeCell: 'J13', loteCell: 'I12', refCell: 'J12', qtyFallback: 1 }, // Farmácia
  { name: 'Seasickness Tablets', validadeCell: 'J15', loteCell: 'I14', refCell: 'J14', qtyFallback: 1 }, // Comprimidos
  { name: 'Parachute Rockets', validadeCell: 'J17', loteCell: 'I16', refCell: 'J16', qtyFallback: 2 }, // Paraquedas
  { name: 'Red Hand Flares', validadeCell: 'J19', loteCell: 'I18', refCell: 'J18', qtyFallback: 2 }, // Fachos de Mão
  { name: 'Floating Smoke Signals', validadeCell: 'J21', loteCell: 'I20', refCell: 'J20', qtyFallback: 1 }, // Potes de Fumo
  { name: 'Waterproof Torch', validadeCell: 'J23', loteCell: 'I22', refCell: 'J22', qtyFallback: 1 }, // Lanterna
  { name: 'Torch Batteries', validadeCell: 'J25', loteCell: 'I24', refCell: 'J24', qtyFallback: 4 }, // Pilhas Lanterna
];

async function processCertificate(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
  } catch (err: any) {
    console.error(`Erro ao ler arquivo ${filePath}:`, err.message);
    return;
  }

  const ws = workbook.getWorksheet('QUADRO') || workbook.worksheets[0];
  if (!ws) {
    return;
  }

  // 1. Obter metadados da jangada e certificado
  const certNumber = getCleanText(ws.getCell('H5'));
  let serial = getCleanText(ws.getCell('C7'));

  // Normalizar serial
  serial = serial.replace(/['"\s]+/g, '').toUpperCase();

  if (!serial || !certNumber) {
    return;
  }

  // Encontrar jangada correspondente na BD
  const dbJangada = await prisma.jangada.findUnique({
    where: { serial }
  });

  if (!dbJangada) {
    return;
  }

  // Encontrar inspeção correspondente na BD
  const dbInspecao = await prisma.inspecao.findUnique({
    where: { certificadoNumero: certNumber }
  });

  // 2. Extrair dados do cilindro
  const cylinderSerial = parseWeightOrText(ws.getCell('I56'));
  const cylinderPesoBruto = parseWeightOrText(ws.getCell('I58'));
  const cylinderTara = parseWeightOrText(ws.getCell('I60'));
  const cylinderCo2 = parseWeightOrText(ws.getCell('I62'));
  const cylinderN2 = parseWeightOrText(ws.getCell('I64'));
  const cylinderDataTeste = parseWeightOrText(ws.getCell('I66'));

  // 3. Extrair ensaios de pressão (WP)
  const pressureUnitRaw = getCleanText(ws.getCell('D69'));
  const testeWPUnidadePressao = parsePressureUnit(pressureUnitRaw);

  const tempIn = getCleanText(ws.getCell('H69')).replace('Cº', '').replace('º', '').trim();
  const tempOut = getCleanText(ws.getCell('J69')).replace('Cº', '').replace('º', '').trim();
  const baroIn = getCleanText(ws.getCell('H71')).toLowerCase().replace('hpa', '').trim();
  const baroOut = getCleanText(ws.getCell('J71')).toLowerCase().replace('hpa', '').trim();

  const wpStartTime = parseExcelTime(ws.getCell('C72'));
  const wpUpperStart = parseWeightOrText(ws.getCell('C73'));
  const wpUpperEnd = parseWeightOrText(ws.getCell('D73'));
  const wpUpperDrop = formatPercentage(ws.getCell('E73'));

  const wpLowerStart = parseWeightOrText(ws.getCell('C75'));
  const wpLowerEnd = parseWeightOrText(ws.getCell('D75'));
  const wpLowerDrop = formatPercentage(ws.getCell('E75'));
  
  const wpEndTime = parseExcelTime(ws.getCell('C76')) || parseExcelTime(ws.getCell('D76'));

  // 4. Extrair ensaios adicionais (NAP, FS, GI, DL)
  const napDone = getCleanText(ws.getCell('H46'));
  const napDate = getCleanText(ws.getCell('J47'));
  const fsDone = getCleanText(ws.getCell('H48'));
  const fsDate = getCleanText(ws.getCell('J49'));
  const giDone = getCleanText(ws.getCell('H50'));
  const giDate = getCleanText(ws.getCell('J51'));
  const loadDone = getCleanText(ws.getCell('H52'));
  const loadDate = getCleanText(ws.getCell('J53'));

  // 5. Atualizar registo da Jangada
  const isLatest = dbJangada.ultimoCertificadoNumero === certNumber || !dbJangada.cylinderSerial;

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
        testeNAP: napDone === 'YES' ? 'APROVOU' : (napDone === 'N/A' ? 'N/A' : undefined),
        testeFS: fsDone === 'YES' ? 'APROVOU' : (fsDone === 'N/A' ? 'N/A' : undefined),
        testeGI: giDone === 'YES' ? 'APROVOU' : (giDone === 'N/A' ? 'N/A' : undefined),
        testeDL: loadDone === 'YES' ? 'APROVOU' : (loadDone === 'N/A' ? 'N/A' : undefined),

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

  // 6. Preencher validades, lotes e referências dos artigos substituídos (ArtigoJangada)
  if (dbInspecao) {
    for (const mapping of ARTICLE_MAPPINGS) {
      const cellValidade = ws.getCell(mapping.validadeCell);
      const validadeDate = parseExcelDate(cellValidade);

      if (validadeDate) {
        const lote = mapping.loteCell ? getCleanText(ws.getCell(mapping.loteCell)) : null;
        const referencia = mapping.refCell ? getCleanText(ws.getCell(mapping.refCell)) : null;

        // Verificar se já existe esse artigo para a jangada e inspeção
        const existingArticle = await prisma.artigoJangada.findFirst({
          where: {
            jangadaId: dbJangada.id,
            inspecaoId: dbInspecao.id,
            name: mapping.name
          }
        });

        if (existingArticle) {
          // Atualiza validade, lote e referência
          await prisma.artigoJangada.update({
            where: { id: existingArticle.id },
            data: { 
              validade: validadeDate,
              codigoFabricante: lote || existingArticle.codigoFabricante,
              referencia: referencia || existingArticle.referencia
            }
          });
        } else {
          // Cria novo artigo
          await prisma.artigoJangada.create({
            data: {
              name: mapping.name,
              quantidade: mapping.qtyFallback || 1,
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
  }
}

async function main() {
  console.log("=== INICIANDO ENRIQUECIMENTO DE DADOS DOS QUADROS ===");

  const dirs = ['D:\\CERTIFICADOS 2025', 'D:\\CERTIFICADOS 2026'];

  for (const dir of dirs) {
    console.log(`Lendo diretório: ${dir}...`);
    try {
      const files = await fs.readdir(dir);
      const xlsxFiles = files.filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$'));
      
      console.log(`Encontrados ${xlsxFiles.length} arquivos excel.`);
      
      let count = 0;
      for (const file of xlsxFiles) {
        count++;
        const filePath = path.join(dir, file);
        if (count % 20 === 0 || count === xlsxFiles.length) {
          console.log(`  Processando arquivo ${count}/${xlsxFiles.length}: ${file}...`);
        }
        await processCertificate(filePath);
      }
    } catch (e: any) {
      console.error(`Erro ao ler diretório ${dir}:`, e.message);
    }
  }

  console.log("=== ENRIQUECIMENTO CONCLUÍDO COM SUCESSO ===");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Erro fatal:", e);
  await prisma.$disconnect();
  process.exit(1);
});
