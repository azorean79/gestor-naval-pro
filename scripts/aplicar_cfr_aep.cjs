const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const updates = [
  { id: 959, cfr: "PRT000020069" },   // LAGOAL
  { id: 965, cfr: "PRT000020341" },   // NOVO LAGOAL
  { id: 970, cfr: "PRT000020585" },   // GARCIA MIGUEL
  { id: 984, cfr: "PRT000022560" },   // ESTRELA DE ÂNCORA
];

(async () => {
  for (const u of updates) {
    const antigo = await prisma.navio.findUnique({ where: { id: u.id }, select: { nome: true, cfr: true } });
    await prisma.navio.update({ where: { id: u.id }, data: { cfr: u.cfr } });
    console.log(`id=${u.id} | ${antigo.nome} | cfr ${antigo.cfr || '(vazio)'} -> ${u.cfr}`);
  }
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
