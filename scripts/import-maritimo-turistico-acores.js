const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const Papa = require('papaparse');
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

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CSV_PATH = path.join(__dirname, '..', 'omt-lista-embarcacoes.csv');
const PDF_PATH = path.join(__dirname, '..', 'tmp', 'omt-lista-embarcacoes.pdf');

const embarcacoesNovas = [
  {
    nome: 'AMADEUS',
    matricula: '137097-4PT',
    lotacao: 8,
    operador: 'Aqua Açores, Turismo Aquático, Venda e Aluguer de Equipamentos, Lda.',
    tipo: 'Marítimo-Turístico',
    bandeira: 'Portugal',
  },
  {
    nome: 'OCEANUS',
    matricula: '105007-4PT',
    lotacao: 32,
    operador: '...',
    tipo: 'Marítimo-Turístico',
    bandeira: 'Portugal',
  },
  // Adiciona as restantes aqui
];

function carregarCSVSeExistir() {
  if (!fs.existsSync(CSV_PATH)) return;

  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const parsed = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  for (const row of rows) {
    const lotacaoRaw = row['LOTAÇÃO'] ?? row['LOTACAO'] ?? row['lotacao'];
    const lotacao = lotacaoRaw ? Number.parseInt(String(lotacaoRaw), 10) : null;

    embarcacoesNovas.push({
      nome: row['EMBARCAÇÃO'] ?? row['EMBARCACAO'] ?? row['nome'],
      matricula: row['REGISTO'] ?? row['MATRICULA'] ?? row['matricula'],
      lotacao: Number.isNaN(lotacao) ? null : lotacao,
      operador: row['OPERADOR'] ?? row['operador'],
      tipo: row['TIPO'] ?? row['tipo'] ?? 'Marítimo-Turístico',
      bandeira: row['BANDEIRA'] ?? row['bandeira'] ?? 'Portugal',
    });
  }
}

function isLicenseToken(token) {
  return /^\d{2}\/\d{4}$/.test(token);
}

