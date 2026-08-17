const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const c = await p.cliente.delete({ where: { id: 1130 } });
  console.log('Deleted:', c.id, c.nome);
  await p.$disconnect();
})();
