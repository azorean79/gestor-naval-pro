const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.stock.findMany({
    where: { quantidadeMinima: { not: null } },
    select: {
      referencia: true,
      codigoFabricante: true,
      descricao: true,
      quantidade: true,
      quantidadeMinima: true,
    },
    orderBy: [{ quantidadeMinima: 'desc' }, { descricao: 'asc' }],
  });

  const lacking = rows
    .filter((r) => Number(r.quantidade || 0) < Number(r.quantidadeMinima || 0))
    .map((r) => ({
      referencia: r.referencia,
      codigoFabricante: r.codigoFabricante,
      descricao: r.descricao,
      quantidade: Number(r.quantidade || 0),
      minimo: Number(r.quantidadeMinima || 0),
      falta: Number(r.quantidadeMinima || 0) - Number(r.quantidade || 0),
    }))
    .sort((a, b) => b.falta - a.falta);

  console.log(
    JSON.stringify(
      {
        totalComMinimo: rows.length,
        abaixoMinimo: lacking.length,
        topFaltas: lacking.slice(0, 40),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
