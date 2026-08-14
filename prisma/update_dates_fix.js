const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

function norm(value) {
  return String(value ?? '').replace(/\s+/g, '').toUpperCase();
}

function clean(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function getCell(matrix, r, c) {
  if (!matrix[r]) return undefined;
  return matrix[r][c];
}

function toMatrix(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

function excelDateToJsDate(excelSerial) {
  if (!excelSerial) return null;
  const num = Number(excelSerial);
  if (isNaN(num)) return null;
  return new Date(Math.round((num - 25569) * 86400 * 1000));
}

function parseExcelDate(val) {
  if (val === null || val === undefined || val === '') return null;
  if (!isNaN(val) && String(val).trim() !== '') {
    // If it's a 4 digit number like 2004 or 2009, it is an Excel year, not a serial date!
    const num = Number(val);
    if (num >= 1900 && num <= 2100) {
      return new Date(Date.UTC(num, 0, 1));
    }
    const d = excelDateToJsDate(val);
    if (d && !isNaN(d.getTime())) return d;
  }
  const str = String(val).trim();
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(str + 'T00:00:00.000Z');
  }
  const dmy = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, month, day));
  }
  return new Date(str);
}

function formatDateToIso(date) {
  if (!date) return '';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function findLabel(matrix, labels) {
  const normalizedLabels = labels.map(l => norm(l));
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (val !== undefined && val !== null) {
        const valNorm = norm(val);
        if (normalizedLabels.includes(valNorm)) {
          return { r, c };
        }
      }
    }
  }
  return null;
}

function isLikelyLabel(text) {
  const v = clean(text);
  if (!v) return false;
  if (v.endsWith(':')) return true;
  return false;
}

function extractValueForLabel(rows, pos) {
  if (!pos) return '';
  for (let c = pos.c + 1; c < pos.c + 10; c++) {
    const val = clean(getCell(rows, pos.r, c));
    if (val && !isLikelyLabel(val)) return val;
  }
  return '';
}

function valueNear(matrix, pos) {
  if (!pos) return null;
  const right = getCell(matrix, pos.r, pos.c + 1);
  if (right !== undefined && right !== null && String(right).trim() !== '') return right;
  const below = getCell(matrix, pos.r + 1, pos.c);
  if (below !== undefined && below !== null && String(below).trim() !== '') return below;
  return null;
}

function valueBelowSameColumn(matrix, pos, maxLookahead = 4) {
  if (!pos) return '';
  for (let i = 1; i <= maxLookahead; i++) {
    const val = getCell(matrix, pos.r + i, pos.c);
    if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
  }
  return '';
}

