const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const isPT = (m) => /^PT/i.test(String(m || '').trim());

(async () => {
  const all = await p.navio.findMany({ select: { id: true, nome: true, matricula: true, cfr: true, estadoNavio: true, clienteId: true } });
  const jangadas = await p.jangada.findMany({ select: { shipId: true } });
  const jangadaShipIds = new Set(jangadas.map((j) => j.shipId).filter((x) => x != null));

  const naoPT = all.filter((n) => !isPT(n.matricula));
  const viola = naoPT.filter((n) =>
    (n.estadoNavio || '').toLowerCase() !== 'naufragado' &&
    n.clienteId == null &&
    !jangadaShipIds.has(n.id)
  );

  console.log('Total navios:', all.length);
  console.log('Matricula comeca por PT:', all.length - naoPT.length);
  console.log('NAO-PT (deveriam ser naufragado/cliente/jangada):', naoPT.length);
  console.log('NAO-PT que violam os criterios (devia ser 0):', viola.length);
  for (const n of viola.slice(0, 10)) console.log(`  #${n.id} ${n.nome} | ${n.matricula} | estado=${n.estadoNavio || ''} | cliente=${n.clienteId || ''}`);

  const naufragados = all.filter((n) => (n.estadoNavio || '').toLowerCase() === 'naufragado');
  console.log('Naufragados mantidos:', naufragados.length);
  for (const n of naufragados) console.log(`  #${n.id} ${n.nome} | ${n.matricula} | ${n.estadoNavio}`);

  const orfaos = await p.inspecao.findMany({ where: { navioId: { not: null } }, select: { id: true, navioId: true } });
  const navioIds = new Set(all.map((n) => n.id));
  const inspecOrfaos = orfaos.filter((i) => !navioIds.has(i.navioId));
  console.log('\nInspecoes com navioId orfao:', inspecOrfaos.length);

  const coleteOrfao = await p.colete.findMany({ where: { shipId: { not: null } }, select: { id: true, shipId: true } });
  const colOrfaos = coleteOrfao.filter((c) => !navioIds.has(c.shipId));
  console.log('Coletes com shipId orfao:', colOrfaos.length);

  const dups = await p.navio.groupBy({ by: ['matricula'], _count: true, where: { matricula: { not: '' } } });
  const matDuplicadas = dups.filter((d) => d._count > 1);
  console.log('Matriculas duplicadas:', matDuplicadas.length);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
