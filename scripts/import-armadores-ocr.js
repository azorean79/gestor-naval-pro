#!/usr/bin/env node

/**
 * Script para importar armadores a partir de imagem JPEG da lista de beneficiários
 * Usa OCR para extrair os nomes e os adiciona como clientes do tipo "armador"
 */

const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Configurar variáveis de ambiente
process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

// Inicializar Prisma com adapter PG
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Extrai os nomes de beneficiários da imagem JPEG usando OCR
 * @param {string} caminhoImagem - Caminho para a imagem
 * @returns {Promise<Array<string>>} - Array de nomes únicos
 */
async function extrairBeneficiariosDeImagem(caminhoImagem) {
  try {
    console.log('📸 Processando imagem com OCR...\n');
    
    const resultado = await Tesseract.recognize(
      caminhoImagem,
      'por', // Português
      { logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\r  Progresso: ${Math.round(m.progress * 100)}%`);
        }
      }}
    );
    
    console.log('\n✅ OCR concluído\n');
    
    const texto = resultado.data.text;
    
    // Split por linhas
    const linhas = texto.split('\n');
    
    const beneficiarios = new Set();
    let emTabela = false;
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      
      // Detectar início da tabela
      if (linha.includes('Beneficiário') || linha.includes('beneficiário')) {
        emTabela = true;
        continue;
      }
      
      // Detectar fim da tabela
      if (emTabela && (linha.includes('Página') || linha.includes('página') || linha === '')) {
        continue;
      }
      
      // Processar linhas da tabela
      if (emTabela && linha && !linha.includes('MAR-') && linha.length > 3) {
        // Limpar a linha - remover códigos e valores
        let nome = linha;
        
        // Remover códigos de operação no início
        nome = nome.replace(/^.*MAR-\d+\s*/, '').trim();
        
        // Remover valores financeiros e aprovação
        nome = nome.replace(/\d+[.,]\d+€?\s*(Aprovado|Rejeitado)?.*$/, '').trim();
        
        // Validar se é um nome válido
        if (nome && nome.length > 3 && !nome.match(/^\d/) && nome.length < 100) {
          beneficiarios.add(nome);
        }
      }
    }
    
    return Array.from(beneficiarios).filter(nome => nome && nome.length > 3);
  } catch (erro) {
    console.error('❌ Erro ao processar imagem:', erro.message);
    return [];
  }
}

/**
 * Importa armadores para a base de dados
 * @param {Array<string>} beneficiarios - Array de nomes de beneficiários
 */
async function importarArmadores(beneficiarios) {
  console.log(`\n📥 Iniciando importação de ${beneficiarios.length} beneficiários como armadores...\n`);
  
  let criados = 0;
  let duplicados = 0;
  let erros = 0;
  
  for (const nome of beneficiarios) {
    try {
      // Verificar se o cliente já existe
      const clienteExistente = await prisma.cliente.findFirst({
        where: {
          nome: {
            contains: nome.split(' ')[0],
            mode: 'insensitive'
          }
        }
      });
      
      if (clienteExistente) {
        console.log(`⏭️  Já existe: ${nome}`);
        duplicados++;
        continue;
      }
      
      // Criar novo cliente como armador
      const novoCliente = await prisma.cliente.create({
        data: {
          nome: nome,
          tipo: 'armador',
          delegacao: 'Açores',
          tecnico: 'Sistema Importação'
        }
      });
      
      console.log(`✅ Criado armador: ${nome}`);
      criados++;
    } catch (erro) {
      console.error(`❌ Erro ao criar ${nome}:`, erro.message);
      erros++;
    }
  }
  
  console.log(`\n📊 Resumo da Importação:`);
  console.log(`  ✅ Criados: ${criados}`);
  console.log(`  ⏭️  Duplicados: ${duplicados}`);
  console.log(`  ❌ Erros: ${erros}`);
  console.log(`  📈 Total processado: ${beneficiarios.length}`);
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Script de Importação de Armadores (OCR)\n');
    
    // Procurar por imagens JPEG
    const caminhos = [
      './despacho-2025-09-17.jpg',
      './despacho-2025-09-17.jpeg',
      './scripts/despacho-2025-09-17.jpg',
      './scripts/despacho-2025-09-17.jpeg',
      path.join(__dirname, '../despacho-2025-09-17.jpg'),
      path.join(__dirname, '../despacho-2025-09-17.jpeg'),
    ];
    
    let imagemEncontrada = null;
    
    for (const caminho of caminhos) {
      if (fs.existsSync(caminho)) {
        console.log(`📄 Imagem encontrada: ${caminho}\n`);
        imagemEncontrada = caminho;
        break;
      }
    }
    
    if (!imagemEncontrada) {
      console.log('⚠️  Nenhuma imagem encontrada. Procurando arquivos...\n');
      
      // Listar arquivos no diretório
      const arquivos = fs.readdirSync('.');
      console.log('Arquivos encontrados:');
      arquivos.forEach(arq => {
        if (arq.match(/\.(jpg|jpeg|png|gif)$/i)) {
          console.log(`  - ${arq}`);
        }
      });
      
      console.log('\n💡 Por favor, coloque a imagem da tabela de beneficiários no diretório atual com o nome: despacho-2025-09-17.jpg\n');
      process.exit(1);
    }
    
    // Extrair beneficiários da imagem
    const beneficiarios = await extrairBeneficiariosDeImagem(imagemEncontrada);
    
    if (beneficiarios.length === 0) {
      console.log('⚠️  Nenhum beneficiário encontrado na imagem.\n');
      process.exit(1);
    }
    
    console.log(`📋 ${beneficiarios.length} beneficiários encontrados:\n`);
    beneficiarios.slice(0, 10).forEach(nome => console.log(`  - ${nome}`));
    if (beneficiarios.length > 10) {
      console.log(`  ... e mais ${beneficiarios.length - 10}`);
    }
    
    await importarArmadores(beneficiarios);
    
    console.log('\n✨ Importação concluída!\n');
    
  } catch (erro) {
    console.error('❌ Erro fatal:', erro);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
main();
