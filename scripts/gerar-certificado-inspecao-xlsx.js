const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const XLSX = require('xlsx');
const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function formatMonthYear(date) {
  if (!date) return '';
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const y = d.getFullYear();
  return `${m}/${y}`;
}

function replaceAll(sheet, fromValue, toValue) {
  if (!sheet || !sheet['!ref']) return 0;
  const range = XLSX.utils.decode_range(sheet['!ref']);
  let count = 0;
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      if (cell && cell.v === fromValue) {
        cell.v = toValue;
        cell.t = typeof toValue === 'number' ? 'n' : 's';
        count++;
      }
    }
  }
  return count;
}

async function gerarCertificado() {
  console.log('📄 Gerando certificado de inspeção (XLSX)...');

  const jangada = await prisma.jangada.findFirst({
    where: { numeroSerie: { contains: 'SV-12P-2024-012' } },
    include: {
      navio: { include: { cliente: true } },
      marca: true,
      modelo: true,
      lotacao: true,
      tipoPackRef: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!jangada) {
    throw new Error('Jangada não encontrada');
  }


  const templatePath = path.join(__dirname, '..', 'public', 'templates', 'certificado-template.xlsx');
  const wb = XLSX.readFile(templatePath);

  const certNo = `AZ${String(new Date().getFullYear()).slice(2)}-${String(Date.now()).slice(-4)}`;
  const tipo = `${jangada.marca?.nome || ''} ${jangada.modelo?.nome || ''}`.trim() || 'RFD SURVIVA MKIV';
  const capacidade = jangada.capacidade || 20;
  const serial = jangada.numeroSerie;
  const dataFabricacao = formatMonthYear(jangada.dataFabricacao);

  const cilindroSerial = 'LEAF-CO2-N2-001';
  const cilindroCo2 = 8.8;
  const cilindroN2 = 0.44;
  const cilindroTeste = formatMonthYear(new Date());

  // CERTIFICADO sheet replacements
  const sheetCert = wb.Sheets['CERTIFICADO'];
  replaceAll(sheetCert, 'AZ25-214', certNo);
  replaceAll(sheetCert, 'AZ20-170', certNo);
  replaceAll(sheetCert, 'RFD SEASAVA', tipo);
  replaceAll(sheetCert, 8, capacidade);
  replaceAll(sheetCert, '5017330300074', serial);
  replaceAll(sheetCert, '09/2010', dataFabricacao);
  replaceAll(sheetCert, 'M129007', cilindroSerial);
  replaceAll(sheetCert, 2.5, cilindroCo2);
  replaceAll(sheetCert, '0,160', cilindroN2.toString().replace('.', ','));
  replaceAll(sheetCert, '10/20', cilindroTeste);

  // QUADRO sheet replacements
  const sheetQuadro = wb.Sheets['QUADRO'];
  replaceAll(sheetQuadro, 'AZ25-214', certNo);
  replaceAll(sheetQuadro, '5017330300074', serial);
  replaceAll(sheetQuadro, 'SAULO', jangada.navio?.nome || '');
  replaceAll(sheetQuadro, 'RFD SEASAVA', tipo);
  replaceAll(sheetQuadro, 8, capacidade);

  const outDir = path.join(__dirname, '..', 'tmp', 'relatorios');
  fs.mkdirSync(outDir, { recursive: true });

  const fileName = `certificado-inspecao-${jangada.numeroSerie}-${Date.now()}.xlsx`;
  const outPath = path.join(outDir, fileName);
  XLSX.writeFile(wb, outPath);

  console.log('✅ Certificado gerado:');
  console.log(outPath);
}

(async () => {
  try {
    await gerarCertificado();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
