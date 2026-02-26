const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const clientes = await prisma.cliente.findMany({ take: 3 });
    const navios = await prisma.navio.findMany({ take: 3 });
    const jangadas = await prisma.jangada.findMany({ take: 3 });

    console.log('Clientes existentes:', clientes.length);
    console.log('Navios existentes:', navios.length);
    console.log('Jangadas existentes:', jangadas.length);

    if (clientes.length > 0) {
      console.log('Primeiro cliente:', JSON.stringify(clientes[0], null, 2));
    }
    if (navios.length > 0) {
      console.log('Primeiro navio:', JSON.stringify(navios[0], null, 2));
    }
    if (jangadas.length > 0) {
      console.log('Primeira jangada:', JSON.stringify(jangadas[0], null, 2));
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
