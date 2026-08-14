const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const items = await p.stock.findMany({
    where: {
      OR: [
        { descricao: { contains: "Apito" } },
        { descricao: { contains: "apito" } },
        { descricao: { contains: "Heliog" } },
        { descricao: { contains: "heliog" } },
        { descricao: { contains: "WHISTLE" } },
        { descricao: { contains: "HELIO" } },
        { referencia: { contains: "WHISTLE" } },
        { referencia: { contains: "HELIO" } },
      ],
    },
    select: { id: true, referencia: true, descricao: true, categoria: true },
  });
  console.log(JSON.stringify(items, null, 2));
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
