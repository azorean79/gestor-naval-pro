require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('../prisma/app/generated-prisma-client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Encontrar marca DSB
    const marcaDSB = await prisma.marca.findUnique({
      where: { nome: 'DSB' }
    });

    if (!marcaDSB) {
      console.error('❌ Marca DSB não encontrada');
      process.exit(1);
    }

    console.log('✅ Marca DSB encontrada:', marcaDSB.id);

    // Verificar se modelo LR97 já existe
    const modeloExistente = await prisma.modelo.findFirst({
      where: {
        nome: 'DSB LR97',
        marcaId: marcaDSB.id
      }
    });

    if (modeloExistente) {
      console.log('⚠️  Modelo DSB LR97 já existe');
      process.exit(0);
    }

    // Criar modelo LR97
    const modeloNovo = await prisma.modelo.create({
      data: {
        nome: 'DSB LR97',
        descricao: 'Liferaft modelo LR97 da marca DSB',
        capacidade: 25,
        tipo: 'SOLAS',
        marca: {
          connect: {
            id: marcaDSB.id
          }
        },
        especificacoes: {
          create: [
            {
              nome: 'Capacidade',
              valor: '25 pessoas'
            },
            {
              nome: 'Tipo',
              valor: 'SOLAS'
            },
            {
              nome: 'Fabricante',
              valor: 'DSB'
            }
          ]
        }
      },
      include: {
        especificacoes: true
      }
    });

    console.log('✅ Modelo DSB LR97 criado com sucesso!');
    console.log('   ID:', modeloNovo.id);
    console.log('   Nome:', modeloNovo.nome);
    console.log('   Capacidade:', modeloNovo.capacidade);
    console.log('   Especificações:', modeloNovo.especificacoes.length);

  } catch (error) {
    console.error('❌ Erro ao criar modelo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
