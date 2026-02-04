const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { withAccelerate } = require('@prisma/extension-accelerate');

// Configurar Prisma Accelerate
const ACCELERATE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19vUGw0S2F4emFsSDVUa2prLUpVTDQiLCJhcGlfa2V5IjoiMDFLR0o4TjBSVzRLSzZKRTZEMkhWTjRCRzUiLCJ0ZW5hbnRfaWQiOiI2Y2Y2ODlmZGI4MzkzODViYmI0ZDI1MzNlYTg3YzBjZDFkYjU4ZTNkYmI0ZjdkNDE5MzQ1Y2VjZDBjOTMyN2U0IiwiaW50ZXJuYWxfc2VjcmV0IjoiNDVmNzI2ZjItZDQ2YS00ODNjLWIyZjgtOGYyNTk3MzVhM2I5In0.S3sEic1XPPYbZwcQ1Od0TW63XHlsnWAPwPBjWvp-W7Q";

const prisma = new PrismaClient({
  accelerateUrl: ACCELERATE_URL,
}).$extends(withAccelerate());

const PDF_PATH = path.join(__dirname, '..', 'tmp', 'despacho-2025-09-17.pdf');

function normalizeIsland(name) {
  return name
    .replace(/\s+/g, ' ')
    .replace(/^ilha\s+/i, '')
    .trim();
}

function inferTipoByMatricula(matricula) {
  const lastChar = matricula?.slice(-1)?.toUpperCase();
  if (lastChar === 'C') return 'pesca-costeiro';
  if (lastChar === 'L') return 'pesca-local';
  return 'pesca-alto-mar';
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
  console.log('🚢 Iniciando importação de embarcações de pesca...');

  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`PDF não encontrado em ${PDF_PATH}`);
  }

  const data = fs.readFileSync(PDF_PATH);
  const result = await pdfParse(data);
  const text = result.text;

  const lines = text.split('\n');
  const records = parseLines(lines);

  console.log(`📄 Encontrados ${records.length} registros no PDF`);

  let importados = 0;
  let erros = 0;

  for (const record of records) {
    try {
      // Primeiro, tentar encontrar um cliente existente com base no CFR ou nome
      let cliente = await prisma.cliente.findFirst({
        where: {
          OR: [
            { nif: record.cfr },
            { nome: { contains: record.nome.split(' ')[0] } }
          ]
        }
      });

      // Se não encontrar cliente, criar um novo
      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            nome: record.nome,
            nif: record.cfr,
            tipo: 'armador',
            delegacao: record.ilha,
            tecnico: 'Julio Correia',
          }
        });
        console.log(`✅ Criado cliente: ${cliente.nome}`);
      }

      // Verificar se o navio já existe
      const navioExistente = await prisma.navio.findFirst({
        where: { matricula: record.matricula }
      });

      if (navioExistente) {
        console.log(`⚠️  Navio já existe: ${record.matricula} - ${record.nome}`);
        continue;
      }

      // Criar o navio
      const navio = await prisma.navio.create({
        data: {
          nome: record.nome,
          matricula: record.matricula,
          tipo: inferTipoByMatricula(record.matricula),
          bandeira: 'Portugal',
          status: 'ativo',
          clienteId: cliente.id,
          delegacao: record.ilha,
          tecnico: 'Julio Correia',
        }
      });

      console.log(`🚢 Criado navio: ${navio.nome} (${navio.matricula})`);
      importados++;

    } catch (error) {
      console.error(`❌ Erro ao importar ${record.matricula}:`, error.message);
      erros++;
    }
  }

  console.log(`\n🎉 Importação concluída!`);
  console.log(`✅ Navios importados: ${importados}`);
  console.log(`❌ Erros: ${erros}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });