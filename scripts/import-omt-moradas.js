const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PDFParse } = require('pdf-parse');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient();

const PDF_PATH = path.join(__dirname, '..', 'tmp', 'omt-moradas.pdf');

function isLicenseToken(value) {
  return /^\d{2}\/\d{4}$/.test(value);
}

function parsePdfLines(lines) {
  const records = [];
  let current = null;

  for (const rawLine of lines) {
    const line = String(rawLine || '').trim();
    if (!line) continue;

    if (/^Atividade\s+Mar/i.test(line)) continue;
    if (/^LICEN[ÇC]A/i.test(line) && /OPERADOR/i.test(line)) continue;

    const postalMatch = line.match(/\b\d{4}-\d{3}\b/);
    if (postalMatch && current) {
      current.postal = line;
      records.push(current);
      current = null;
      continue;
    }

    const tokens = line.split(/\s+/);
    const first = tokens[0];
    if (isLicenseToken(first)) {
      const rest = line.replace(first, '').trim();
      const splitIndex = rest.search(/\bRua\b|\bAvenida\b|\bAv\.?\b|\bEstrada\b|\bTravessa\b|\bCanada\b|\bCal[cç]ada\b|\bLargo\b|\bPra[cç]a\b/i);
      if (splitIndex > -1) {
        const operador = rest.slice(0, splitIndex).trim();
        const morada = rest.slice(splitIndex).trim();
        current = {
          license: first,
          operador,
          morada,
          postal: null,
        };
      } else {
        current = {
          license: first,
          operador: rest.trim(),
          morada: '',
          postal: null,
        };
      }
      continue;
    }

    if (current) {
      current.morada = current.morada ? `${current.morada} ${line}` : line;
    }
  }

  return records.filter((r) => r.operador && (r.morada || r.postal));
}

async function importar() {
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`PDF não encontrado em ${PDF_PATH}`);
  }

  const data = fs.readFileSync(PDF_PATH);
  const parser = new PDFParse({ data, verbosity: 0 });
  const result = await parser.getText({ pageJoiner: '\n' });
  const text = result.text || result;
  const lines = String(text).split(/\r?\n/);

  const records = parsePdfLines(lines);
  console.log(`Registos de moradas encontrados: ${records.length}`);

  for (const rec of records) {
    const endereco = [rec.morada, rec.postal].filter(Boolean).join(', ');
    const delegacao = rec.postal ? rec.postal.replace(/^\d{4}-\d{3}\s*/, '').trim() : 'Açores';

    const clienteExistente = await prisma.cliente.findFirst({
      where: { nome: rec.operador },
      select: { id: true },
    });

    if (clienteExistente) {
      await prisma.cliente.update({
        where: { id: clienteExistente.id },
        data: {
          endereco,
          delegacao: delegacao || 'Açores',
        },
      });
      console.log(`Atualizada: ${rec.operador}`);
    } else {
      await prisma.cliente.create({
        data: {
          nome: rec.operador,
          endereco,
          delegacao: delegacao || 'Açores',
          tecnico: 'Julio Correia',
        },
      });
      console.log(`Criada: ${rec.operador}`);
    }
  }

  console.log('Atualização de moradas concluída.');
}

importar()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
