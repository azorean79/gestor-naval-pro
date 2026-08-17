const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const n748 = await p.navio.update({ where: { id: 748 }, data: { matricula: 'H-533-L', cfr: 'PRT000024642' } });
  console.log('#748', n748.nome, '-> mat:', n748.matricula, 'cfr:', n748.cfr);

  await p.jangada.update({ where: { id: 61 }, data: { shipId: 240 } });
  await p.inspecao.update({ where: { id: 87 }, data: { navioId: 240, navioNome: 'Praia do Benjamim' } });
  await p.navio.delete({ where: { id: 782 } });
  console.log('#782 eliminado; jangada#61 e inspecao#87 -> navio #240');

  await p.jangada.update({ where: { id: 184 }, data: { shipId: 458 } });
  await p.inspecao.update({ where: { id: 219 }, data: { navioId: 458, navioNome: 'Santo Cristo I' } });
  await p.navio.delete({ where: { id: 876 } });
  console.log('#876 eliminado; jangada#184 e inspecao#219 -> navio #458');

  const nd = await p.navio.findMany({ where: { matricula: 'N/D' }, select: { id: true, nome: true } });
  console.log('\nNavios N/D restantes:', nd.length);
  for (const n of nd) console.log(`  #${n.id} ${n.nome}`);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