function parseWorkbook(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: false });
  const sheets = wb.SheetNames.map(s => s.toUpperCase());

  // Check if it's SOS (layout simplificado de 1 folha sem Quadro)
  const isSosFile = path.basename(filePath).toUpperCase().includes("SOS");

  if (sheets.includes("CERTIFICADO")) {
    const certSheetName = wb.SheetNames.find(s => norm(s) === 'CERTIFICADO');
    const certRows = toMatrix(wb.Sheets[certSheetName]);

    const certNoPos = findLabel(certRows, ['CERTIFICATE NO.:', 'CERTIFICADO NO.:', 'CERTIFICADO NO']);
    const shipPos = findLabel(certRows, ['NAME OF SHIP:', 'NOME DO NAVIO']);
    const verPos = findLabel(certRows, ['VERIFICATION:', 'VERIFICAÇÃO:']);
    const idPos = findLabel(certRows, ['IDENTIFICATION:', 'IDENTIFICAÇÃO:']);

    const certNo = certNoPos ? clean(extractValueForLabel(certRows, certNoPos)) : '';
    
    const verValRow = verPos ? verPos.r + 2 : 46;
    const rawInspectionDate = getCell(certRows, verValRow, 2);
    const rawNextInspectionDate = getCell(certRows, verValRow, 10);

    const inspectionDate = formatDateToIso(parseExcelDate(rawInspectionDate));
    const nextInspectionDate = formatDateToIso(parseExcelDate(rawNextInspectionDate));

    const idValRow = idPos ? idPos.r + 2 : 11;
    const manufDate = formatDateToIso(parseExcelDate(getCell(certRows, idValRow, 10)));

    return {
      certNo,
      inspectionDate,
      nextInspectionDate,
      manufDate,
      layout: 'CERTIFICADO'
    };
  } else if (sheets.includes("QUADRO")) {
    const certSheetName = wb.SheetNames.find(s => norm(s) === 'QUADRO');
    const certRows = toMatrix(wb.Sheets[certSheetName]);

    const certNoPos = findLabel(certRows, ['CERT. Nº', 'CERT. NO']);
    const verPos = findLabel(certRows, ['DATE OF INSPECTION:', 'INSPECTION DATE:', 'DATA DE INSP.:']);
    const idPos = findLabel(certRows, ['DATA FABRICO:', 'MANUF. DATE:']);

    const certNo = certNoPos ? clean(getCell(certRows, certNoPos.r, certNoPos.c + 1)) : '';
    
    // Na folha Quadro, a data de inspeção e fabrico estão na linha 81 e 79 do Excel (80 e 78 no parser)
    const inspectionDate = formatDateToIso(parseExcelDate(getCell(certRows, 80, 5)));
    const manufDate = formatDateToIso(parseExcelDate(getCell(certRows, 78, 6)));

    // Calcular próxima inspeção adicionando 1 ano por defeito (ou 3 se recreio/SOS)
    let nextInspectionDate = '';
    if (inspectionDate) {
      const d = new Date(inspectionDate + 'T00:00:00.000Z');
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      nextInspectionDate = formatDateToIso(d);
    }

    return {
      certNo,
      inspectionDate,
      nextInspectionDate,
      manufDate,
      layout: 'QUADRO'
    };
  }
  return null;
}

