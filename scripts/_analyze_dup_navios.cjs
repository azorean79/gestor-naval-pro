const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const PT_MATRICULA = /^PT[A-Z]{3}-\d{4,}-[A-Z]$/i;

(async () => {
  const all = await p.navio.findMany({ orderBy: { nome: 'asc' } });
  const byName = new Map();
  for (const n of all) {
    const key = String(n.nome || '').trim().toUpperCase().replace(/\s+/g, ' ');
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(n);
  }

  const groups = [...byName.values()].filter((g) => g.length > 1);
  console.log(`Total navios: ${all.length}, nomes duplicados: ${groups.length}`);

  let ptDupGroups = 0;
  let toDelete = [];
  let skipped = [];

  for (const g of groups) {
    const withPt = g.filter((n) => PT_MATRICULA.test(String(n.matricula || '').trim()));
    const withoutPt = g.filter((n) => !PT_MATRICULA.test(String(n.matricula || '').trim()));
    if (withPt.length >= 1 && withoutPt.length >= 1) {
      ptDupGroups++;
      const kept = withPt.map((n) => `#${n.id} ${n.matricula}`).join(', ');
      for (const n of withoutPt) {
        toDelete.push({ navio: n, kept });
      }
    } else {
      skipped.push(g);
    }
  }

  console.log(`\nGrupos com nome duplicado E matricula PT + nao-PT: ${ptDupGroups}`);
  console.log(`\nNavios candidatos a eliminar (sem matricula PT, com homonimo PT): ${toDelete.length}\n`);

  for (const { navio, kept } of toDelete) {
    console.log(`- #${navio.id} | ${navio.nome} | ${navio.matricula} | ilha=${navio.ilha} | tipo=${navio.tipoPesca} | clienteId=${navio.clienteId}  -> manter: ${kept}`);
  }

  console.log(`\n=== Grupos SEM duplicado PT (nao mexer) ===`);
  for (const g of skipped) {
    const detail = g.map((n) => `#${n.id} ${n.matricula}`).join(', ');
    console.log(`- ${g[0].nome} | ${detail}`);
  }

  const inspecoes = await p.inspecao.findMany({ where: { navioId: { in: toDelete.map((x) => x.navio.id) } } });
  console.log(`\n=== Inspecoes associadas aos candidatos a eliminar: ${inspecoes.length} ===`);
  for (const i of inspecoes) {
    console.log(`- inspecao #${i.id} ${i.certificadoNumero} navioNome="${i.navioNome}" navioId=${i.navioId}`);
  }

  await p.$disconnect();
})().catch(async (e) => { console.error(e); await p.$disconnect(); process.exit(1); });
