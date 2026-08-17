const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const mapa = JSON.parse(fs.readFileSync('C:/Users/julio/AppData/Local/Temp/opencode/cfr_map.json', 'utf-8'));
  const beluga = mapa.find((r) => r.cfr === 'PRT000023140');
  console.log('cfr_map PRT000023140:', JSON.stringify(beluga));

  const REFS = [['jangada','shipId'],['inspecao','navioId'],['ordemServico','shipId'],['epirb','shipId'],['colete','shipId'],['fatoImersao','shipId'],['extintor','shipId'],['fatura','shipId']];
  for (const par of [[240, 782], [458, 876], [744, 857]]) {
    for (const id of par) {
      const n = await p.navio.findUnique({ where: { id }, include: { cliente: { select: { id: true, nome: true } } } });
      const refs = [];
      for (const [model, fk] of REFS) {
        const where = {}; where[fk] = id;
        const cnt = await p[model].count({ where });
        if (cnt) refs.push(`${model}:${cnt}`);
      }
      console.log(`#${id} ${n.nome} | mat=${n.matricula} | cfr=${n.cfr || '(sem)'} | cliente=${n.clienteId} ${n.cliente?.nome || ''} | estado=${n.estadoNavio || '(vazio)'} | ilha=${n.ilha || '(vazio)'} | tipoPesca=${n.tipoPesca || '(vazio)'} | refs=[${refs.join(',')}]`);
    }
    console.log('---');
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