async function main() {
  console.log("=== INICIANDO AJUSTE DE DATAS FUTURAS ===");

  // Buscar todas as jangadas na BD com data de inspeção no futuro (posterior a 2026-07-07)
  const todayStr = '2026-07-07';
  const dbJangadas = await prisma.jangada.findMany({
    where: {
      OR: [
        { dataInspecao: { gt: todayStr } },
        { dataProxInspecao: { gt: '2029-12-31' } } // datas de validade extremamente longas ou incorretas
      ]
    }
  });

  console.log(`Encontradas ${dbJangadas.length} jangadas com datas futuras ou incorretas na BD.`);

  const dirs = ['D:\\CERTIFICADOS 2025', 'D:\\CERTIFICADOS 2026'];
  let correctedCount = 0;

  for (const j of dbJangadas) {
    console.log(`\nJangada ID: ${j.id}, Serial: "${j.serial}", Certificado Atual: "${j.ultimoCertificadoNumero}", Live Inspecao: "${j.dataInspecao}"`);
    
    // Tentar localizar o certificado correspondente nos diretórios
    let foundFilePath = null;
    let certNoToSearch = j.ultimoCertificadoNumero || '';

    // Se o certNo for vazio ou AUTO-..., tentar procurar pelo serial ou nome de navio
    for (const dir of dirs) {
      if (foundFilePath) break;
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir);
      // Procurar arquivo que comece com o certNo ou contenha o serial no nome
      const match = files.find(f => {
        const uFile = f.toUpperCase();
        const cleanCert = certNoToSearch.toUpperCase().trim();
        return cleanCert && (uFile.startsWith(cleanCert) || uFile.includes(cleanCert) || uFile.includes(j.serial));
      });

      if (match) {
        foundFilePath = path.join(dir, match);
      }
    }

    // Se não encontrou pelo certNo, varrer todos os arquivos Excel para ver qual deles tem o serial
    if (!foundFilePath) {
      for (const dir of dirs) {
        if (foundFilePath) break;
        if (!fs.existsSync(dir)) continue;

        const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.xlsx'));
        for (const file of files) {
          const filePath = path.join(dir, file);
          try {
            const wb = XLSX.readFile(filePath, { cellDates: false });
            const sheets = wb.SheetNames;
            let hasSerial = false;
            for (const sName of sheets) {
              const rows = toMatrix(wb.Sheets[sName]);
              const rowStr = JSON.stringify(rows);
              if (rowStr.includes(j.serial)) {
                hasSerial = true;
                break;
              }
            }
            if (hasSerial) {
              foundFilePath = filePath;
              break;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }

    if (foundFilePath) {
      console.log(`  Encontrado arquivo correspondente: "${foundFilePath}"`);
      const parsed = parseWorkbook(foundFilePath);
      if (parsed) {
        console.log(`  Dados lidos do Excel:`, parsed);
        
        // Ajustar a data de fabrico se ela tiver retornado 1905
        let dataFabr = parsed.manufDate;
        if (dataFabr && dataFabr.startsWith('1905')) {
          // Extrair o ano real do arquivo ou do campo do Excel
          // Se manufDate for 1905, era o serial do ano (ex: 2004)
          console.log(`  - Corrigindo data de fabrico inválida de 1905...`);
          // O ano 2004 deu 1905-06-25, o ano 2008 deu 1905-06-29, etc.
          // Tentar re-ler o valor original como ano
          const wb = XLSX.readFile(foundFilePath, { cellDates: false });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const certRows = toMatrix(sheet);
          const idPos = findLabel(certRows, ['IDENTIFICATION:', 'IDENTIFICAÇÃO:']);
          const idValRow = idPos ? idPos.r + 2 : 11;
          const rawManuf = getCell(certRows, idValRow, 10);
          if (rawManuf && !isNaN(rawManuf)) {
            const num = Number(rawManuf);
            if (num > 1900 && num < 2100) {
              dataFabr = `${num}-01-01`;
            }
          }
        }

        // Determinar intervalo de serviço para a próxima inspeção
        const brandNorm = (j.brand || '').toUpperCase().trim();
        const modelNorm = (j.model || '').toUpperCase().trim();
        let years = 1;
        if (modelNorm.includes("SOS") || modelNorm.includes("LEISURE") || modelNorm.includes("COASTAL") || modelNorm.includes("CRUISER") || modelNorm.includes("ISO")) {
          years = 3;
        }

        // Se a data de inspeção lida for maior que hoje, forçar a data do arquivo (que é de 2025/2026)
        let datInspecao = parsed.inspectionDate;
        if (!datInspecao || datInspecao > todayStr) {
          // Usar o ano do nome do arquivo
          const name = path.basename(foundFilePath);
          if (name.startsWith('AZ25-')) {
            datInspecao = '2025-06-01';
          } else if (name.startsWith('AZ26-')) {
            datInspecao = '2026-06-01';
          } else {
            datInspecao = '2025-06-01';
          }
        }

        const parts = datInspecao.split('-');
        let datProx = '';
        if (parts[0] && parts[0].length === 4) {
          const year = parseInt(parts[0]) + years;
          datProx = `${year}-${parts[1] || '01'}-${parts[2] || '01'}`;
        }

        console.log(`  - Atualizando BD com: Última: "${datInspecao}", Próxima: "${datProx}", Fabrico: "${dataFabr}"`);

        // Atualizar na base de dados
        await prisma.jangada.update({
          where: { id: j.id },
          data: {
            dataInspecao: datInspecao,
            dataProxInspecao: datProx,
            dataFabrico: dataFabr || undefined,
            ultimoCertificadoNumero: parsed.certNo || undefined
          }
        });

        // Atualizar as inspeções associadas
        const dbInspecao = await prisma.inspecao.findFirst({
          where: {
            jangadaId: j.id,
            certificadoNumero: parsed.certNo || undefined
          }
        });

        if (dbInspecao) {
          await prisma.inspecao.update({
            where: { id: dbInspecao.id },
            data: {
              dataInspecao: datInspecao,
              dataProxInspecao: datProx
            }
          });
        }

        correctedCount++;
      }
    } else {
      console.log(`  Ficheiro de certificado correspondente não encontrado em disco.`);
    }
  }

  console.log(`\n=== CORREÇÃO CONCLUÍDA: ${correctedCount} JANGADAS CORRIGIDAS ===`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
