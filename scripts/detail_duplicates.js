const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const dupes = [
    { name: "HENRIQUE MANUEL CARVALHO", ids: [361, 1527] },
    { name: "PESCARIAS EUREKA LDA", ids: [1154, 1158] },
    { name: "MARCO ANTÓNIO VIEIRA SOARES", ids: [1206, 2511] },
    { name: "TESTA & CUNHAS, SA", ids: [1260, 1568] },
    { name: "VARATUM, LDA", ids: [1495, 2025] },
    { name: "MONIZ & PIMENTEL PESCAS UNIPESSOAL, LDA", ids: [1816, 2340] },
    { name: "ALFREDO AUGUSTO DA CRUZ GONÇALVES", ids: [1910, 2336] },
    { name: "JOSÉ CARLOS MILHAZES MOITA E JOAQUIM JOSÉ MILHAZES MOITA", ids: [2058, 2335] },
    { name: "PEDRO NUNO RASTEIRO DOS SANTOS", ids: [2391, 2518] },
  ];

  for (const group of dupes) {
    console.log(`\n========================================`);
    console.log(`"${group.name}"`);
    console.log(`========================================`);

    for (const id of group.ids) {
      const c = await p.cliente.findUnique({
        where: { id },
        select: {
          id: true, nome: true, numeroCliente: true, nif: true, ilha: true, morada: true, email: true, telefone: true,
          navios: { select: { id: true, nome: true, matricula: true, ilha: true } },
          _count: { select: { ordensServico: true, faturas: true, agendas: true } },
        },
      });
      if (!c) { console.log(`  ID=${id}: NOT FOUND`); continue; }
      console.log(`\n  ID=${c.id} | #${c.numeroCliente || '?'} | NIF=${c.nif || '?'} | Ilha=${c.ilha || '?'}`);
      console.log(`  Morada: ${c.morada || '?'}`);
      console.log(`  Email: ${c.email || '?'} | Tel: ${c.telefone || '?'}`);
      console.log(`  OS: ${c._count.ordensServico} | Faturas: ${c._count.faturas} | Agendas: ${c._count.agendas}`);
      if (c.navios.length > 0) {
        console.log(`  Navios (${c.navios.length}):`);
        for (const n of c.navios) {
          console.log(`    ${n.nome} (${n.matricula}) | ilha=${n.ilha}`);
        }
      } else {
        console.log(`  Navios: nenhum`);
      }
    }
  }

  await p.$disconnect();
})();
