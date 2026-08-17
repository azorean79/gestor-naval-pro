const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const st = await p.serviceStation.findMany({ select: { id: true, codigo: true, nome: true } });
  console.log('Service stations:');
  for (const s of st) console.log(`  #${s.id} ${s.codigo} ${s.nome}`);

  const tipos = await p.cliente.groupBy({ by: ['tipoCliente'], _count: true });
  console.log('\ntipoCliente existentes:');
  for (const t of tipos) console.log(`  ${t.tipoCliente || '(null)'}: ${t._count}`);

  const ncs = await p.cliente.findMany({ select: { numeroCliente: true }, where: { numeroCliente: { not: null } }, orderBy: { numeroCliente: 'asc' } });
  const totalComNum = ncs.length;
  console.log('\nClientes com numeroCliente:', totalComNum, 'de', totalComNum + await p.cliente.count({ where: { numeroCliente: null } }));
  console.log('Primeiros 20:', ncs.slice(0, 20).map((c) => c.numeroCliente).join(', '));

  const ilhas = await p.navio.groupBy({ by: ['ilha'], _count: true, orderBy: { _count: { ilha: 'desc' } } });
  console.log('\nIlhas dos navios:');
  for (const i of ilhas) console.log(`  ${i.ilha || '(vazio)'}: ${i._count}`);

  const maxId = await p.cliente.aggregate({ _max: { id: true } });
  console.log('\nMax cliente id:', maxId._max.id);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
