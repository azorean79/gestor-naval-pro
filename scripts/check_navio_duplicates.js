const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Find duplicate navios by matricula (only PT-prefixed)
  const ptNavios = await p.navio.findMany({
    where: { matricula: { startsWith: 'PT' } },
    select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true, clienteId: true, ativo: true },
    orderBy: { matricula: 'asc' },
  });

  // Group by matricula
  const byMatricula = {};
  for (const n of ptNavios) {
    const key = (n.matricula || '').trim().toUpperCase();
    if (!key) continue;
    if (!byMatricula[key]) byMatricula[key] = [];
    byMatricula[key].push(n);
  }

  const matriculaDupes = Object.entries(byMatricula).filter(([_, arr]) => arr.length > 1);

  console.log(`=== NAVIOS DUPLICADOS POR MATRICULA (apenas PT) ===\n`);
  console.log(`Total navios PT: ${ptNavios.length}`);
  console.log(`Matrículas duplicadas: ${matriculaDupes.length}\n`);

  for (const [mat, ships] of matriculaDupes) {
    console.log(`Matrícula ${mat} (${ships.length} navios):`);
    for (const s of ships) {
      console.log(`  ID=${s.id} | "${s.nome}" | ilha=${s.ilha || '?'} | tipo=${s.tipoPesca} | clienteId=${s.clienteId} | ativo=${s.ativo}`);
    }
    console.log('');
  }

  // Also find duplicate navios by name (same name, different matricula)
  const byName = {};
  for (const n of ptNavios) {
    const key = (n.nome || '').trim().toUpperCase();
    if (!key) continue;
    if (!byName[key]) byName[key] = [];
    byName[key].push(n);
  }

  const nameDupes = Object.entries(byName).filter(([_, arr]) => arr.length > 1);

  console.log(`\n=== NAVIOS DUPLICADOS POR NOME (apenas PT) ===\n`);
  console.log(`Nomes duplicados: ${nameDupes.length}\n`);

  for (const [name, ships] of nameDupes) {
    console.log(`Nome "${name}" (${ships.length} navios):`);
    for (const s of ships) {
      console.log(`  ID=${s.id} | mat=${s.matricula} | ilha=${s.ilha || '?'} | tipo=${s.tipoPesca} | clienteId=${s.clienteId} | ativo=${s.ativo}`);
    }
    console.log('');
  }

  await p.$disconnect();
})();
