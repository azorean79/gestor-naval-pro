const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const APOIOS = [
  'C:/Users/julio/AppData/Local/Temp/opencode/apoioss_30062024.txt',
  'C:/Users/julio/AppData/Local/Temp/opencode/lista_operacoes_31122020.txt',
];
const textos = APOIOS.map((f) => fs.readFileSync(f, 'utf-8').replace(/\u0000/g, ''));

function norm(s) {
  return String(s || '').trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

const MAT_RE = /(?:^|[,\s])((?:PTPDL|PTHOR|PTPIC|PTSCG|PTGRW|PTSCF|PTPSX|PTFRA|PTSCW|PD|PT)-(?:[\dA-Z]{3,6})(?:-[CL]))/i;

(async () => {
  const nd = await p.navio.findMany({ where: { matricula: 'N/D' }, select: { id: true, nome: true, ilha: true } });
  let achados = 0;
  for (const n of nd) {
    const palavras = norm(n.nome).split(' ').filter((w) => w.length >= 3);
    if (!palavras.length) continue;
    let melhor = null, melhorScore = 0;
    for (const txt of textos) {
      for (const linha of txt.split(/\r?\n/)) {
        const lN = norm(linha);
        const score = palavras.filter((w) => lN.includes(w)).length;
        if (score > melhorScore) { melhorScore = score; melhor = { linha, score }; }
      }
    }
    if (melhor && melhorScore >= palavras.length) {
      const m = melhor.linha.match(MAT_RE);
      console.log(`#${n.id} ${n.nome} (${n.ilha}) [score ${melhorScore}/${palavras.length}] -> ${melhor.linha.trim().slice(0, 90)}`);
      if (m) console.log(`   MATRICULA: ${m[1]}`);
      achados++;
    }
  }
  console.log('\nNavios com linha completa nos apoios:', achados);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