function extractMatriculaToken(value) {
  const patterns = [
    /\b[A-Z0-9]{3,}-\dPT\b/i,
    /\b\d{4}PD\d\b/i,
    /\b\d{5,}-\dPT\b/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function parsePdfLines(lines) {
  const registros = [];
  let lastLicense = null;
  let lastOperator = null;
  let pending = null;

  for (const rawLine of lines) {
    const line = String(rawLine || '').replace(/\s+$/g, '');
    if (!line.trim()) continue;

    if (/^LICEN[ÇC]A/i.test(line) && /OPERADOR/i.test(line)) {
      continue;
    }

    const matriculaInline = extractMatriculaToken(line);
    const columns = line.split(/\s{2,}/).map((col) => col.trim()).filter(Boolean);

    if (!matriculaInline && columns.length >= 2) {
      const firstToken = columns[0].split(' ')[0];
      if (isLicenseToken(firstToken)) {
        const license = firstToken;
        const operator = columns[0].replace(firstToken, '').trim() || null;
        const vessel = columns[1] || null;
        pending = { license, operator, vessel };
        lastLicense = license;
        if (operator) lastOperator = operator;
      }
      continue;
    }

    let license = lastLicense;
    let operator = lastOperator;
    let vessel = null;
    let matricula = null;
    let lotacao = null;

    if (columns.length >= 5) {
      license = columns[0];
      operator = columns[1];
      vessel = columns[2];
      matricula = columns[3];
      lotacao = columns[4];
    } else if (columns.length === 4) {
      const firstToken = columns[0].split(' ')[0];
      if (isLicenseToken(firstToken)) {
        license = firstToken;
        operator = columns[0].replace(firstToken, '').trim();
      } else {
        operator = columns[0];
      }
      vessel = columns[1];
      matricula = columns[2];
      lotacao = columns[3];
    } else if (columns.length === 3) {
      vessel = columns[0];
      matricula = columns[1];
      lotacao = columns[2];
    }

    if (pending && matriculaInline) {
      license = pending.license || license;
      operator = pending.operator || operator;
      vessel = pending.vessel || vessel;
      matricula = matriculaInline;
      pending = null;
    }

    matricula = matricula || matriculaInline;
    if (!matricula) continue;

    const lotacaoNumber = lotacao && /^\d+$/.test(lotacao) ? Number.parseInt(lotacao, 10) : null;
    const nome = vessel ? vessel.trim() : null;
    const operador = operator ? operator.trim() : null;

    if (!nome || nome === '__') continue;

    registros.push({
      nome,
      matricula,
      lotacao: lotacaoNumber,
      operador,
    });

    if (license && isLicenseToken(license)) {
      lastLicense = license;
    }
    if (operator) {
      lastOperator = operator;
    }
  }

  return registros;
}

function carregarPDFAcoesorSeExistir() {
  if (!fs.existsSync(PDF_PATH)) return [];

  const { PDFParse } = require('pdf-parse');
  const data = fs.readFileSync(PDF_PATH);
  const parser = new PDFParse({ data, verbosity: 0 });

  return parser.getText({ pageJoiner: '\n' }).then((res) => {
    const text = res.text || res;
    const lines = String(text).split(/\r?\n/);
    return parsePdfLines(lines);
  });
}

async function importar() {
  carregarCSVSeExistir();

  const pdfRegistos = await carregarPDFAcoesorSeExistir();
  for (const registo of pdfRegistos) {
    embarcacoesNovas.push({
      nome: registo.nome,
      matricula: registo.matricula,
      lotacao: registo.lotacao,
      operador: registo.operador,
      tipo: 'Marítimo-Turístico',
      bandeira: 'Portugal',
    });
  }

  const dedup = new Map();
  for (const emb of embarcacoesNovas) {
    if (!emb?.matricula) continue;
    dedup.set(emb.matricula, emb);
  }

  const embarcacoes = Array.from(dedup.values());

  console.log(`A importar ${embarcacoes.length} embarcações marítimo-turísticas dos Açores...`);

  const clienteCache = new Map();

  for (const emb of embarcacoes) {
    try {
      let clienteId = null;
      if (emb.operador) {
        if (clienteCache.has(emb.operador)) {
          clienteId = clienteCache.get(emb.operador);
        } else {
          const clienteExistente = await prisma.cliente.findFirst({
            where: { nome: emb.operador },
            select: { id: true },
          });

          if (clienteExistente) {
            clienteId = clienteExistente.id;
          } else {
            const novoCliente = await prisma.cliente.create({
              data: {
                nome: emb.operador,
                delegacao: 'Açores',
                tecnico: 'Julio Correia',
              },
              select: { id: true },
            });
            clienteId = novoCliente.id;
          }

          clienteCache.set(emb.operador, clienteId);
        }
      }

      const existente = await prisma.navio.findFirst({
        where: { matricula: emb.matricula },
        select: { id: true },
      });

      if (existente) {
        await prisma.navio.update({
          where: { id: existente.id },
          data: {
            nome: emb.nome,
            capacidade: emb.lotacao ?? null,
            tipo: emb.tipo || 'Marítimo-Turístico',
            bandeira: emb.bandeira || 'Portugal',
            clienteId,
            delegacao: 'Açores',
          },
        });
        console.log(`Atualizada: ${emb.nome} (${emb.matricula})`);
      } else {
        await prisma.navio.create({
          data: {
            nome: emb.nome,
            matricula: emb.matricula,
            capacidade: emb.lotacao ?? null,
            tipo: emb.tipo || 'Marítimo-Turístico',
            bandeira: emb.bandeira || 'Portugal',
            status: 'ativo',
            delegacao: 'Açores',
            tecnico: 'Julio Correia',
            clienteId,
          },
        });
        console.log(`Adicionada: ${emb.nome} (${emb.matricula})`);
      }
    } catch (err) {
      console.error(`Erro ao adicionar ${emb.matricula}:`, err);
    }
  }

  console.log('Importação concluída!');
  await prisma.$disconnect();
}

importar().catch((e) => {
  console.error(e);
  process.exit(1);
});
