const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

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

loadEnvFile(path.join(__dirname, '..', '.env'));
loadEnvFile(path.join(__dirname, '..', '.env.local'));

process.env.DATABASE_URL = process.env.DATABASE_URL;

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL
});

const PDF_PATH = path.join(__dirname, '..', 'tmp', 'despacho-2025-09-17.pdf');

function normalizeIsland(name) {
  return name
    .replace(/\s+/g, ' ')
    .replace(/^ilha\s+/i, '')
    .trim();
}

function inferTipoByMatricula(matricula) {
  const lastChar = matricula?.slice(-1)?.toUpperCase();
  if (lastChar === 'C') return 'Pesca Costeira';
  if (lastChar === 'L') return 'Pesca Local';
  return 'Pesca';
}

function parseLines(lines) {
  const records = [];
  let ilhaAtual = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const matchIlha = line.match(/^Embarcações de pesca da ilha\s+(.+)$/i);
    if (matchIlha) {
      ilhaAtual = normalizeIsland(matchIlha[1]);
      continue;
    }

    if (/^CFR\s+Conj\.\s+Ident\.\s+Nome$/i.test(line)) {
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length < 3) continue;

    const cfr = parts[0];
    const matricula = parts[1];
    const nome = parts.slice(2).join(' ').trim();

    if (!matricula.includes('-')) continue;

    records.push({
      cfr,
      matricula,
      nome,
      ilha: ilhaAtual || 'Açores',
    });
  }

  return records;
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`PDF não encontrado em ${PDF_PATH}`);
  }

  const data = fs.readFileSync(PDF_PATH);
  const parser = new PDFParse({ data, verbosity: 0 });
  const result = await parser.getText({ pageJoiner: '\n' });
  const text = result.text || result;
  const lines = String(text).split(/\r?\n/);

  const records = parseLines(lines);
  if (!records.length) {
    console.log('Nenhum registo encontrado.');
    return;
  }

  console.log(`Registos encontrados: ${records.length}`);

  for (const rec of records) {
    const tipo = inferTipoByMatricula(rec.matricula);
    const existing = await prisma.navio.findFirst({
      where: { matricula: rec.matricula },
      select: { id: true },
    });

    if (existing) {
      await prisma.navio.update({
        where: { id: existing.id },
        data: {
          nome: rec.nome,
          tipo,
          delegacao: rec.ilha,
          bandeira: 'Portugal',
        },
      });
    } else {
      await prisma.navio.create({
        data: {
          nome: rec.nome,
          tipo,
          matricula: rec.matricula,
          bandeira: 'Portugal',
          status: 'ativo',
          delegacao: rec.ilha,
          tecnico: 'Julio Correia',
        },
      });
    }
  }

  console.log('Importação concluída com sucesso.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
