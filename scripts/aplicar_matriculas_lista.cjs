const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const updates = [
  { id: 101, matricula: "PTPDL-118561-L" },
  { id: 137, matricula: "PTLDP-120446-L" },
  { id: 187, matricula: "PTHOR-117730-L" },
  { id: 249, matricula: "PTHOR-117700-L" },
  { id: 258, matricula: "PTPDL-114106-L" },
  { id: 317, matricula: "PTADH-114552-C" },
  { id: 398, matricula: "PTPDL-117964-L" },
  { id: 844, matricula: "PTLDP-118638-L" },
];

(async () => {
  for (const u of updates) {
    const antigo = await prisma.navio.findUnique({ where: { id: u.id }, select: { nome: true, matricula: true } });
    await prisma.navio.update({ where: { id: u.id }, data: { matricula: u.matricula } });
    console.log(`id=${u.id} | ${antigo.nome} | ${antigo.matricula} -> ${u.matricula}`);
  }
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
