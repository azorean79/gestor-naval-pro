import { prisma } from '../src/lib/prisma';

async function main() {
  // Buscar marcas
  const crewsaver = await prisma.marcaJangada.findFirst({ where: { nome: 'CREWSAVER' } });
  const eurovinil = await prisma.marcaJangada.findFirst({ where: { nome: 'EUROVINIL' } });

  if (!crewsaver || !eurovinil) {
    console.log('❌ Marcas CREWSAVER ou EUROVINIL não encontradas. Execute o script de criação de marcas primeiro.');
    return;
  }

  // Modelos a criar
  const modelos = [
    { nome: 'SYNTESY 6', marcaId: eurovinil.id },
    { nome: 'SYNTESY 8', marcaId: eurovinil.id },
    { nome: 'SYNTESY 10', marcaId: eurovinil.id },
    { nome: 'SYNTESY 12', marcaId: eurovinil.id },
    { nome: 'CREWSAVER 6', marcaId: crewsaver.id },
    { nome: 'CREWSAVER 8', marcaId: crewsaver.id },
    { nome: 'CREWSAVER 10', marcaId: crewsaver.id },
    { nome: 'CREWSAVER 12', marcaId: crewsaver.id }
  ];

  for (const modelo of modelos) {
    const existente = await prisma.modeloJangada.findFirst({
      where: { nome: modelo.nome, marcaId: modelo.marcaId }
    });
    if (!existente) {
      await prisma.modeloJangada.create({ data: modelo });
      console.log(`✅ Modelo criado: ${modelo.nome}`);
    } else {
      console.log(`ℹ️ Modelo já existe: ${modelo.nome}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erro:', e);
  process.exit(1);
});
