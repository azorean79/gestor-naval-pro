const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const isPT = (m) => /^PT/i.test(String(m || '').trim());

(async () => {
  const all = await p.navio.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true, nome: true, matricula: true, ilha: true, tipoPesca: true,
      tipoNavio: true, estadoNavio: true, clienteId: true,
    },
  });

  const jangadas = await p.jangada.findMany({ select: { shipId: true } });
  const jangadaShipIds = new Set(jangadas.map((j) => j.shipId).filter((x) => x != null));

  const naoPT = all.filter((n) => !isPT(n.matricula));
  const naoPTNaufragados = naoPT.filter((n) => (n.estadoNavio || '').toLowerCase() === 'naufragado');
  const naoPTComCliente = naoPT.filter((n) => n.clienteId != null);
  const naoPTComJangada = naoPT.filter((n) => jangadaShipIds.has(n.id));

  const keptSet = new Set();
  for (const n of naoPTNaufragados) keptSet.add(n.id);
  for (const n of naoPTComCliente) keptSet.add(n.id);
  for (const n of naoPTComJangada) keptSet.add(n.id);

  const toDelete = naoPT.filter((n) => !keptSet.has(n.id));

  console.log(`Total navios: ${all.length}`);
  console.log(`Matricula NAO comeca por PT: ${naoPT.length}`);
  console.log(`  -> naufragados (KEEP): ${naoPTNaufragados.length}`);
  console.log(`  -> com cliente (KEEP): ${naoPTComCliente.length}`);
  console.log(`  -> com jangada associada (KEEP): ${naoPTComJangada.length}`);
  console.log(`  -> A ELIMINAR: ${toDelete.length}`);

  const tipos = {};
  for (const n of toDelete) {
    const t = n.tipoPesca || '(vazio)';
    tipos[t] = (tipos[t] || 0) + 1;
  }
  console.log('\nA ELIMINAR por tipoPesca:');
  for (const [t, c] of Object.entries(tipos).sort((a, b) => b[1] - a[1])) console.log(`  ${t}: ${c}`);

  const est = {};
  for (const n of toDelete) {
    const e = n.estadoNavio || '(vazio)';
    est[e] = (est[e] || 0) + 1;
  }
  console.log('\nA ELIMINAR por estadoNavio:');
  for (const [e, c] of Object.entries(est).sort((a, b) => b[1] - a[1])) console.log(`  ${e}: ${c}`);

  console.log('\n=== KEPT (naufragado) ===');
  for (const n of naoPTNaufragados) console.log(`  #${n.id} ${n.nome} | ${n.matricula} | ${n.estadoNavio}`);

  console.log('\n=== A ELIMINAR (lista) ===');
  for (const n of toDelete) {
    const flag = [];
    if (n.clienteId != null) flag.push('cliente');
    if (jangadaShipIds.has(n.id)) flag.push('jangada');
    console.log(`  #${n.id} | ${n.nome} | ${n.matricula} | ilha=${n.ilha || ''} | tipo=${n.tipoPesca || ''} | estado=${n.estadoNavio || ''} | ${flag.join(',')}`);
  }

  const fs = require('fs');
  fs.writeFileSync('scripts/_eliminar_nao_pt_ids.json', JSON.stringify(toDelete.map((n) => n.id)));
  fs.writeFileSync('scripts/_eliminar_nao_pt_log.txt',
    toDelete.map((n) => `#${n.id} | ${n.nome} | ${n.matricula} | ilha=${n.ilha || ''} | porto= | tipo=${n.tipoPesca || ''} | estado=${n.estadoNavio || ''}`).join('\n'));

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
