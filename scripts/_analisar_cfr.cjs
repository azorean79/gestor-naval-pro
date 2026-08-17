const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const all = await p.navio.findMany({ select: { id: true, nome: true, matricula: true, cfr: true, clienteId: true } });
  const comCfr = all.filter((n) => n.cfr && String(n.cfr).trim());
  const semCfr = all.filter((n) => !n.cfr || !String(n.cfr).trim());
  const comCliente = all.filter((n) => n.clienteId != null);

  console.log(`Total navios: ${all.length}`);
  console.log(`Com CFR: ${comCfr.length}`);
  console.log(`Sem CFR: ${semCfr.length}`);
  console.log(`Com cliente: ${comCliente.length}`);

  const dup = {};
  for (const n of comCfr) {
    const c = String(n.cfr).trim().toUpperCase();
    if (dup[c]) dup[c].push(n); else dup[c] = [n];
  }
  const dups = Object.entries(dup).filter(([, v]) => v.length > 1);
  console.log(`CFRs duplicados: ${dups.length}`);
  for (const [c, v] of dups.slice(0, 20)) {
    console.log(`  ${c}: ${v.map((n) => `#${n.id} ${n.nome}`).join(', ')}`);
  }

  const amostra = comCfr.slice(0, 25);
  console.log('\nAmostra de CFRs:');
  for (const n of amostra) console.log(`  #${n.id} ${n.nome} | mat=${n.matricula} | cfr=${n.cfr} | clienteId=${n.clienteId}`);

  const semCfrAmostra = semCfr.slice(0, 15);
  console.log('\nAmostra sem CFR:');
  for (const n of semCfrAmostra) console.log(`  #${n.id} ${n.nome} | mat=${n.matricula} | clienteId=${n.clienteId}`);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
