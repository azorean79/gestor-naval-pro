import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const pdfParse = require('pdf-parse');

const prisma = new PrismaClient();

interface ClienteOMT {
  nome: string;
  morada?: string;
  ilha?: string;
  telefone?: string;
  telmovel?: string;
  email?: string;
  nif?: string;
}

// Normaliza texto removendo acentos e convertendo para minúsculas
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Extrai dados estruturados do PDF
async function parseMoradasPDF(pdfPath: string): Promise<ClienteOMT[]> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  const text = data.text;
  
  const clientes: ClienteOMT[] = [];
  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
  
  let currentCliente: Partial<ClienteOMT> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detecta nome (geralmente em maiúsculas ou primeira linha de um bloco)
    if (line.match(/^[A-ZÁÀÂÃÉÈÊÍÌÓÒÔÕÚÙÇ\s]+$/)) {
      // Se já temos um cliente em construção, salva
      if (currentCliente.nome) {
        clientes.push(currentCliente as ClienteOMT);
      }
      currentCliente = { nome: line };
      continue;
    }
    
    // Detecta morada (geralmente começa com Rua, Avenida, etc)
    if (line.match(/^(Rua|Avenida|Av\.|R\.|Estrada|Caminho|Largo|Praça|Travessa|Canada)/i)) {
      currentCliente.morada = line;
      continue;
    }
    
    // Detecta ilha (palavras-chave conhecidas)
    if (line.match(/(São Miguel|Terceira|Faial|Pico|Graciosa|São Jorge|Santa Maria|Flores|Corvo)/i)) {
      currentCliente.ilha = line;
      continue;
    }
    
    // Detecta telefone
    if (line.match(/^(Tel|Telefone|Telf|T\.|Tlm|Telemóvel)/i)) {
      const telMatch = line.match(/(\d{3}\s?\d{3}\s?\d{3}|\d{9})/);
      if (telMatch) {
        if (line.match(/Tlm|Telemóvel/i)) {
          currentCliente.telmovel = telMatch[0].replace(/\s/g, '');
        } else {
          currentCliente.telefone = telMatch[0].replace(/\s/g, '');
        }
      }
      continue;
    }
    
    // Detecta email
    const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      currentCliente.email = emailMatch[0];
      continue;
    }
    
    // Detecta NIF
    const nifMatch = line.match(/NIF[:\s]*(\d{9})/i);
    if (nifMatch) {
      currentCliente.nif = nifMatch[1];
      continue;
    }
  }
  
  // Adiciona o último cliente
  if (currentCliente.nome) {
    clientes.push(currentCliente as ClienteOMT);
  }
  
  return clientes;
}

async function importarMoradas() {
  const pdfPath = path.join(process.cwd(), 'OMT - Moradas.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error('❌ Ficheiro "OMT - Moradas.pdf" não encontrado!');
    process.exit(1);
  }
  
  console.log('📄 A ler o PDF...');
  const clientesOMT = await parseMoradasPDF(pdfPath);
  
  console.log(`\n✅ Extraídos ${clientesOMT.length} registos do PDF\n`);
  
  let novos = 0;
  let atualizados = 0;
  let erros = 0;
  
  for (const clienteData of clientesOMT) {
    try {
      const nomeNormalizado = normalizeText(clienteData.nome);
      
      // Procura cliente existente por nome normalizado
      const existente = await prisma.cliente.findFirst({
        where: {
          OR: [
            { nome: { equals: clienteData.nome, mode: 'insensitive' } },
            { nif: clienteData.nif || undefined }
          ]
        }
      });
      
      const payload = {
        nome: clienteData.nome,
        morada: clienteData.morada || null,
        ilha: clienteData.ilha || null,
        telefone: clienteData.telefone || null,
        telmovel: clienteData.telmovel || null,
        email: clienteData.email || null,
        nif: clienteData.nif || null,
      };
      
      if (existente) {
        // Atualiza cliente existente
        await prisma.cliente.update({
          where: { id: existente.id },
          data: payload
        });
        atualizados++;
        console.log(`✏️  Atualizado: ${clienteData.nome}`);
      } else {
        // Cria novo cliente
        await prisma.cliente.create({
          data: payload
        });
        novos++;
        console.log(`➕ Adicionado: ${clienteData.nome}`);
      }
    } catch (error: any) {
      erros++;
      console.error(`❌ Erro ao processar "${clienteData.nome}":`, error.message);
    }
  }
  
  console.log('\n📊 Resumo da importação:');
  console.log(`   ➕ Novos clientes: ${novos}`);
  console.log(`   ✏️  Clientes atualizados: ${atualizados}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log(`   📋 Total processado: ${clientesOMT.length}\n`);
}

importarMoradas()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
