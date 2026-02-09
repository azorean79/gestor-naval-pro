import { prisma } from '../src/lib/prisma';

const BOLETIM = 'SB EV AT 20-01 Ver.1 APPLIED';
const MARCAS = ['Eurovinil', 'Crewsaver'];

async function main() {
  // Busca todas as jangadas importadas (com certificados)
  const jangadas = await prisma.jangada.findMany({
    include: {
      marca: true,
      modelo: true,
      certificados: true,
    },
  });

  const aplicadas = jangadas.filter(j => {
    // Verifica se a marca é Eurovinil ou Crewsaver
    const marcaOk = j.marca && MARCAS.includes(j.marca.nome);
    // Verifica se boletim está aplicado (em modelo ou marca)
    const boletimMarca = j.marca && Array.isArray(j.marca.boletinsAplicados) && j.marca.boletinsAplicados.includes(BOLETIM);
    const boletimModelo = j.modelo && Array.isArray(j.modelo.boletinsAplicados) && j.modelo.boletinsAplicados.includes(BOLETIM);
    return marcaOk && (boletimMarca || boletimModelo);
  });

  if (aplicadas.length === 0) {
    console.log('Nenhuma jangada importada pelos certificados tem o boletim aplicado.');
    return;
  }

  console.log('Jangadas importadas com boletim aplicado:');
  aplicadas.forEach(j => {
    console.log(`- Série: ${j.numeroSerie} | Marca: ${j.marca?.nome} | Modelo: ${j.modelo?.nome}`);
  });
}

main().finally(() => prisma.$disconnect());
