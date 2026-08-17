const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const res = await p.navio.delete({ where: { id: 747 } });
  console.log('Eliminado #747', res.nome, res.matricula);
  const rest = await p.navio.findMany({ where: { matricula: 'N/D' }, select: { id: true, nome: true, tipoPesca: true, ilha: true } });
  console.log('Navios N/D restantes:', rest.length);
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
