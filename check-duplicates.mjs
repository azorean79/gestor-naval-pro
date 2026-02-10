import { PrismaClient } from './prisma/app/generated-prisma-client/index.js';

const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    const duplicates = await prisma.$queryRaw`
      SELECT "numeroSerie", COUNT(*) as count
      FROM jangadas
      GROUP BY "numeroSerie"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    console.log('Números de série duplicados encontrados:');
    console.log(duplicates);

    if (duplicates.length === 0) {
      console.log('Nenhum número de série duplicado encontrado.');
    }
  } catch (error) {
    console.error('Erro ao verificar duplicatas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();