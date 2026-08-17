const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const MAP = {
  "Angra Do Heroísmo": "Angra do Heroísmo",
  "Portimao": "Portimão",
  "Povoa De Varzim": "Póvoa de Varzim",
  "Praia Da Vitória": "Praia da Vitória",
  "Vila Da Praia Da Vitória": "Praia da Vitória",
  "Santa Cruz Da Graciosa": "Santa Cruz da Graciosa",
  "São Roque Do Pico": "São Roque do Pico",
  "Sao Roque Do Pico": "São Roque do Pico",
  "Viana Do Castelo": "Viana do Castelo",
  "Vila Do Conde": "Vila do Conde",
  "Vila Do Porto": "Vila do Porto",
  "Vila Franca Do Campo": "Vila Franca do Campo",
  "Vila Real De Santo António": "Vila Real de Santo António",
  "Vila Real S. António": "Vila Real de Santo António",
  "Santa Cruz Da Flores": "Santa Cruz das Flores",
  "Lajes": "Lajes do Pico",
  "": null,
};

(async () => {
  let updated = 0;
  for (const [de, para] of Object.entries(MAP)) {
    const res = await p.navio.updateMany({ where: { portoRegisto: de }, data: { portoRegisto: para } });
    console.log(`  ${JSON.stringify(de)} -> ${JSON.stringify(para)}: ${res.count} navios`);
    updated += res.count;
  }
  const distintos = await p.navio.groupBy({ by: ['portoRegisto'], _count: true, where: { portoRegisto: { not: null } } });
  const vazios = distintos.filter((d) => d.portoRegisto === '').length;
  console.log(`\nTotal atualizado: ${updated}`);
  console.log(`Valores distintos (não nulos) após consolidação: ${distintos.length} (${vazios} vazio, vai ser removido)`);
  const semVazio = distintos.filter((d) => d.portoRegisto !== '');
  console.log(`Portos canónicos: ${semVazio.length}`);
  for (const d of semVazio.map((d) => ({ p: d.portoRegisto, c: d._count })).sort((a, b) => a.p.localeCompare(b.p))) console.log(`  ${d.c}\t${JSON.stringify(d.p)}`);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
