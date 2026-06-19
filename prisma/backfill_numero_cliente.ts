import prisma from '../src/database';

function formatNumeroCliente(id: number) {
  return `CLI-${String(id).padStart(5, '0')}`;
}

async function main() {
  const clientes = await prisma.cliente.findMany({
    select: { id: true, numeroCliente: true },
    orderBy: { id: 'asc' }
  });

  type ClienteSemNumero = { id: number; numeroCliente: string | null };

  const semNumero = (clientes as ClienteSemNumero[]).filter((cliente: ClienteSemNumero) => !cliente.numeroCliente || !cliente.numeroCliente.trim());

  for (const cliente of semNumero) {
    const numeroCliente = formatNumeroCliente(cliente.id);
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { numeroCliente }
    });
  }

  const total = clientes.length;
  const atualizados = semNumero.length;

  console.log(`Total de clientes: ${total}`);
  console.log(`Clientes atualizados com numeroCliente: ${atualizados}`);

  const restantesSemNumero = await prisma.cliente.count({
    where: {
      OR: [
        { numeroCliente: null },
        { numeroCliente: '' }
      ]
    }
  });

  console.log(`Clientes restantes sem numeroCliente: ${restantesSemNumero}`);
}

main()
  .catch((error) => {
    console.error('Erro no backfill de numeroCliente:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
