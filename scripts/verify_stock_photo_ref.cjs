const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const refArg = process.argv[2];
  const referencia = String(refArg || "OSL9507").trim().toUpperCase();

  if (!referencia) {
    throw new Error("Fornece uma referência, ex.: OSL9507");
  }

  const item = await prisma.stock.findFirst({
    where: { referencia },
    select: {
      id: true,
      referencia: true,
      descricao: true,
      foto: true,
      codigoFabricante: true,
      updatedAt: true,
    },
  });

  if (!item) {
    console.log(`❌ Artigo ${referencia} não encontrado na BD.`);
    process.exitCode = 2;
    return;
  }

  console.log("✅ Artigo encontrado:");
  console.log(`- id: ${item.id}`);
  console.log(`- referencia: ${item.referencia}`);
  console.log(`- descricao: ${item.descricao || "(sem descrição)"}`);
  console.log(`- codigoFabricante: ${item.codigoFabricante || "(sem código)"}`);
  console.log(`- foto: ${item.foto || "NULL"}`);
  console.log(`- updatedAt: ${item.updatedAt ? item.updatedAt.toISOString() : "NULL"}`);

  if (!item.foto) {
    console.log("⚠️ A coluna foto está vazia (NULL). Executa o backfill.");
    process.exitCode = 3;
  }
}

main()
  .catch((error) => {
    console.error("❌ Erro na verificação:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
