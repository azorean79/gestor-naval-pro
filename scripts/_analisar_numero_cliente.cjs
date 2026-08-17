const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const ncs = await p.cliente.findMany({ select: { numeroCliente: true }, where: { numeroCliente: { not: null } } });
  const nums = ncs.map((c) => c.numeroCliente.trim());
  const numericos = nums.map((n) => parseInt(n, 10)).filter((n) => Number.isFinite(n));
  const naoNumericos = nums.filter((n) => !/^\d+$/.test(n));
  console.log('Total com numeroCliente:', nums.length);
  console.log('Numericos:', numericos.length, '| nao numericos:', naoNumericos.length);
  if (numericos.length) console.log('Max numerico:', Math.max(...numericos), '| Min:', Math.min(...numericos));
  console.log('Exemplos nao numericos:', naoNumericos.slice(0, 20).join(', '));
  console.log('Exemplos numericos (ultimos 10):', numericos.slice(-10).join(', '));
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
