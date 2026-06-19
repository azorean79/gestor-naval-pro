import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function vincularFirstAidKit() {
  console.log(`\n🏥 VINCULANDO FIRST AID KIT ÀS JANGADAS\n`);
  console.log(`${"=".repeat(100)}`);

  try {
    // 1. Procurar First Aid Kit no Stock
    const firstAidStock = await prisma.stock.findUnique({
      where: { referencia: "30202207" },
    });

    if (!firstAidStock) {
      console.error(`❌ First Aid Kit (30202207) não encontrado no Stock!`);
      return;
    }

    console.log(`✅ Encontrado no Stock:`);
    console.log(`   Nome: ${firstAidStock.descricao}`);
    console.log(`   Referência: ${firstAidStock.referencia}`);
    console.log(`   Quantidade: ${firstAidStock.quantidade} unidades`);
    console.log(`   Preço: €${firstAidStock.precoVenda}\n`);

    // 2. Criar/Verificar Artigo model
    let artigoDb = await prisma.artigo.findFirst({
      where: { referencia: "30202207" },
    });

    if (!artigoDb) {
      artigoDb = await prisma.artigo.create({
        data: {
          name: firstAidStock.descricao,
          referencia: "30202207",
          descricao: `First Aid Kit - Farmacia Solas`,
          unit: "un",
          stock: firstAidStock.quantidade,
          minStock: 1,
        },
      });
      console.log(`✅ Artigo criado: ${artigoDb.name} (ID: ${artigoDb.id})\n`);
    } else {
      console.log(`✅ Artigo já existe: ${artigoDb.name} (ID: ${artigoDb.id})\n`);
    }

    // 3. Obter todas as jangadas
    const jangadas = await prisma.jangada.findMany({
      include: { artigos: true },
    });

    console.log(`📝 Processando ${jangadas.length} jangadas...\n`);

    let adicionados = 0;
    let jaExistentes = 0;

    // 4. Adicionar First Aid Kit a cada jangada
    for (const jangada of jangadas) {
      // Verificar se já tem First Aid Kit
      const temFirstAid = jangada.artigos.some(
        (a) => a.referencia === "30202207"
      );

      if (!temFirstAid) {
        await prisma.artigoJangada.create({
          data: {
            name: firstAidStock.descricao,
            quantidade: 1,
            referencia: "30202207",
            codigoFabricante: firstAidStock.codigoFabricante || undefined,
            jangadaId: jangada.id,
          },
        });
        adicionados++;
        if (adicionados <= 10 || adicionados % 50 === 0) {
          console.log(`✅ First Aid Kit adicionado a ${jangada.serial}`);
        }
      } else {
        jaExistentes++;
      }
    }

    if (adicionados > 10) {
      console.log(`   ... e mais ${adicionados - 10} jangadas`);
    }

    // 5. Resumo final
    console.log(`\n${"=".repeat(100)}`);
    console.log(`📊 RESUMO FINAL\n`);
    console.log(`✅ First Aid Kit adicionados: ${adicionados}`);
    console.log(`ℹ️  Já existentes: ${jaExistentes}`);
    console.log(`📦 Total de jangadas com First Aid Kit: ${adicionados + jaExistentes}/${jangadas.length}`);

    // 6. Verificação final
    const jangadasComFirstAid = await prisma.jangada.findMany({
      where: {
        artigos: {
          some: {
            referencia: "30202207",
          },
        },
      },
      include: {
        artigos: {
          where: {
            referencia: "30202207",
          },
        },
      },
    });

    console.log(
      `\n🔍 Verificação: ${jangadasComFirstAid.length} jangadas têm First Aid Kit\n`
    );

    // 7. Mostrar exemplos
    if (jangadasComFirstAid.length > 0) {
      console.log(`📌 Exemplos de jangadas com First Aid Kit:`);
      jangadasComFirstAid.slice(0, 5).forEach((j) => {
        console.log(`  • ${j.serial}`);
      });
    }

    console.log(`\n${"=".repeat(100)}\n`);
    console.log(`✅ Vinculação de First Aid Kit concluída com sucesso!\n`);

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

vincularFirstAidKit();
