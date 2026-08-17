const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const cliente = await p.cliente.findUnique({
    where: { id: 1130 },
    select: {
      id: true, nome: true, numeroCliente: true,
      _count: { select: { ordensServico: true, navios: true, faturas: true, agendas: true, users: true } },
    },
  });
  console.log(JSON.stringify(cliente, null, 2));
  await p.$disconnect();
})();
