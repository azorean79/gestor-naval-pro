const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const isPT = (m) => /^PT/i.test(String(m || '').trim());

(async () => {
  const all = await p.navio.findMany({ select: { id: true, nome: true, matricula: true, estadoNavio: true, clienteId: true } });
  const jangadas = await p.jangada.findMany({ select: { id: true, serial: true, shipId: true, shipNameManual: true } });
  const jangadaShipIds = new Set(jangadas.map((j) => j.shipId).filter((x) => x != null));

  const deleteSet = new Set(
    all
      .filter((n) => !isPT(n.matricula))
      .filter((n) => (n.estadoNavio || '').toLowerCase() !== 'naufragado')
      .filter((n) => n.clienteId == null)
      .filter((n) => !jangadaShipIds.has(n.id))
  );

  const deleteById = new Map([...deleteSet].map((n) => [n.id, n]));
  const norm = (s) => String(s || '').trim().toUpperCase().replace(/\s+/g, ' ');

  let byNameHits = 0;
  for (const j of jangadas) {
    if (j.shipId != null) continue;
    const nm = norm(j.shipNameManual);
    if (!nm) continue;
    const match = all.find((n) => deleteById.has(n.id) && norm(n.nome) === nm);
    if (match) {
      byNameHits++;
      console.log(`Jangada #${j.id} ${j.serial} shipNameManual="${j.shipNameManual}" -> Navio #${match.id} ${match.nome} (sera eliminado)`);
    }
  }
  console.log(`Jangadas com shipNameManual a apontar para navios eliminados: ${byNameHits}`);

  const naufragados = [...deleteSet].filter((n) => false); // noop
  console.log(`Total a eliminar: ${deleteSet.size}`);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
