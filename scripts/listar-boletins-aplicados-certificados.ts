import { prisma } from '../src/lib/prisma';

async function main() {
  // Busca todas as jangadas importadas (com certificados)
  const jangadas = await prisma.jangada.findMany({
    include: {
      marca: true,
      modelo: true,
      certificados: true,
    },
  });

  let encontrou = false;

  jangadas.forEach(j => {
    const boletinsMarca = j.marca && Array.isArray(j.marca.boletinsAplicados) ? j.marca.boletinsAplicados : [];
    const boletinsModelo = j.modelo && Array.isArray(j.modelo.boletinsAplicados) ? j.modelo.boletinsAplicados : [];
    const todosBoletins = [...boletinsMarca, ...boletinsModelo];
    if (todosBoletins.length > 0) {
      encontrou = true;
      console.log(`\nJangada: ${j.numeroSerie} | Marca: ${j.marca?.nome} | Modelo: ${j.modelo?.nome}`);
      console.log('Boletins aplicados:');
      todosBoletins.forEach(b => console.log(`- ${b}`));
    }
  });

  if (!encontrou) {
    console.log('Nenhuma jangada importada pelos certificados tem boletins aplicados.');
  }
}

main().finally(() => prisma.$disconnect());
