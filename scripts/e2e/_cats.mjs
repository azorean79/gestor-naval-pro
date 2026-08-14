import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const cats = await p.stock.groupBy({ by: ["categoria"], _count: true, orderBy: { _count: { categoria: "desc" } } });
console.log(JSON.stringify(cats, null, 2));
const samples = await p.stock.findMany({ take: 80, select: { id: true, referencia: true, descricao: true, categoria: true } });
console.log("---samples---");
for (const s of samples) console.log([s.categoria, s.referencia, s.descricao].join(" | "));
await p.$disconnect();
