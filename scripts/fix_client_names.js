const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Fix the one remaining: name is ONLY the prefix with no actual name after it
  const remaining = await p.cliente.findMany({
    where: {
      nome: { contains: 'LISTA DE OPERAÇÕES APROVADAS' },
    },
    select: { id: true, nome: true },
  });

  for (const c of remaining) {
    const cleaned = (c.nome || '').replace(/^\s*LISTA\s+DE\s+OPERA[ÇC][ÕO]ES\s+APROVADAS\s+\d{1,2}\.\w+\.?\d{2,4}\s*/i, '').trim();
    if (cleaned) {
      await p.cliente.update({ where: { id: c.id }, data: { nome: cleaned } });
      console.log(`Fixed: "${c.nome}" -> "${cleaned}"`);
    } else {
      console.log(`Skipped (empty after clean): "${c.nome}" (ID=${c.id})`);
    }
  }

  // Verify none remain
  const count = await p.cliente.count({ where: { nome: { contains: 'LISTA DE OPERAÇÕES APROVADAS' } } });
  console.log(`Remaining: ${count}`);
  await p.$disconnect();
})();
