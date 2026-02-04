const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkJangadas() {
  try {
    const count = await prisma.jangada.count();
    console.log('Total jangadas:', count);

    if (count > 0) {
      const jangadas = await prisma.jangada.findMany({
        take: 5,
        select: {
          id: true,
          numeroSerie: true,
          navio: { select: { nome: true } }
        }
      });
      console.log('Primeiras 5 jangadas:');
      jangadas.forEach(j => console.log('  -', j.numeroSerie, '->', j.navio?.nome || 'Sem navio'));
    }
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkJangadas();