#!/usr/bin/env node

/**
 * Script para listar todos os navios e clientes importados na base de dados
 */

require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Configurar variáveis de ambiente
const databaseUrl = process.env.PRISMA_DATABASE_URL || 
                   process.env.DIRECT_DATABASE_URL || 
                   process.env.POSTGRES_URL || 
                   process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Erro: DATABASE_URL não configurada!');
  console.error('Configure as variáveis de ambiente em .env.local');
  process.exit(1);
}

process.env.DATABASE_URL = databaseUrl;

// Inicializar Prisma
const prisma = new PrismaClient();

/**
 * Função principal para listar dados
 */
async function main() {
  try {
    console.log('🚀 Consultando Base de Dados...\n');
    console.log('═'.repeat(80));
    
    // ============================================
    // CLIENTES
    // ============================================
    console.log('\n📋 CLIENTES\n');
    const clientes = await prisma.cliente.findMany({
      include: {
        navios: true,
        jangadas: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total de Clientes: ${clientes.length}\n`);
    
    if (clientes.length > 0) {
      clientes.forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.nome}`);
        console.log(`   ID: ${cliente.id}`);
        console.log(`   Email: ${cliente.email || 'N/A'}`);
        console.log(`   Telefone: ${cliente.telefone || 'N/A'}`);
        console.log(`   Tipo: ${cliente.tipo}`);
        console.log(`   NIF: ${cliente.nif || 'N/A'}`);
        console.log(`   Delegação: ${cliente.delegacao}`);
        console.log(`   Técnico: ${cliente.tecnico}`);
        console.log(`   Navios: ${cliente.navios.length}`);
        console.log(`   Jangadas: ${cliente.jangadas.length}`);
        console.log(`   Criado em: ${new Date(cliente.createdAt).toLocaleString('pt-PT')}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  Nenhum cliente encontrado');
    }
    
    // ============================================
    // NAVIOS
    // ============================================
    console.log('\n═'.repeat(80));
    console.log('\n⛵ NAVIOS\n');
    
    const navios = await prisma.navio.findMany({
      include: {
        cliente: true,
        proprietario: true,
        certificados: true,
        jangadas: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total de Navios: ${navios.length}\n`);
    
    if (navios.length > 0) {
      navios.forEach((navio, index) => {
        console.log(`${index + 1}. ${navio.nome}`);
        console.log(`   ID: ${navio.id}`);
        console.log(`   Tipo: ${navio.tipo}`);
        console.log(`   Matrícula: ${navio.matricula || 'N/A'}`);
        console.log(`   IMO: ${navio.imo || 'N/A'}`);
        console.log(`   MMSI: ${navio.mmsi || 'N/A'}`);
        console.log(`   Call Sign: ${navio.callSign || 'N/A'}`);
        console.log(`   Bandeira: ${navio.bandeira}`);
        console.log(`   Dimensões: ${navio.comprimento}m x ${navio.largura}m x ${navio.calado}m`);
        console.log(`   Capacidade: ${navio.capacidade || 'N/A'} t`);
        console.log(`   Ano de Construção: ${navio.anoConstrucao || 'N/A'}`);
        console.log(`   Status: ${navio.status}`);
        console.log(`   Cliente: ${navio.cliente?.nome || 'N/A'}`);
        console.log(`   Proprietário: ${navio.proprietario?.nome || 'N/A'}`);
        console.log(`   Certificados: ${navio.certificados.length}`);
        console.log(`   Jangadas: ${navio.jangadas.length}`);
        console.log(`   Inspeção: ${navio.dataInspecao ? new Date(navio.dataInspecao).toLocaleDateString('pt-PT') : 'N/A'}`);
        console.log(`   Próxima Inspeção: ${navio.dataProximaInspecao ? new Date(navio.dataProximaInspecao).toLocaleDateString('pt-PT') : 'N/A'}`);
        console.log(`   Delegação: ${navio.delegacao}`);
        console.log(`   Ilha: ${navio.ilha || 'N/A'}`);
        console.log(`   Técnico: ${navio.tecnico}`);
        console.log(`   Criado em: ${new Date(navio.createdAt).toLocaleString('pt-PT')}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  Nenhum navio encontrado');
    }
    
    // ============================================
    // JANGADAS
    // ============================================
    console.log('\n═'.repeat(80));
    console.log('\n🛥️ JANGADAS\n');
    
    const jangadas = await prisma.jangada.findMany({
      include: {
        cliente: true,
        proprietario: true,
        navio: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total de Jangadas: ${jangadas.length}\n`);
    
    if (jangadas.length > 0) {
      jangadas.forEach((jangada, index) => {
        console.log(`${index + 1}. ${jangada.tipo}`);
        console.log(`   ID: ${jangada.id}`);
        console.log(`   Número de Série: ${jangada.numeroSerie}`);
        console.log(`   Tipo Pack: ${jangada.tipoPack || 'N/A'}`);
        console.log(`   Data de Fabricação: ${jangada.dataFabricacao ? new Date(jangada.dataFabricacao).toLocaleDateString('pt-PT') : 'N/A'}`);
        console.log(`   Capacidade: ${jangada.capacidade || 'N/A'} pessoas`);
        console.log(`   Peso: ${jangada.peso || 'N/A'} kg`);
        console.log(`   Dimensões: ${jangada.dimensoes || 'N/A'}`);
        console.log(`   Status: ${jangada.status}`);
        console.log(`   Estado: ${jangada.estado}`);
        console.log(`   HRU: ${jangada.hruAplicavel ? 'Sim' : 'Não'} ${jangada.hruModelo ? `(${jangada.hruModelo})` : ''}`);
        console.log(`   Cliente: ${jangada.cliente?.nome || 'N/A'}`);
        console.log(`   Proprietário: ${jangada.proprietario?.nome || 'N/A'}`);
        console.log(`   Navio: ${jangada.navio?.nome || 'N/A'}`);
        console.log(`   Próxima Inspeção: ${jangada.dataProximaInspecao ? new Date(jangada.dataProximaInspecao).toLocaleDateString('pt-PT') : 'N/A'}`);
        console.log(`   Criado em: ${new Date(jangada.createdAt).toLocaleString('pt-PT')}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  Nenhuma jangada encontrada');
    }
    
    // ============================================
    // RESUMO
    // ============================================
    console.log('\n═'.repeat(80));
    console.log('\n📊 RESUMO GERAL\n');
    console.log(`   Total de Clientes: ${clientes.length}`);
    console.log(`   Total de Navios: ${navios.length}`);
    console.log(`   Total de Jangadas: ${jangadas.length}`);
    
    const certificados = await prisma.certificado.count();
    console.log(`   Total de Certificados: ${certificados}`);
    
    console.log('\n✨ Consulta concluída!\n');
    
  } catch (erro) {
    console.error('❌ Erro ao consultar base de dados:', erro.message);
    console.error(erro);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
main();
