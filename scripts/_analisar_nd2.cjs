const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const nd = await p.navio.findMany({ where: { matricula: 'N/D' }, select: { id: true, nome: true, tipoPesca: true, ilha: true } });
  console.log('Navios N/D:', nd.length);

  const porTipo = {};
  for (const n of nd) {
    const t = n.tipoPesca || '(vazio)';
    porTipo[t] = (porTipo[t] || 0) + 1;
  }
  console.log('\nPor tipoPesca:');
  for (const [t, c] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) console.log(`  ${t}: ${c}`);

  const porIlha = {};
  for (const n of nd) {
    const i = n.ilha || '(vazio)';
    porIlha[i] = (porIlha[i] || 0) + 1;
  }
  console.log('\nPor ilha:');
  for (const [i, c] of Object.entries(porIlha).sort((a, b) => b[1] - a[1])) console.log(`  ${i}: ${c}`);

  const local = nd.filter((n) => (n.tipoPesca || '').toLowerCase().includes('local'));
  const costeira = nd.filter((n) => (n.tipoPesca || '').toLowerCase().includes('costeira'));
  console.log('\nPesca Local:', local.length);
  console.log('Pesca Costeira:', costeira.length);
  console.log('Pesca do Largo:', nd.filter((n) => (n.tipoPesca || '').toLowerCase().includes('largo')).length);

  console.log('\nDetalhe Pesca Local:');
  for (const n of local) console.log(`  #${n.id} ${n.nome} | ${n.ilha || '(sem ilha)'}`);
  console.log('\nDetalhe Pesca Costeira:');
  for (const n of costeira) console.log(`  #${n.id} ${n.nome} | ${n.ilha || '(sem ilha)'}`);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
