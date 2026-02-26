const { PrismaClient } = require('@prisma/client');
const { seedLogisticaData } = require('./logistica-seed');

const prisma = new PrismaClient();

async function main() {
  console.log('🌊 Iniciando seed da logística dos Açores...');

  // Criar portos
  console.log('📍 Criando portos...');
  for (const porto of seedLogisticaData.portos) {
    const portoData = {
      ...porto,
      servicos: JSON.stringify(porto.servicos)
    };

    const existingPorto = await prisma.porto.findFirst({
      where: { nome: porto.nome }
    });

    if (existingPorto) {
      await prisma.porto.update({
        where: { id: existingPorto.id },
        data: portoData
      });
    } else {
      await prisma.porto.create({
        data: portoData
      });
    }
  }
  console.log(`✅ Criados/atualizados ${seedLogisticaData.portos.length} portos`);

  // Criar rotas
  console.log('🚢 Criando rotas de transporte...');
  for (const rota of seedLogisticaData.rotas) {
    const rotaData = {
      ...rota,
      transportadoras: JSON.stringify(rota.transportadoras)
    };

    const existingRota = await prisma.rotaTransporte.findFirst({
      where: {
        origemIlha: rota.origemIlha,
        destinoIlha: rota.destinoIlha
      }
    });

    if (existingRota) {
      await prisma.rotaTransporte.update({
        where: { id: existingRota.id },
        data: rotaData
      });
    } else {
      await prisma.rotaTransporte.create({
        data: rotaData
      });
    }
  }
  console.log(`✅ Criadas/atualizadas ${seedLogisticaData.rotas.length} rotas`);

  console.log('🎉 Seed da logística concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });