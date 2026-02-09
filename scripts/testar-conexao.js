const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testarConexao() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Falha na conexão com o banco de dados:', error.message);
  }
}

testarConexao();