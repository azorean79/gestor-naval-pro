const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const PT_MATRICULA = /^PT[A-Z]{3}-\d{4,}-[A-Z]$/i;

(async () => {
  const all = await p.navio.findMany();
  const byName = new Map();
  for (const n of all) {
    const key = String(n.nome || '').trim().toUpperCase().replace(/\s+/g, ' ');
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(n);
  }

  const toDelete = [];
  for (const g of byName.values()) {
    if (g.length < 2) continue;
    const withPt = g.filter((n) => PT_MATRICULA.test(String(n.matricula || '').trim()));
    const withoutPt = g.filter((n) => !PT_MATRICULA.test(String(n.matricula || '').trim()));
    if (withPt.length >= 1 && withoutPt.length >= 1) toDelete.push(...withoutPt);
  }

  const ids = toDelete.map((n) => n.id);
  const withCliente = toDelete.filter((n) => n.clienteId != null);
  const inspecoes = await p.inspecao.findMany({ where: { navioId: { in: ids } } });
  const inspecaoIds = new Set(inspecoes.map((i) => i.navioId));
  const withInspecao = toDelete.filter((n) => inspecaoIds.has(n.id));

  console.log(`Total candidatos: ${toDelete.length}`);
  console.log(`Candidatos com clienteId: ${withCliente.length}`);
  for (const n of withCliente) {
    const c = n.clienteId != null ? await p.cliente.findUnique({ where: { id: n.clienteId }, select: { nome: true } }) : null;
    console.log(`  - #${n.id} ${n.nome} | ${n.matricula} | ilha=${n.ilha} | cliente=${n.clienteId} ${c ? c.nome : ''}`);
  }
  console.log(`Candidatos com inspecoes (navioId): ${withInspecao.length}`);
  for (const n of withInspecao) {
    console.log(`  - #${n.id} ${n.nome} | ${n.matricula} | ilha=${n.ilha} | clienteId=${n.clienteId}`);
  }

  const withAny = new Set([...withCliente.map((n) => n.id), ...withInspecao.map((n) => n.id)]);
  const safe = toDelete.filter((n) => !withAny.has(n.id));
  console.log(`\nCandidatos SEM cliente e SEM inspecao (seguros): ${safe.length}`);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
