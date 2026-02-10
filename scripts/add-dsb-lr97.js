
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Verificando marca DSB...');

    // Verificar se marca DSB existe
    let marca = await prisma.marca.findUnique({ where: { nome: 'DSB' } });
    let marcaId;
    if (!marca) {
      console.log('📝 Marca DSB não encontrada. Criando...');
      marca = await prisma.marca.create({ data: { nome: 'DSB' } });
      marcaId = marca.id;
      console.log('✅ Marca DSB criada!', marcaId);
    } else {
      marcaId = marca.id;
      console.log('✅ Marca DSB já existe!', marcaId);
    }

    // Verificar se modelo LR97 existe
    const modeloExistente = await prisma.modelo.findFirst({ where: { nome: 'DSB LR97', marcaId } });
    if (modeloExistente) {
      console.log('⚠️  Modelo DSB LR97 já existe');
      process.exit(0);
    }

    // Criar modelo LR97
    console.log('📝 Criando modelo DSB LR97...');
    const novoModelo = await prisma.modelo.create({
      data: {
        nome: 'DSB LR97',
        marcaId,
        ativo: true
      }
    });

    console.log('\n✅ Modelo DSB LR97 criado com sucesso!');
    console.log('   ID:', novoModelo.id);
    console.log('   Nome:', novoModelo.nome);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
