// test-prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis || global;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

async function main() {
  console.log('Testando conexão com Prisma...');

  try {
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Testar query simples
    const count = await prisma.cliente.count();
    console.log(`📊 Clientes no banco: ${count}`);

    console.log('🎉 Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();