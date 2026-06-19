import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n📞 RELATÓRIO DE CONTACTOS DE CLIENTES PENDENTES\n");

  const clientes = await prisma.cliente.findMany({
    where: {
      OR: [{ email: null }, { telefone: null }, { telmovel: null }],
    },
    include: {
      navios: {
        select: {
          id: true,
          nome: true,
          matricula: true,
          ilha: true,
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  console.log(`⚠️ Clientes com contactos incompletos: ${clientes.length}`);
  console.log("--------------------------------------------------------------------------------");

  clientes.slice(0, 50).forEach((c) => {
    const faltas = [!c.email ? "email" : null, !c.telefone ? "telefone" : null, !c.telmovel ? "telemóvel" : null]
      .filter(Boolean)
      .join(", ");
    console.log(`• ${c.nome} | falta: ${faltas} | navios: ${c.navios.length}`);
  });

  if (clientes.length > 50) {
    console.log(`... +${clientes.length - 50} clientes`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
