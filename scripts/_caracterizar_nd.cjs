const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const navios = await p.navio.findMany({ select: { id: true, nome: true } });
  const ids = new Set(navios.map((n) => n.id));
  const orfaos = await p.jangada.findMany({ where: { shipId: { not: null } }, select: { id: true, shipId: true } });
  const jOrf = orfaos.filter((j) => !ids.has(j.shipId));
  console.log('Jangadas orfas:', jOrf.length);

  const nd = await p.navio.findMany({
    where: { matricula: 'N/D' },
    select: { id: true, nome: true, tipoNavio: true, ilha: true, clienteId: true, cliente: { select: { nome: true } } },
  });
  const porTipo = {};
  for (const n of nd) {
    const t = n.tipoNavio || '(vazio)';
    porTipo[t] = (porTipo[t] || 0) + 1;
  }
  console.log('\n87 N/D por tipoNavio:');
  for (const [t, c] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) console.log(`  ${t}: ${c}`);

  console.log('\nLista completa (id | nome | tipoNavio | ilha | cliente):');
  for (const n of nd) console.log(`#${n.id} ${n.nome} | ${n.tipoNavio || '(vazio)'} | ${n.ilha || '(vazio)'} | ${n.cliente?.nome || '(sem cliente)'}`);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
