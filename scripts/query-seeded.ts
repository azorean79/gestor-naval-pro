import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const parts = await prisma.itemStock.findMany({
    where: { numeroReferencia: { startsWith: 'PN-' } },
    orderBy: { createdAt: 'desc' },
  });
  console.log('PN-* items:', parts.map(p => ({ numeroReferencia: p.numeroReferencia, nome: p.nome, id: p.id })));

  const jangadas = await prisma.jangada.findMany({
    where: { numeroReferencia: { contains: 'RFD-SURVIVA' } },
  });
  console.log('Surviva jangadas:', jangadas.map(j => ({ id: j.id, numeroReferencia: j.numeroReferencia, nome: j.nome })));

  const inspecoes = await prisma.inspecao.findMany({
    where: { tipoInspecao: 'rfd-surviva-sample' },
  });
  console.log('Sample inspeções count:', inspecoes.length);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
