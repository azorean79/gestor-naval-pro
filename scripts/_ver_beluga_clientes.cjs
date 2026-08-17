const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const emanuel = await p.cliente.findMany({ where: { nome: { contains: 'EMANUEL' } }, select: { id: true, nome: true } });
  console.log('Clientes Emanuel:', JSON.stringify(emanuel));

  const mario = await p.cliente.findUnique({ where: { id: 744 }, select: { id: true, nome: true } });
  const naviosMario = await p.navio.findMany({ where: { clienteId: 744 }, select: { id: true, nome: true } });
  console.log('Cliente 744:', JSON.stringify(mario), 'navios:', JSON.stringify(naviosMario));

  const em = await p.cliente.findMany({ where: { nome: { contains: 'BAETA' } }, select: { id: true, nome: true } });
  console.log('Clientes Baeta:', JSON.stringify(em));
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
