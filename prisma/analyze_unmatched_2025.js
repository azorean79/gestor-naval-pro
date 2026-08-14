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

function parseExcelDate(val) {
  if (val === null || val === undefined || val === '') return null;
  if (!isNaN(val) && String(val).trim() !== '') {
    const num = Number(val);
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (d && !isNaN(d.getTime())) return d;
  }
  return new Date(String(val).trim());
}

function formatDateToIso(date) {
  if (!date) return '';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function main() {
  console.log("=== ANALISANDO CERTIFICADOS DE 2025 NA BD ===");
  
  const dir = 'D:\\CERTIFICADOS 2025';
  if (!fs.existsSync(dir)) {
    console.error(`Diretório ${dir} não existe!`);
    await prisma.$disconnect();
    return;
  }

  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$'));
  console.log(`Encontrados ${files.length} ficheiros no directório de 2025.`);

  let noJangadaCount = 0;
  let noInspecaoCount = 0;
  let matchCount = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    
    let wb;
    try {
      wb = XLSX.readFile(filePath, { cellDates: false });
    } catch (e) {
      console.log(`Erro ao ler ${file}:`, e.message);
      continue;
    }

    const sheetNames = wb.SheetNames.map(s => s.toUpperCase());
    let serial = '';
    let certNo = '';
    let rawDate = null;

    if (sheetNames.includes("QUADRO")) {
      const qSheet = wb.Sheets[wb.SheetNames.find(s => norm(s) === 'QUADRO')];
      const qRows = XLSX.utils.sheet_to_json(qSheet, { header: 1 });
      
      serial = clean(qRows[6]?.[2]); // C7
      certNo = clean(qRows[4]?.[7]); // H5
      rawDate = qRows[80]?.[5]; // F81
    } else if (sheetNames.includes("CERTIFICADO")) {
      const cSheet = wb.Sheets[wb.SheetNames.find(s => norm(s) === 'CERTIFICADO')];
      const cRows = XLSX.utils.sheet_to_json(cSheet, { header: 1 });
      
      serial = clean(cRows[11]?.[2] || cRows[11]?.[3]); 
      certNo = clean(cRows[4]?.[7]);
      rawDate = cRows[46]?.[2];
    } else {
      // SOS ou outro layout de aba única
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      serial = clean(rows[11]?.[7] || rows[11]?.[8]); // H12/I12
      certNo = file.replace(/\.xlsx$/i, '').split(' ')[0];
    }

    const normSerial = serial.replace(/['"\s]+/g, '').toUpperCase();
    if (!normSerial) {
      console.log(`Ficheiro "${file}": Não conseguiu ler o serial.`);
      continue;
    }

    // Buscar jangada correspondente na BD
    const dbJangada = await prisma.jangada.findUnique({
      where: { serial: normSerial }
    });

    if (!dbJangada) {
      noJangadaCount++;
      console.log(`Ficheiro "${file}": Jangada com serial "${normSerial}" não encontrada na BD.`);
      continue;
    }

    // Buscar inspeção correspondente na BD
    // Tentar por certNo exato, certNo limpo, ou pela balsa + data aproximada
    let dbInspecao = await prisma.inspecao.findFirst({
      where: {
        OR: [
          { certificadoNumero: certNo },
          { certificadoNumero: certNo.trim() },
          { certificadoNumero: file.replace(/\.xlsx$/i, '').split(' ')[0] },
          {
            jangadaId: dbJangada.id,
            certificadoNumero: { contains: 'Certificado No.:' } // lido errado anteriormente
          }
        ]
      }
    });

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

    if (!dbInspecao) {
      noInspecaoCount++;
      console.log(`Ficheiro "${file}": Jangada "${normSerial}" OK, mas inspeção correspondente (Certificado: "${certNo}") NÃO encontrada.`);
      
      // Mostrar inspeções que esta balsa tem no banco para depurar
      const existing = await prisma.inspecao.findMany({ where: { jangadaId: dbJangada.id } });
      console.log(`  Inspeções na BD para esta jangada:`, existing.map(e => ({ id: e.id, cert: e.certificadoNumero, data: e.dataInspecao })));
      continue;
    }

    matchCount++;
  }

  console.log(`\n=== RESULTADO DA ANÁLISE ===`);
  console.log(`Jangadas Encontradas e Correspondidas com Inspeções: ${matchCount}`);
  console.log(`Jangadas Não Encontradas na BD por Serial: ${noJangadaCount}`);
  console.log(`Inspeções Não Encontradas na BD para Jangada Existente: ${noInspecaoCount}`);

  await prisma.$disconnect();
}

main();
