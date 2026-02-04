#!/usr/bin/env node

/**
 * Script para importar armadores a partir do documento de beneficiários
 * Adiciona os nomes dos beneficiários como clientes com tipo "armador"
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
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
 * Extrai os nomes de beneficiários do PDF
 * @param {Buffer} pdfBuffer - Buffer do arquivo PDF
 * @returns {Array<string>} - Array de nomes únicos
 */
async function extrairBeneficiarios(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    const texto = data.text;
    
    // Split por linhas
    const linhas = texto.split('\n');
    
    const beneficiarios = new Set();
    let emTabela = false;
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      
      // Detectar início da tabela
      if (linha.includes('Beneficiário Nome') || linha.includes('BENEFICIÁRIO NOME')) {
        emTabela = true;
        continue;
      }
      
      // Detectar fim da tabela
      if (emTabela && (linha.includes('Página') || linha.includes('página'))) {
        break;
      }
      
      // Processar linhas da tabela
      if (emTabela && linha && !linha.includes('MAR-') && !linha.includes('Apoio') && !linha.includes('Aprovado')) {
        // Limpar a linha - remover códigos de operação e valores financeiros
        const partes = linha.split('€');
        if (partes.length > 0) {
          const nome = partes[0].trim();
          
          // Validar se é um nome válido (não contém apenas números ou caracteres especiais)
          if (nome && nome.length > 3 && !nome.match(/^\d+/) && !nome.includes('MAR-')) {
            // Remover qualquer código de operação que possa estar no início
            const nomeLimpo = nome.replace(/^.*MAR-\d+\s*/, '').trim();
            
            if (nomeLimpo && nomeLimpo.length > 3) {
              beneficiarios.add(nomeLimpo);
            }
          }
        }
      }
    }
    
    return Array.from(beneficiarios).filter(nome => nome && nome.length > 3);
  } catch (erro) {
    console.error('Erro ao extrair PDF:', erro.message);
    return [];
  }
}

/**
 * Normaliza o nome para busca
 * @param {string} nome - Nome a normalizar
 * @returns {string} - Nome normalizado
 */
function normalizarNome(nome) {
  return nome
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
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
      // Verificar se o cliente já existe (por nome ou nome normalizado)
      const nomeNormalizado = normalizarNome(nome);
      
      const clienteExistente = await prisma.cliente.findFirst({
        where: {
          nome: {
            contains: nome.split(' ')[0], // Buscar pelo primeiro nome
            mode: 'insensitive'
          }
        }
      });
      
      if (clienteExistente) {
        console.log(`⏭️  Já existe (duplicado): ${nome}`);
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
    console.log('🚀 Script de Importação de Armadores\n');
    
    // Verificar se existe arquivo PDF
    const caminhosPdf = [
      './despacho-2025-09-17.pdf',
      './scripts/despacho-2025-09-17.pdf',
      path.join(__dirname, '../despacho-2025-09-17.pdf'),
      'C:/Users/julio/Desktop/APLICACAO MASTER/LIFERAFT1.0/gestor-naval-pro/despacho-2025-09-17.pdf'
    ];
    
    let pdfBuffer = null;
    let caminhoEncontrado = null;
    
    for (const caminho of caminhosPdf) {
      if (fs.existsSync(caminho)) {
        console.log(`📄 Lendo arquivo: ${caminho}`);
        pdfBuffer = fs.readFileSync(caminho);
        caminhoEncontrado = caminho;
        break;
      }
    }
    
    if (!pdfBuffer) {
      console.log('⚠️  PDF com beneficiários não encontrado. Usando dados de exemplo...\n');
      
      // Dados de exemplo com base no PDF anexado
      const exemplos = [
        'BRUMAS DO TEMPO - PESCARAS, LDA',
        'SERGIO RICARDO PIMENTEL BOTELHO',
        'EMANUEL ANTONIO ALMEIDA MACHADO',
        'NATALIA DA CONCEIÇÃO DE MEDERIOS PONTE PACHECO',
        'ANTÔNIO MANUEL VALENTE BAGARRÃO',
        'JOÃO DE DEUS MACHADO - CABEÇA DE CASAL DA HERANÇA DE',
        'EMANUEL CANTO CORDEIRO - CABEÇA DE CASAL DA HERANÇA DE',
        'PAULO ROMEU CANTO CORDEIRO',
        'ALEXANDRE DOS SANTOS PACHECO',
        'EMANUEL CAETANO MARTINS DE OLIVEIRA',
        'JOSÉ SILVA MONIZ',
        'MILTON CESAR SILVA',
        'PAULO ANTÔNIO VIEIRA ANDRADE',
        'ABEL VITORINO SEQUEIRA DE MELO',
        'JOSÉ MANUEL VENTURA PACHECO',
        'PAULO ADRIANO DA PONTE MARTINS',
        'ALBERTO FERNANDO MONIZ DA CÂMARA ROSA',
        'SUSANA MARGARIDA DE MEDEIROS CARDOSO OLIVEIRA',
        'SÓNIA CRISTINA FERREIRA DE ALMEIDA MIGUEL',
        'ANDRÉ AGUIAR ALMEIDA'
      ];
      
      await importarArmadores(exemplos);
    } else {
      // Extrair beneficiários do PDF
      const beneficiarios = await extrairBeneficiarios(pdfBuffer);
      
      if (beneficiarios.length === 0) {
        console.log('⚠️  Nenhum beneficiário encontrado no PDF. Usando dados de exemplo...\n');
        const exemplos = [
          'BRUMAS DO TEMPO - PESCARAS, LDA',
          'SERGIO RICARDO PIMENTEL BOTELHO',
          'EMANUEL ANTONIO ALMEIDA MACHADO'
        ];
        await importarArmadores(exemplos);
      } else {
        console.log(`📋 ${beneficiarios.length} beneficiários encontrados no PDF\n`);
        await importarArmadores(beneficiarios);
      }
    }
    
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
