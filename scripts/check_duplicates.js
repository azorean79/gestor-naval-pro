const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Find all clients grouped by normalized name
  const allClients = await p.cliente.findMany({
    select: { id: true, nome: true, numeroCliente: true, nif: true, ilha: true },
    orderBy: { id: 'asc' },
  });

  // Group by normalized name (trim + uppercase)
  const groups = {};
  for (const c of allClients) {
    const key = (c.nome || '').trim().toUpperCase();
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }

  // Find duplicates (more than 1 client with same name)
  const dupes = Object.entries(groups).filter(([_, arr]) => arr.length > 1);

  console.log(`=== ${dupes.length} client name groups with duplicates ===\n`);

  for (const [name, clients] of dupes) {
    console.log(`"${name}" (${clients.length} clients):`);
    for (const c of clients) {
      console.log(`  ID=${c.id} | #${c.numeroCliente || '?'} | NIF=${c.nif || '?'} | Ilha=${c.ilha || '?'}`);
    }
    console.log('');
  }

  console.log(`Total clients: ${allClients.length}`);
  console.log(`Duplicate groups: ${dupes.length}`);
  console.log(`Clients in duplicate groups: ${dupes.reduce((sum, [_, arr]) => sum + arr.length, 0)}`);

  await p.$disconnect();
})();
