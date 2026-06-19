const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNavios() {
  try {
    const count = await prisma.navio.count();
    console.log(`Total de navios no banco: ${count}`);
    
    if (count > 0) {
      const primeiros5 = await prisma.navio.findMany({
        take: 5,
        select: { id: true, nome: true, matricula: true }
      });
      
      console.log('\nPrimeiros 5 navios:');
      primeiros5.forEach(n => {
        console.log(`  ID: ${n.id}, Nome: ${n.nome}, Matrícula: ${n.matricula}`);
      });
    } else {
      console.log('\n⚠️  Banco de dados está vazio!');
      console.log('Execute: node prisma/seed_navios.js');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkNavios();
