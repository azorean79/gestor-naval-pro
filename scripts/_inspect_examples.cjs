const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });
(async () => {
  for (const nome of ['A JULIANA', 'AGUIA']) {
    const n = await p.navio.findMany({ where: { nome: { equals: nome } }, include: { cliente: true } });
    console.log(`=== ${nome} (${n.length}) ===`);
    for (const x of n) {
      console.log(JSON.stringify({ id: x.id, matricula: x.matricula, ilha: x.ilha, portoRegisto: x.portoRegisto, tipoPesca: x.tipoPesca, clienteId: x.clienteId, cliente: x.cliente ? x.cliente.nome : null }));
    }
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
