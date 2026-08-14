const path = require('path');
const { PrismaClient } = require('@prisma/client');
const dbPath = path.join(__dirname, '..', 'prisma', 'local.db');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + dbPath } } });
(async () => {
  const items = await prisma.stock.findMany({
    where: { estadoArtigo: 'ATIVO' },
    select: { id: true, referencia: true, descricao: true, codigoFabricante: true, foto: true, categoria: true },
    orderBy: { referencia: 'asc' }
  });
  console.log('Total ativos:', items.length);
  const withRef = items.filter(s => s.referencia);
  const prefixes = {};
  withRef.forEach(s => {
    const m = s.referencia.match(/^([A-Z]+)/);
    if (m) prefixes[m[1]] = (prefixes[m[1]] || 0) + 1;
  });
  console.log('Ref prefixes:', JSON.stringify(prefixes, null, 2));
  const noFoto = items.filter(s => !s.foto);
  console.log('Sem foto:', noFoto.length);
  const hasPhotoDir = {};
  const fs = require('fs');
  ['ocean-safety-spares', 'ocean-safety'].forEach(dir => {
    const p = path.join(__dirname, '..', 'public', dir);
    if (fs.existsSync(p)) {
      fs.readdirSync(p).forEach(f => {
        const base = path.parse(f).name;
        hasPhotoDir[base] = dir;
      });
    }
  });
  const matchable = noFoto.filter(s => hasPhotoDir[s.referencia]);
  console.log('Matchable (ref has photo in public/):', matchable.length);
  matchable.slice(0, 20).forEach(s => console.log(`  ${s.referencia} → ${hasPhotoDir[s.referencia]}/${s.referencia}.jpg`));
  await prisma.$disconnect();
})();
