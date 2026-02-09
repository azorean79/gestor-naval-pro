import { prisma } from '../src/lib/prisma';

async function main() {
  // Buscar modelos SYNTESY e CREWSAVER
  const eurovinil = await prisma.marcaJangada.findFirst({ where: { nome: 'EUROVINIL' } });
  const crewsaver = await prisma.marcaJangada.findFirst({ where: { nome: 'CREWSAVER' } });

  if (!eurovinil || !crewsaver) {
    console.log('❌ Marcas CREWSAVER ou EUROVINIL não encontradas. Execute o script de criação de marcas primeiro.');
    return;
  }

  const modelos = await prisma.modeloJangada.findMany({
    where: {
      OR: [
        { marcaId: eurovinil.id, nome: { contains: 'SYNTESY' } },
        { marcaId: crewsaver.id, nome: { contains: 'CREWSAVER' } }
      ]
    }
  });

  if (modelos.length === 0) {
    console.log('❌ Nenhum modelo SYNTESY ou CREWSAVER encontrado. Execute o script de criação de modelos primeiro.');
    return;
  }

  // Criar 8 jangadas, 4 de cada marca/modelo
  for (let i = 0; i < modelos.length; i++) {
    for (let j = 1; j <= 4; j++) {
      const numeroSerie = `${modelos[i].nome}-SN${j}`;
      const existente = await prisma.jangada.findFirst({ where: { numeroSerie } });
      if (!existente) {
        await prisma.jangada.create({
          data: {
            numeroSerie,
            modelo: { connect: { id: modelos[i].id } },
            marca: { connect: { id: modelos[i].marcaId } },
            dataFabricacao: new Date('2022-01-01'),
            tipo: 'SOLAS'
          }
        });
        console.log(`✅ Jangada criada: ${numeroSerie}`);
      } else {
        console.log(`ℹ️ Jangada já existe: ${numeroSerie}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erro:', e);
  process.exit(1);
});
