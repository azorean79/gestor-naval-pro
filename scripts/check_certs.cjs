const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const insp2023 = await prisma.inspecao.findMany({
    where: { certificadoNumero: { contains: 'AZ23' } },
    select: { certificadoNumero: true, dataInspecao: true },
    orderBy: { certificadoNumero: 'asc' },
  });
  console.log('AZ23 count:', insp2023.length);
  console.log('AZ23:', insp2023.map(i => i.certificadoNumero).join(', '));

  const azLatest = await prisma.inspecao.findMany({
    where: { certificadoNumero: { startsWith: 'AZ' } },
    select: { certificadoNumero: true },
    orderBy: { certificadoNumero: 'desc' },
    take: 20,
  });
  console.log('Ultimos AZ:', azLatest.map(i => i.certificadoNumero).join(', '));
}

main().catch(console.error).finally(() => prisma.$disconnect());
