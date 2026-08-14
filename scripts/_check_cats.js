const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'prisma', 'local.db');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + dbPath } } });
prisma.stock.findMany({
  where: { estadoArtigo: 'ATIVO' },
  select: { id: true, referencia: true, descricao: true, categoria: true },
  take: 200
}).then(r => {
  const cats = {};
  r.forEach(s => { cats[s.categoria] = (cats[s.categoria] || 0) + 1; });
  console.log('Categorias encontradas:', JSON.stringify(cats, null, 2));
  console.log('Total ativos:', r.length);
  // Show apito-like items
  const apitos = r.filter(s => (s.descricao || '').toLowerCase().includes('apito'));
  console.log('Apito items:', JSON.stringify(apitos.map(s => ({ id: s.id, ref: s.referencia, desc: s.descricao, cat: s.categoria, lote: s.lote })), null, 2));
  // Show mecanismo-like items
  const mecanismos = r.filter(s => {
    const c = (s.categoria || '').toLowerCase();
    const d = (s.descricao || '').toLowerCase();
    return c.includes('mecan') || c.includes('insufl') || c.includes('disparo') || c.includes('cabeca') || d.includes('mecanis');
  });
  console.log('Mecanismo items:', JSON.stringify(mecanismos.map(s => ({ id: s.id, ref: s.referencia, desc: s.descricao, cat: s.categoria })), null, 2));
  return prisma.$disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
