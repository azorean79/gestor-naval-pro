const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const isPT = (m) => /^PT/i.test(String(m || '').trim());

(async () => {
  const all = await p.navio.findMany({ select: { id: true, matricula: true, estadoNavio: true, clienteId: true } });
  const jangadas = await p.jangada.findMany({ select: { shipId: true } });
  const jangadaShipIds = new Set(jangadas.map((j) => j.shipId).filter((x) => x != null));

  const deleteIds = new Set(
    all
      .filter((n) => !isPT(n.matricula))
      .filter((n) => (n.estadoNavio || '').toLowerCase() !== 'naufragado')
      .filter((n) => n.clienteId == null)
      .filter((n) => !jangadaShipIds.has(n.id))
      .map((n) => n.id)
  );

  const refs = {};
  const tables = [
    ['jangada', 'shipId'],
    ['inspecao', 'navioId'],
    ['ordemServico', 'shipId'],
    ['epirb', 'shipId'],
    ['colete', 'shipId'],
    ['fatoImersao', 'shipId'],
    ['extintor', 'shipId'],
    ['fatura', 'shipId'],
  ];

  for (const [model, field] of tables) {
    const rows = await p[model].findMany({ select: { id: true, [field]: true } });
    const hit = rows.filter((r) => r[field] != null && deleteIds.has(r[field]));
    refs[model] = hit.length;
    console.log(`${model}.${field} -> orfaos a criar: ${hit.length}`);
  }

  const agenda = await p.agenda.findMany({ select: { matricula: true } });
  const allNav = await p.navio.findMany({ select: { id: true, matricula: true } });
  const deleteByMat = new Set(allNav.filter((n) => deleteIds.has(n.id)).map((n) => String(n.matricula || '').trim().toUpperCase()));
  let agendaHits = 0;
  for (const a of agenda) {
    const m = String(a.matricula || '').trim().toUpperCase();
    if (m && deleteByMat.has(m)) agendaHits++;
  }
  console.log(`agenda.matricula (por matricula) -> referencias: ${agendaHits}`);

  const osByShip = await p.ordemServico.findMany({ where: { shipId: { in: [...deleteIds] } }, select: { id: true } });
  console.log(`ordemServico com shipId em delete: ${osByShip.length}`);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
