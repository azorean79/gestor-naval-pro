#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function setupDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Verificando estado da base de dados...');

    // Verificar se já existem dados
    const userCount = await prisma.cliente.count();
    const navioCount = await prisma.navio.count();
    const jangadaCount = await prisma.jangada.count();

    console.log(`📊 Dados encontrados: ${userCount} clientes, ${navioCount} navios, ${jangadaCount} jangadas`);

    // Se não há dados, executar seed
    if (userCount === 0 && navioCount === 0 && jangadaCount === 0) {
      console.log('🌱 Executando seed da base de dados...');
      execSync('npm run db:seed', { stdio: 'inherit' });
      console.log('✅ Seed executado com sucesso!');
    } else {
      console.log('ℹ️ Base de dados já contém dados. Pulando seed.');
    }

  } catch (error) {
    console.error('❌ Erro ao configurar base de dados:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();