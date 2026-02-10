
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Buscando marca DSB...');

    // Encontrar marca DSB
    const marca = await prisma.marca.findUnique({ where: { nome: 'DSB' } });
    if (!marca) {
      console.error('❌ Marca DSB não encontrada');
      process.exit(1);
    }
    const marcaId = marca.id;
    console.log('✅ Marca DSB encontrada, ID:', marcaId);

    // Verificar se modelo já existe
    const modeloExistente = await prisma.modelo.findFirst({ where: { nome: 'DSB LR97', marcaId } });
    if (modeloExistente) {
      console.log('⚠️  Modelo DSB LR97 já existe');
      process.exit(0);
    }

    // Inserir novo modelo
    console.log('📝 Criando modelo DSB LR97...');
    const novoModelo = await prisma.modelo.create({
      data: {
        nome: 'DSB LR97',
        descricao: 'Liferaft modelo LR97 da marca DSB',
        capacidade: 25,
        tipo: 'SOLAS',
        marcaId
      }
    });

    console.log('\n✅ Modelo DSB LR97 criado com sucesso!');
    console.log('   ID:', novoModelo.id);
    console.log('   Nome:', novoModelo.nome);
    console.log('   Capacidade:', novoModelo.capacidade);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
