import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function adicionarArtigosEmergenciaAsJangadas() {
  console.log(`\n🚀 ADICIONANDO ARTIGOS DE EMERGÊNCIA A TODAS AS JANGADAS\n`);
  console.log(`${"=".repeat(100)}`);

  try {
    // 1. Obter IDs dos artigos de emergência
    const paraquedas = await prisma.artigo.findFirst({
      where: { referencia: "20500023" },
    });
    const fachos = await prisma.artigo.findFirst({
      where: { referencia: "20500035" },
    });
    const potes = await prisma.artigo.findFirst({
      where: { referencia: "20500002" },
    });

    if (!paraquedas || !fachos || !potes) {
      console.error("❌ Artigos de emergência não encontrados!");
      return;
    }

    // 2. Obter todas as jangadas
    const jangadas = await prisma.jangada.findMany({
      include: { artigos: true },
    });

    console.log(`📝 Total de jangadas: ${jangadas.length}\n`);

    let adicionados = 0;
    let jaExistentes = 0;
    const relatorio: string[] = [];

    // 3. Adicionar artigos a cada jangada
    for (const jangada of jangadas) {
      // Verificar se já tem cada artigo
      const temParaquedas = jangada.artigos.some((a) => a.referencia === "20500023");
      const temFachos = jangada.artigos.some((a) => a.referencia === "20500035");
      const temPotes = jangada.artigos.some((a) => a.referencia === "20500002");

      if (!temParaquedas) {
        await prisma.artigoJangada.create({
          data: {
            name: "Paraquedas",
            quantidade: 2,
            referencia: "20500023",
            jangadaId: jangada.id,
          },
        });
        adicionados++;
        console.log(`✅ Paraquedas adicionado a ${jangada.serial}`);
      } else {
        jaExistentes++;
      }

      if (!temFachos) {
        await prisma.artigoJangada.create({
          data: {
            name: "Fachos de Mão",
            quantidade: 3,
            referencia: "20500035",
            jangadaId: jangada.id,
          },
        });
        adicionados++;
        console.log(`✅ Fachos de Mão adicionados a ${jangada.serial}`);
      } else {
        jaExistentes++;
      }

      if (!temPotes) {
        await prisma.artigoJangada.create({
          data: {
            name: "Potes",
            quantidade: 2,
            referencia: "20500002",
            jangadaId: jangada.id,
          },
        });
        adicionados++;
        console.log(`✅ Potes adicionados a ${jangada.serial}`);
      } else {
        jaExistentes++;
      }
    }

    // 4. Resumo final
    console.log(`\n${"=".repeat(100)}`);
    console.log(`📊 RESUMO FINAL\n`);
    console.log(`✅ Artigos adicionados: ${adicionados}`);
    console.log(`ℹ️  Artigos já existentes: ${jaExistentes}`);
    console.log(`📦 Total de artigos de emergência nas jangadas: ${adicionados + jaExistentes}`);

    // 5. Verificação final
    const jangadasComArtigos = await prisma.jangada.findMany({
      where: {
        artigos: {
          some: {
            referencia: {
              in: ["20500023", "20500035", "20500002"],
            },
          },
        },
      },
      include: {
        artigos: {
          where: {
            referencia: {
              in: ["20500023", "20500035", "20500002"],
            },
          },
        },
      },
    });

    console.log(`\n📋 Jangadas com artigos de emergência: ${jangadasComArtigos.length}/${jangadas.length}`);

    // Mostrar exemplo
    if (jangadasComArtigos.length > 0) {
      console.log(`\n📌 Exemplo - ${jangadasComArtigos[0].serial}:`);
      jangadasComArtigos[0].artigos.forEach((a) => {
        console.log(`  • ${a.name} - Qtd: ${a.quantidade}`);
      });
    }

    console.log(`\n${"=".repeat(100)}\n`);
    console.log(`✅ Sincronização de artigos de emergência concluída!\n`);

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

adicionarArtigosEmergenciaAsJangadas();
