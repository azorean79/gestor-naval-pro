// test-db.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDB() {
  try {
    const clientes = await prisma.cliente.count();
    console.log('Clientes no banco:', clientes);

    const jangadas = await prisma.jangada.count();
    console.log('Jangadas no banco:', jangadas);

    const navios = await prisma.navio.count();
    console.log('Navios no banco:', navios);

    const stock = await prisma.itemStock.count();
    console.log('Itens de stock no banco:', stock);

    const cilindros = await prisma.cilindro.count();
    console.log('Cilindros no banco:', cilindros);

    console.log('✅ Banco de dados funcionando corretamente!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();