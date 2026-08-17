const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const mapa = JSON.parse(fs.readFileSync('C:/Users/julio/AppData/Local/Temp/opencode/cfr_map.json', 'utf-8'));
const porCfr = new Map(mapa.map((r) => [r.cfr, r]));

function normalizarNome(s) {
  return String(s || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function normalizarMat(v) {
  return String(v || '').trim().toUpperCase().replace(/[\s-]/g, '');
}

(async () => {
  const navios = await p.navio.findMany({
    select: { id: true, nome: true, matricula: true, cfr: true, clienteId: true },
  });

  const naviosPorCfr = new Map();
  for (const n of navios) {
    const c = (n.cfr || '').trim().toUpperCase();
    if (!c) continue;
    if (!naviosPorCfr.has(c)) naviosPorCfr.set(c, []);
    naviosPorCfr.get(c).push(n);
  }

  const semCliente = navios.filter((n) => n.clienteId == null);
  const semClienteComCfr = semCliente.filter((n) => n.cfr && String(n.cfr).trim());

  let match = 0;
  let matchComEmbarcacao = 0;
  let mismatchNome = 0;
  let semNavio = 0;
  const exemplosMismatch = [];
  const exemplosSemNavio = [];

  for (const r of mapa) {
    const cfrKey = r.cfr.toUpperCase();
    const lista = naviosPorCfr.get(cfrKey);
    if (!lista || lista.length === 0) {
      semNavio++;
      if (exemplosSemNavio.length < 25) exemplosSemNavio.push({ cfr: r.cfr, benef: r.beneficiario, barco: r.embarcacao, mat: r.matricula });
      continue;
    }
    match += lista.length;
    if (r.embarcacao) {
      const embN = normalizarNome(r.embarcacao);
      const ok = lista.some((n) => normalizarNome(n.nome) === embN);
      if (ok) matchComEmbarcacao++;
      else {
        mismatchNome++;
        if (exemplosMismatch.length < 30) exemplosMismatch.push({ cfr: r.cfr, benef: r.beneficiario, barcoFich: r.embarcacao, matFich: r.matricula, navios: lista.map((n) => `#${n.id} ${n.nome} [${n.matricula}]`) });
      }
    }
  }

  console.log('=== VERIFICACAO CFR ===');
  console.log('CFRs no ficheiro:', mapa.length);
  console.log('CFRs com navio na BD:', match, 'em', new Set(mapa.map((r) => r.cfr)).size, 'CFRs (alguns com 2 navios)');
  console.log('CFRs do ficheiro SEM navio na BD:', semNavio);

  const comEmbSet = new Set(mapa.filter((r) => r.embarcacao).map((r) => r.cfr));
  console.log('CFRs com embarcacao no ficheiro:', comEmbSet.size);
  console.log('  nomes consistentes:', matchComEmbarcacao, '| nomes divergentes:', mismatchNome);

  console.log('\n--- Exemplos SEM navio na BD (25) ---');
  for (const e of exemplosSemNavio) console.log(`  ${e.cfr} | ${e.benef} | barco=${e.barco} | mat=${e.mat}`);

  console.log('\n--- Exemplos com nome divergente (30) ---');
  for (const e of exemplosMismatch) console.log(`  ${e.cfr} | ${e.benef} | fich barco="${e.barcoFich}" mat=${e.matFich} | BD: ${e.navios.join(' / ')}`);

  console.log('\n=== NAVIOS SEM CLIENTE ===');
  console.log('Navios sem cliente:', semCliente.length);
  console.log('Navios sem cliente COM cfr:', semClienteComCfr.length);

  const ganhariam = semClienteComCfr.filter((n) => porCfr.has(String(n.cfr || '').trim().toUpperCase()));
  console.log('Navios sem cliente cujo CFR existe no ficheiro (ganhariam cliente):', ganhariam.length);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
