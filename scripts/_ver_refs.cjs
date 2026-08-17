const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient({ datasources: { db: { url: "file:./local.db" } } });
(async () => {
  const stock = await p.stock.findMany({
    where: { OR: [{ referencia: { contains: "L-NAP" } }, { referenciaSubstituta: { contains: "L-NAP" } }, { codigoFabricante: { contains: "L-NAP" } }] },
    select: { id: true, referencia: true, descricao: true, codigoFabricante: true },
    take: 30,
  });
  console.log("Stock L-NAP:", JSON.stringify(stock, null, 1));

  const artigo = await p.artigo.findMany({
    where: { OR: [{ referencia: { contains: "L-NAP" } }, { codigoFabricante: { contains: "L-NAP" } }] },
    select: { id: true, nome: true, referencia: true, codigoFabricante: true },
    take: 30,
  });
  console.log("Artigo L-NAP:", JSON.stringify(artigo, null, 1));

  const sampleRefs = await p.stock.findMany({ distinct: ["referencia"], where: { referencia: { not: null } }, select: { referencia: true }, orderBy: { referencia: "asc" }, take: 200 });
  const lnapLike = sampleRefs.filter((r) => /L.*NAP/.test(r.referencia) || /NAP/i.test(r.referencia));
  console.log("refs NAP-like:", JSON.stringify(lnapLike.map((r) => r.referencia)));

  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
