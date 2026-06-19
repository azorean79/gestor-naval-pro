import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const REFERENCIA = "30202084";
const NOME = "Racoes de Emergencia";
const WRONG_NAMES = ["Racao de Emergencia", "Rações de Emergência"];

async function main() {
  console.log("=== Racoes de Emergencia - Fix & Sync ===\n");

  // 1. Corrigir stock ID 45 se necessário
  const stock45 = await prisma.stock.findUnique({ where: { id: 45 } });
  if (stock45 && stock45.descricao !== NOME) {
    await prisma.stock.update({ where: { id: 45 }, data: { descricao: NOME } });
    console.log("Corrigido nome do Stock ID 45 para: " + NOME);
  }

  // 2. Verificar / criar no Stock (Referencia)
  let stockItem = await prisma.stock.findFirst({ where: { referencia: REFERENCIA } });
  if (stockItem) {
    console.log("Stock ja existe: ID " + stockItem.id + " | " + stockItem.descricao);
  } else {
    stockItem = await prisma.stock.create({
      data: {
        referencia: REFERENCIA,
        descricao: NOME,
        categoria: "CONSUMIVEIS",
        associavelJangada: true,
        quantidade: 0,
        quantidadeMinima: 10,
        estadoArtigo: "ATIVO",
        precoVenda: 0,
      },
    });
    console.log("Criado no stock: ID " + stockItem.id);
  }

  // 3. Corrigir nomes nas jangadas e sincronizar
  const jangadas = await prisma.jangada.findMany({ select: { id: true, serial: true } });
  let added = 0;
  let skipped = 0;
  let renamed = 0;

  for (const j of jangadas) {
    const existing = await prisma.artigoJangada.findFirst({
      where: {
        jangadaId: j.id,
        OR: [{ referencia: REFERENCIA }, { name: { in: [NOME, ...WRONG_NAMES] } }],
      },
    });

    if (existing) {
      if (WRONG_NAMES.includes(existing.name) || (existing.referencia !== REFERENCIA)) {
        await prisma.artigoJangada.update({
          where: { id: existing.id },
          data: { name: NOME, referencia: REFERENCIA },
        });
        console.log("  FIX  Jangada " + j.id + " (" + j.serial + ") - Nome corrigido");
        renamed++;
      } else {
        console.log("  SKIP Jangada " + j.id + " (" + j.serial + ") - ja esta correto");
        skipped++;
      }
    } else {
      await prisma.artigoJangada.create({
        data: { jangadaId: j.id, name: NOME, referencia: REFERENCIA, quantidade: 0 },
      });
      console.log("  OK   Jangada " + j.id + " (" + j.serial + ") - adicionado");
      added++;
    }
  }

  console.log("\n=== Resultado ===");
  console.log("Adicionado a: " + added + " jangadas");
  console.log("Corrigido em: " + renamed + " jangadas");
  console.log("Ja estava correto: " + skipped + " jangadas");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
