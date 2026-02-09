import { prisma } from '../src/lib/prisma';

async function main() {
  const marcas = [
    { nome: 'CREWSAVER' },
    { nome: 'EUROVINIL' }
  ];

  for (const marca of marcas) {
    const existente = await prisma.marcaJangada.findFirst({ where: { nome: marca.nome } });
    if (!existente) {
      await prisma.marcaJangada.create({ data: marca });
      console.log(`✅ Marca criada: ${marca.nome}`);
    } else {
      console.log(`ℹ️ Marca já existe: ${marca.nome}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erro:', e);
  process.exit(1);
});
