const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const registos = JSON.parse(fs.readFileSync('C:/Users/julio/AppData/Local/Temp/opencode/embarcacoes_acores_extraidas.json', 'utf-8'));

function norm(s) {
  return String(s || '').trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

(async () => {
  const nd = await p.navio.findMany({ where: { matricula: 'N/D' }, select: { id: true, nome: true, ilha: true, tipoPesca: true } });
  console.log('Navios N/D:', nd.length);

  const index = new Map();
  for (const r of registos) {
    const k = norm(r.nome);
    if (!index.has(k)) index.set(k, []);
    index.get(k).push(r);
  }

  let exatos = 0, parcial = 0, nada = 0;
  const naoEncontrados = [];
  const resultados = [];
  for (const n of nd) {
    const k = norm(n.nome);
    let hit = null;
    if (index.has(k)) hit = index.get(k)[0];
    if (!hit) {
      const palavras = k.split(' ').filter((w) => w.length >= 3);
      let melhor = null, melhorScore = 0;
      for (const [ik, arr] of index) {
        const ip = ik.split(' ');
        const score = ip.filter((w) => palavras.includes(w)).length;
        if (score > melhorScore) { melhorScore = score; melhor = arr[0]; }
      }
      if (melhorScore >= Math.max(2, Math.ceil(palavras.length / 2))) hit = melhor;
    }
    if (hit) {
      exatos++;
      resultados.push({ id: n.id, nome: n.nome, ilhaBD: n.ilha, hit: hit });
      console.log(`#${n.id} ${n.nome} (${n.ilha}) -> ${hit.nome} | ${hit.matricula} | ${hit.cfr} [ilha=${hit.ilha}]`);
    } else {
      nada++;
      naoEncontrados.push(n);
    }
  }
  console.log('\nMatches:', exatos, '| sem match:', nada);
  console.log('\n=== SEM MATCH (${naoEncontrados.length}) ===');
  for (const n of naoEncontrados) console.log(`#${n.id} ${n.nome} | ilha=${n.ilha || '(vazio)'} | tipo=${n.tipoPesca || '(vazio)'}`);
  fs.writeFileSync('D:/Acores/scripts/_nd_matches.json', JSON.stringify(resultados, null, 1));
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
