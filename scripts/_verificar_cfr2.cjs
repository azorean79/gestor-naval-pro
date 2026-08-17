const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const mapa = JSON.parse(fs.readFileSync('C:/Users/julio/AppData/Local/Temp/opencode/cfr_map.json', 'utf-8'));
const porCfr = new Map(mapa.map((r) => [r.cfr.toUpperCase(), r]));

const isPT = (m) => /^PT/i.test(String(m || '').trim());

(async () => {
  const all = await p.navio.findMany({ select: { id: true, nome: true, matricula: true, cfr: true, estadoNavio: true, clienteId: true } });
  const jangadas = await p.jangada.findMany({ select: { shipId: true } });
  const jangadaShipIds = new Set(jangadas.map((j) => j.shipId).filter((x) => x != null));

  const toDelete = all.filter((n) =>
    !isPT(n.matricula) &&
    (n.estadoNavio || '').toLowerCase() !== 'naufragado' &&
    n.clienteId == null &&
    !jangadaShipIds.has(n.id)
  );

  const salvos = toDelete.filter((n) => n.cfr && porCfr.has(String(n.cfr).trim().toUpperCase()));

  console.log('A eliminar atualmente:', toDelete.length);
  console.log('Ganhariam cliente via CFR (seriam mantidos):', salvos.length);

  const comCfr = toDelete.filter((n) => n.cfr && String(n.cfr).trim());
  console.log('Dos que seriam eliminados, quantos TEM cfr:', comCfr.length);
  const semCfr = toDelete.filter((n) => !n.cfr || !String(n.cfr).trim());
  console.log('Dos que seriam eliminados, SEM cfr:', semCfr.length);

  const soCfr = salvos.filter((n) => !porCfr.get(String(n.cfr).trim().toUpperCase()).embarcacao);
  console.log('Salvos sem nome de barco no ficheiro (so por cfr):', soCfr.length);

  console.log('\nExemplos salvos:');
  for (const n of salvos.slice(0, 20)) {
    const r = porCfr.get(String(n.cfr).trim().toUpperCase());
    console.log(`  #${n.id} ${n.nome} | ${n.matricula} | cfr=${n.cfr} | benef=${r.beneficiario.slice(0, 40)}`);
  }

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
