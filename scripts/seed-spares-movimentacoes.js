const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const spareRefs = ['RFD-BAG-001','RFD-STRAP-001','RFD-KIT-001'];
    const now = new Date();
    for (const ref of spareRefs) {
      const item = await prisma.itemStock.findUnique({ where: { numeroReferencia: ref } });
      if (!item) {
        console.log('Item not found, skipping:', ref);
        continue;
      }
      const quantidade = item.quantidade ?? item.quantidadeAtual ?? 0;
      if (quantidade <= 0) {
        console.log('No quantity to seed for:', ref);
        continue;
      }
      // create movimentacao
      const mov = await prisma.movimentacaoStock.create({
        data: {
          itemId: item.id,
          tipo: 'entrada',
          quantidade: quantidade,
          motivo: 'Seed initial stock',
          data: now,
          responsavel: 'Seed Script',
          valorUnitario: item.precoUnitario ?? 0,
          observacoes: 'Movimentação gerada pelo seed de spares'
        }
      });
      // update item quantidadeAtual and dataUltimaEntrada
      await prisma.itemStock.update({ where: { id: item.id }, data: { quantidadeAtual: quantidade, dataUltimaEntrada: now } });
      console.log('Created movimentacao for', ref, 'qty', quantidade, 'movId', mov.id);
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
