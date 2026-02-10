const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });


const { PrismaClient } = require('@prisma/client');


// Inicializar PrismaClient puro para ambiente local
const prisma = new PrismaClient();

const CSV_DIR = path.join(__dirname, '../OREY DIGITAL 2026/2025/IMPORT_CSVS');

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  const data = {};
  for (const line of lines) {
    const [key, value] = line.split(':');
    if (key && value !== undefined) {
      data[key.trim()] = value.replace('|', '').trim();
    }
  }
  return data;
}

async function importarEAgendar() {
  const files = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));
  let total = 0, inseridos = 0, agendados = 0, erros = 0;
  for (const file of files) {
    total++;
    const filePath = path.join(CSV_DIR, file);
    try {
      const dados = parseCSV(filePath);
      if (!dados['JANGADA'] || !dados['CERTIFICADO Nº']) {
        console.log(`❌ Dados insuficientes em ${file}`);
        erros++;
        continue;
      }
      // Cria ou encontra jangada
      let jangada = await prisma.jangada.findFirst({ where: { numeroSerie: dados['JANGADA'] } });
      if (!jangada) {
        jangada = await prisma.jangada.create({ data: {
          numeroSerie: dados['JANGADA'],
          marca: dados['MARCA/MODELO'] || 'N/A',
          capacidade: 8,
        }});
      }
      // Cria inspeção
      const inspecao = await prisma.inspecao.create({ data: {
        jangadaId: jangada.id,
        certificado: dados['CERTIFICADO Nº'],
        dataInspecao: dados['DATA INSPEÇÃO'] || null,
        dataProximaInspecao: dados['DATA PRÓXIMA INSPEÇÃO'] || null,
        responsavel: 'Automático',
      }});
      inseridos++;
      // Agendamento
      if (dados['DATA PRÓXIMA INSPEÇÃO']) {
        const data = new Date(dados['DATA PRÓXIMA INSPEÇÃO']);
        await prisma.agendamento.create({ data: {
          titulo: `Inspeção Anual - ${jangada.numeroSerie}`,
          descricao: `Inspeção anual da jangada ${jangada.numeroSerie}`,
          dataInicio: data,
          dataFim: new Date(data.getTime() + 3 * 60 * 60 * 1000),
          tipo: 'inspecao',
          status: 'agendado',
          prioridade: 'alta',
          responsavel: 'Automático',
          jangadaId: jangada.id
        }});
        agendados++;
      }
      console.log(`✅ Importado e agendado: ${file}`);
    } catch (e) {
      console.log(`❌ Erro em ${file}:`, e.message);
      erros++;
    }
  }
  console.log(`\nResumo: ${inseridos} importados, ${agendados} agendados, ${erros} erros, ${total} total.`);
  await prisma.$disconnect();
}

importarEAgendar();
