const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const isPT = (m) => /^PT/i.test(String(m || '').trim());

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
    const withPt = g.filter((n) => isPT(n.matricula));
    const withoutPt = g.filter((n) => !isPT(n.matricula));
    if (withPt.length >= 1 && withoutPt.length >= 1) toDelete.push(...withoutPt);
  }

  const ids = toDelete.map((n) => n.id);
  const inspecoes = await p.inspecao.findMany({ where: { navioId: { in: ids } }, select: { id: true, navioId: true, navioNome: true } });
  const inspecaoIds = new Set(inspecoes.map((i) => i.navioId));

  const protectedSet = new Set();
  for (const n of toDelete) {
    if (n.clienteId != null || inspecaoIds.has(n.id)) protectedSet.add(n.id);
  }
  const deleteIds = ids.filter((id) => !protectedSet.has(id));

  const byId = new Map(all.map((n) => [n.id, n]));
  console.log(`TOTAL candidatos (nao comeca em PT, com homonimo PT): ${toDelete.length}`);
  console.log(`Protegidos (cliente ou inspecao): ${protectedSet.size}`);
  for (const id of protectedSet) {
    const n = byId.get(id);
    console.log(`  PROTEGIDO #${id} ${n.nome} | ${n.matricula} | ilha=${n.ilha} | clienteId=${n.clienteId} | inspecao=${inspecaoIds.has(id) ? 'sim' : 'nao'}`);
  }
  console.log(`A ELIMINAR: ${deleteIds.length}`);

  const fs = require('fs');
  fs.writeFileSync('scripts/_dup_delete_ids.json', JSON.stringify(deleteIds));
  const log = toDelete.map((n) => `#${n.id} | ${n.nome} | ${n.matricula} | ilha=${n.ilha} | porto=${n.portoRegisto || ''} | tipo=${n.tipoPesca} | clienteId=${n.clienteId || ''}${protectedSet.has(n.id) ? ' | PROTEGIDO' : ' | ELIMINAR'}`).join('\n');
  fs.writeFileSync('scripts/_dup_delete_log.txt', log);

  // verificacao dos grupos protegidos (para o relatorio)
  console.log('\n=== Navios protegidos dentro dos grupos ===');
  for (const g of byName.values()) {
    const protectedHere = g.filter((n) => protectedSet.has(n.id));
    if (protectedHere.length) {
      const others = g.map((n) => `#${n.id} ${n.matricula}`).join(', ');
      console.log(`Grupo "${g[0].nome}": protegidos [${protectedHere.map((n) => '#' + n.id).join(',')}] | grupo: ${others}`);
    }
  }

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
