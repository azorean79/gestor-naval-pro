const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const merges = [
  { keep: 361,   remove: 1527, name: "HENRIQUE MANUEL CARVALHO" },
  { keep: 1154,  remove: 1158, name: "PESCARIAS EUREKA LDA" },
  { keep: 1206,  remove: 2511, name: "MARCO ANTÓNIO VIEIRA SOARES" },
  { keep: 1260,  remove: 1568, name: "TESTA & CUNHAS, SA" },
  { keep: 1495,  remove: 2025, name: "VARATUM, LDA" },
  { keep: 1816,  remove: 2340, name: "MONIZ & PIMENTEL PESCAS UNIPESSOAL, LDA" },
  { keep: 1910,  remove: 2336, name: "ALFREDO AUGUSTO DA CRUZ GONÇALVES" },
  { keep: 2058,  remove: 2335, name: "JOSÉ CARLOS MILHAZES MOITA E JOAQUIM JOSÉ MILHAZES MOITA" },
  { keep: 2391,  remove: 2518, name: "PEDRO NUNO RASTEIRO DOS SANTOS" },
];

(async () => {
  let totalNavios = 0;

  for (const m of merges) {
    console.log(`\n--- Merging ${m.name}: ${m.remove} -> ${m.keep} ---`);

    // Transfer navios
    const moved = await p.navio.updateMany({
      where: { clienteId: m.remove },
      data: { clienteId: m.keep },
    });
    console.log(`  Transferred ${moved.count} navio(s) from ID=${m.remove} to ID=${m.keep}`);
    totalNavios += moved.count;

    // Transfer agendas
    const agendaMoved = await p.agenda.updateMany({
      where: { clienteId: m.remove },
      data: { clienteId: m.keep },
    });
    if (agendaMoved.count > 0) console.log(`  Transferred ${agendaMoved.count} agenda(s)`);

    // Update keep client: adopt numeroCliente from remove if keep doesn't have one
    const keepClient = await p.cliente.findUnique({ where: { id: m.keep }, select: { numeroCliente: true, nif: true, email: true, telefone: true } });
    const removeClient = await p.cliente.findUnique({ where: { id: m.remove }, select: { numeroCliente: true, nif: true, email: true, telefone: true } });

    if (keepClient && removeClient) {
      const updates = {};
      if (!keepClient.numeroCliente && removeClient.numeroCliente) updates.numeroCliente = removeClient.numeroCliente;
      if (!keepClient.nif && removeClient.nif) updates.nif = removeClient.nif;
      if (!keepClient.email && removeClient.email) updates.email = removeClient.email;
      if (!keepClient.telefone && removeClient.telefone) updates.telefone = removeClient.telefone;
      if (Object.keys(updates).length > 0) {
        await p.cliente.update({ where: { id: m.keep }, data: updates });
        console.log(`  Updated keep client with: ${Object.keys(updates).join(', ')}`);
      }
    }

    // Delete the duplicate
    await p.cliente.delete({ where: { id: m.remove } });
    console.log(`  Deleted client ID=${m.remove}`);
  }

  console.log(`\n=== DONE: ${merges.length} merges, ${totalNavios} navio(s) transferred ===`);
  await p.$disconnect();
})();
