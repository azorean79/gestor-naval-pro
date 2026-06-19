import prisma from '../src/lib/prisma';

/**
 * Script para procurar a válvula pelo nome ou referência parcial
 */
async function findValve() {
  try {
    console.log('🔍 Procurando válvula A8/1 ou bouyancy...');
    
    const valves = await prisma.stock.findMany({
      where: {
        OR: [
          { descricao: { contains: 'A8/1', mode: 'insensitive' } },
          { descricao: { contains: 'buoyancy', mode: 'insensitive' } },
          { descricao: { contains: 'Upper and lower', mode: 'insensitive' } },
          { referencia: { contains: '2043', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        referencia: true,
        descricao: true,
        aplicavelMarcaJangada: true,
        aplicavelModeloJangada: true
      },
      take: 20
    });

    if (valves.length === 0) {
      console.log('❌ Nenhuma válvula encontrada com esses critérios');
      return;
    }

    console.log(`✅ Encontradas ${valves.length} válvulas:`);
    valves.forEach((v, i) => {
      console.log(`\n${i + 1}. ID: ${v.id}`);
      console.log(`   Referência: ${v.referencia}`);
      console.log(`   Descrição: ${v.descricao}`);
      console.log(`   Marca: ${v.aplicavelMarcaJangada}`);
      console.log(`   Modelo(s): ${v.aplicavelModeloJangada}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

findValve();
