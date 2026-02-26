const { PrismaClient } = require('@prisma/client');

async function main(){
  const prisma = new PrismaClient();
  try{
    const items = await prisma.itemStock.findMany({
      where: {
        OR: [
          { numeroReferencia: { startsWith: 'PN-' } },
          { categoria: 'peca' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    console.log('Found', items.length, 'mapped items (PN-* or categoria=peca)');
    for(const it of items){
      console.log(`- ${it.numeroReferencia || '-'} | ${it.codigoFabricante || '-'} | ${it.nome} | qty:${it.quantidadeAtual} | cat:${it.categoria} | created:${it.createdAt}`);
    }
  }catch(e){
    console.error(e);
  }finally{
    await prisma.$disconnect();
  }
}
main();
