const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNavioAPI() {
  try {
    // Pegar um navio qualquer
    const navio = await prisma.navio.findFirst({
      select: { id: true, nome: true, matricula: true }
    });
    
    if (!navio) {
      console.log('Nenhum navio encontrado no banco');
      return;
    }
    
    console.log(`Testando navio: ID ${navio.id}, Nome: ${navio.nome}`);
    console.log(`URL que deveria funcionar: http://localhost:3000/navios/${navio.id}\n`);
    
    // Simular a query da API
    const navioDetalhado = await prisma.navio.findUnique({
      where: { id: navio.id },
      select: {
        id: true,
        nome: true,
        matricula: true,
        ilha: true,
        tipoPesca: true,
        tipoNavio: true,
        proprietario: true,
        bandeira: true,
        mmsi: true,
        imo: true,
        callSignal: true,
        portoRegisto: true,
        clienteId: true,
        cliente: true,
      },
    });
    
    if (!navioDetalhado) {
      console.log('❌ API não conseguiu encontrar o navio!');
    } else {
      console.log('✅ API conseguiu encontrar o navio:');
      console.log(JSON.stringify(navioDetalhado, null, 2));
      
      // Buscar jangadas associadas
      const jangadas = await prisma.jangada.findMany({
        where: { shipId: navio.id }
      });
      
      console.log(`\n✅ Jangadas associadas: ${jangadas.length}`);
      
      // Buscar inspeções
      const inspecoes = await prisma.inspecao.findMany({
        where: {
          OR: [
            { navioId: navio.id },
            { navioNome: navioDetalhado.nome }
          ]
        },
        orderBy: { dataInspecao: 'desc' }
      });
      
      console.log(`✅ Inspeções encontradas: ${inspecoes.length}`);
    }
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testNavioAPI();
