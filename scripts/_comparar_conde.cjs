const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const REFS = [
  ['jangada', 'shipId'],
  ['inspecao', 'navioId'],
  ['ordemServico', 'shipId'],
  ['epirb', 'shipId'],
  ['colete', 'shipId'],
  ['fatoImersao', 'shipId'],
  ['extintor', 'shipId'],
  ['fatura', 'shipId'],
];

(async () => {
  for (const id of [209, 747]) {
    const n = await p.navio.findUnique({ where: { id }, include: { cliente: { select: { id: true, nome: true } } } });
    console.log(`\n=== #${id} ${n.nome} | mat=${n.matricula} | cfr=${n.cfr || '(sem)'} | cliente=${n.clienteId} ${n.cliente?.nome || ''} | estado=${n.estadoNavio || '(vazio)'} | tipoNavio=${n.tipoNavio || '(vazio)'} | ilha=${n.ilha || '(vazio)'} | tipoPesca=${n.tipoPesca || '(vazio)'} ===`);
    for (const [model, fk] of REFS) {
      const where = {};
      where[fk] = id;
      const cnt = await p[model].count({ where });
      if (cnt) console.log(`  ${model}.${fk}: ${cnt}`);
    }
  }
  const mapa = await p.cfrMap ? null : null;
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
