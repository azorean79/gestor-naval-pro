const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const navios = await p.navio.findMany({ select: { id: true, nome: true, matricula: true } });
  const navioIds = new Set(navios.map((n) => n.id));

  console.log('=== Inspecoes com navioId orfao ===');
  const orfaos = await p.inspecao.findMany({ where: { navioId: { not: null } }, select: { id: true, navioId: true, navioNome: true, certificadoNumero: true } });
  const hits = orfaos.filter((i) => !navioIds.has(i.navioId));
  for (const h of hits) console.log(`  Inspecao #${h.id} cert=${h.certificadoNumero} navioId=${h.navioId} navioNome="${h.navioNome}"`);

  console.log('\n=== Matriculas duplicadas ===');
  const dups = await p.navio.groupBy({ by: ['matricula'], _count: true, where: { matricula: { not: '' } } });
  for (const d of dups.filter((x) => x._count > 1)) {
    const ns = navios.filter((n) => n.matricula === d.matricula);
    console.log(`  "${d.matricula}" (${d._count}): ${ns.map((n) => `#${n.id} ${n.nome}`).join(' / ')}`);
  }

  console.log('\n=== Jangadas com shipId orfao ===');
  const js = await p.jangada.findMany({ where: { shipId: { not: null } }, select: { id: true, serial: true, shipId: true } });
  const jHits = js.filter((j) => !navioIds.has(j.shipId));
  for (const h of jHits) console.log(`  Jangada #${h.id} ${h.serial} shipId=${h.shipId}`);
  console.log('Total jangadas orfas:', jHits.length);

  console.log('\n=== Epirbs/Outros com shipId orfao ===');
  for (const model of ['epirb', 'fatoImersao', 'extintor', 'fatura', 'ordemServico']) {
    const rows = await p[model].findMany({ where: { shipId: { not: null } }, select: { id: true, shipId: true } });
    const hits2 = rows.filter((r) => !navioIds.has(r.shipId));
    if (hits2.length) console.log(`  ${model}: ${hits2.length} orfaos`);
  }
  console.log('(os que nao aparecem acima = 0 orfaos)');

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
