import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncClientesNavios() {
  console.log(`\n🔄 SINCRONIZAÇÃO DE DADOS - CLIENTES E NAVIOS\n`);

  try {
    // 1. Listar todos os clientes dos Açores
    const clientesAçores = await prisma.cliente.findMany({
      where: { ilha: "Açores" },
      include: { navios: true },
      orderBy: { nome: "asc" },
    });

    console.log(`📊 Total de clientes dos Açores: ${clientesAçores.length}`);
    console.log(`📊 Total de navios associados: ${clientesAçores.reduce((sum, c) => sum + c.navios.length, 0)}\n`);

    // 2. Atualizações de dados
    const updates = await Promise.all([
      // Normalizar nomes - converter first letter para maiúscula
      ...clientesAçores.map(async (cliente) => {
        const nomeNormalizado = cliente.nome
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");

        if (cliente.nome !== nomeNormalizado) {
          return prisma.cliente.update({
            where: { id: cliente.id },
            data: { nome: nomeNormalizado },
          });
        }
        return null;
      }),
    ]);

    const clientesAtualizados = updates.filter((u) => u !== null).length;
    console.log(
      `✅ Clientes normalizados: ${clientesAtualizados}`
    );

    // 3. Normalizar nomes de navios
    const naviosUpdate = await prisma.navio.findMany({
      where: { ilha: "Açores" },
    });

    const navioUpdates = await Promise.all(
      naviosUpdate.map(async (navio) => {
        const nomeNormalizado = navio.nome
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");

        if (navio.nome !== nomeNormalizado) {
          return prisma.navio.update({
            where: { id: navio.id },
            data: { nome: nomeNormalizado },
          });
        }
        return null;
      })
    );

    const naviosAtualizados = navioUpdates.filter((u) => u !== null).length;
    console.log(`✅ Navios normalizados: ${naviosAtualizados}\n`);

    // 4. Garantir que todos os clientes têm island preenchida
    const clientesSemIlha = await prisma.cliente.findMany({
      where: { OR: [{ ilha: null }, { ilha: "" }] },
    });

    if (clientesSemIlha.length > 0) {
      const atualiza = await prisma.cliente.updateMany({
        where: { OR: [{ ilha: null }, { ilha: "" }] },
        data: { ilha: "Açores" },
      });
      console.log(`✅ Clientes atualizados com ilha "Açores": ${atualiza.count}`);
    }

    // 5. Status final
    const clientesFinais = await prisma.cliente.findMany({
      where: { ilha: "Açores" },
      include: { navios: true },
    });

    console.log(`\n${"=".repeat(80)}`);
    console.log(`✅ SINCRONIZAÇÃO CONCLUÍDA`);
    console.log(`${"=".repeat(80)}`);
    console.log(`📋 Clientes dos Açores: ${clientesFinais.length}`);
    console.log(`⛵ Navios associados: ${clientesFinais.reduce((sum, c) => sum + c.navios.length, 0)}`);
    console.log(`${"=".repeat(80)}\n`);

    // 6. Listar resumo
    console.log(`📋 RESUMO DOS CLIENTES E NAVIOS:\n`);
    clientesFinais.forEach((cliente) => {
      console.log(`${cliente.nome} (NIF: ${cliente.nif})`);
      if (cliente.navios.length > 0) {
        cliente.navios.forEach((navio) => {
          console.log(`  ├─ ${navio.nome}`);
        });
      } else {
        console.log(`  └─ [Sem navios]`);
      }
    });

    console.log(`\n${"=".repeat(80)}`);
    console.log(`✅ Base de dados sincronizada com sucesso!`);
    console.log(`${"=".repeat(80)}\n`);

  } catch (error) {
    console.error("❌ Erro na sincronização:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncClientesNavios();
