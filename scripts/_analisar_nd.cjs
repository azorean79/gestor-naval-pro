const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const nd = await p.navio.findMany({ where: { matricula: 'N/D' }, select: { id: true, nome: true, cfr: true, ilha: true, clienteId: true, tipoNavio: true } });
  console.log('Navios N/D:', nd.length);
  const estruturado = JSON.parse(fs.readFileSync('C:/Users/julio/AppData/Local/Temp/opencode/embarcacoes_estruturado.json', 'utf-8'));
  const porCfr = new Map(estruturado.map((e) => [e.cfr, e]));

  const mapa = JSON.parse(fs.readFileSync('C:/Users/julio/AppData/Local/Temp/opencode/cfr_map.json', 'utf-8'));
  const porCfr2 = new Map(mapa.map((r) => [r.cfr, r]));

  let comEstrut = 0, comApoio = 0, semNada = 0;
  for (const n of nd) {
    const cfr = n.cfr ? n.cfr.trim().toUpperCase() : '';
    const est = cfr ? porCfr.get(cfr) : null;
    const ap = cfr ? porCfr2.get(cfr) : null;
    const flags = [];
    if (est) { comEstrut++; flags.push(`est: ${est.matricula} "${est.nome}"`); }
    if (ap && ap.matricula) { comApoio++; flags.push(`apoio: "${ap.matricula}"`); }
    console.log(`#${n.id} ${n.nome} | cfr=${cfr || '(sem)'} | ${flags.join(' | ')}`);
    if (!est && !(ap && ap.matricula)) semNada++;
  }
  console.log('\nCom matricula em embarcacoes_estruturado:', comEstrut);
  console.log('Com matricula em apoio (cfr_map):', comApoio);
  console.log('Sem matricula em nenhum:', semNada);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
