const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  console.log('=== Inspecoes #85 e #98 (detalhe) ===');
  for (const id of [85, 98]) {
    const i = await p.inspecao.findUnique({ where: { id }, select: { id: true, certificadoNumero: true, navioNome: true, navioId: true, jangadaId: true, jangadaSerial: true, dataInspecao: true, dataProxInspecao: true, status: true } });
    console.log(JSON.stringify(i));
  }

  console.log('\n=== Matricula PT-104086-AC ===');
  for (const id of [686, 899]) {
    const n = await p.navio.findUnique({ where: { id }, include: { cliente: { select: { id: true, nome: true } } } });
    console.log(`#${n.id} ${n.nome} | mat=${n.matricula} | cfr=${n.cfr} | clienteId=${n.clienteId} ${n.cliente?.nome || ''} | estado=${n.estadoNavio} | ilha=${n.ilha}`);
    const js = await p.jangada.findMany({ where: { shipId: n.id }, select: { id: true, serial: true } });
    console.log(`  jangadas: ${js.length}`);
  }

  console.log('\n=== Matricula PTPDL-118582-C ===');
  for (const id of [869, 997]) {
    const n = await p.navio.findUnique({ where: { id }, include: { cliente: { select: { id: true, nome: true } } } });
    console.log(`#${n.id} ${n.nome} | mat=${n.matricula} | cfr=${n.cfr} | clienteId=${n.clienteId} ${n.cliente?.nome || ''} | estado=${n.estadoNavio} | ilha=${n.ilha}`);
    const js = await p.jangada.findMany({ where: { shipId: n.id }, select: { id: true, serial: true } });
    console.log(`  jangadas: ${js.length}`);
  }

  console.log('\n=== Matricula PTPDL-118609-C ===');
  for (const id of [19, 752]) {
    const n = await p.navio.findUnique({ where: { id }, include: { cliente: { select: { id: true, nome: true } } } });
    console.log(`#${n.id} ${n.nome} | mat=${n.matricula} | cfr=${n.cfr} | clienteId=${n.clienteId} ${n.cliente?.nome || ''} | estado=${n.estadoNavio} | ilha=${n.ilha}`);
    const js = await p.jangada.findMany({ where: { shipId: n.id }, select: { id: true, serial: true } });
    console.log(`  jangadas: ${js.length}`);
  }

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
