import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function vincularComprimidosMarinhos() {
  console.log(`\n💊 VINCULANDO COMPRIMIDOS PARA ENJÔO (SEASICKNESS TABLETS) ÀS JANGADAS\n`);
  console.log(`${"=".repeat(100)}`);

  try {
    // 1. Procurar Seasickness Tablets no Stock
    const comprimidosStock = await prisma.stock.findUnique({
      where: { referencia: "30202051" },
    });

    if (!comprimidosStock) {
      console.error(`❌ Seasickness Tablets (30202051) não encontrado no Stock!`);
      return;
    }

    console.log(`✅ Encontrado no Stock:`);
    console.log(`   Nome: ${comprimidosStock.descricao}`);
    console.log(`   Referência: ${comprimidosStock.referencia}`);
    console.log(`   Quantidade: ${comprimidosStock.quantidade} unidades`);
    console.log(`   Preço: €${comprimidosStock.precoVenda}\n`);

    // 2. Criar/Verificar Artigo model
    let artigoDb = await prisma.artigo.findFirst({
      where: { referencia: "30202051" },
    });

    if (!artigoDb) {
      artigoDb = await prisma.artigo.create({
        data: {
          name: comprimidosStock.descricao,
          referencia: "30202051",
          descricao: `Seasickness Tablets - Comprimidos para Enjôo`,
          unit: "un",
          stock: comprimidosStock.quantidade,
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

    // 4. Adicionar Seasickness Tablets a cada jangada
    for (const jangada of jangadas) {
      // Verificar se já tem Comprimidos para Enjôo
      const temComprimidos = jangada.artigos.some(
        (a) => a.referencia === "30202051"
      );

      if (!temComprimidos) {
        await prisma.artigoJangada.create({
          data: {
            name: comprimidosStock.descricao,
            quantidade: 1,
            referencia: "30202051",
            codigoFabricante: comprimidosStock.codigoFabricante || undefined,
            jangadaId: jangada.id,
          },
        });
        adicionados++;
        if (adicionados <= 10 || adicionados % 50 === 0) {
          console.log(`✅ Seasickness Tablets adicionados a ${jangada.serial}`);
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
    console.log(`✅ Seasickness Tablets adicionados: ${adicionados}`);
    console.log(`ℹ️  Já existentes: ${jaExistentes}`);
    console.log(`📦 Total de jangadas com Seasickness Tablets: ${adicionados + jaExistentes}/${jangadas.length}`);

    // 6. Verificação final
    const jangadasComComprimidos = await prisma.jangada.findMany({
      where: {
        artigos: {
          some: {
            referencia: "30202051",
          },
        },
      },
      include: {
        artigos: {
          where: {
            referencia: "30202051",
          },
        },
      },
    });

    console.log(
      `\n🔍 Verificação: ${jangadasComComprimidos.length} jangadas têm Seasickness Tablets\n`
    );

    // 7. Mostrar exemplos
    if (jangadasComComprimidos.length > 0) {
      console.log(`📌 Exemplos de jangadas com Seasickness Tablets:`);
      jangadasComComprimidos.slice(0, 5).forEach((j) => {
        console.log(`  • ${j.serial}`);
      });
    }

    console.log(`\n${"=".repeat(100)}\n`);
    console.log(`✅ Vinculação de Seasickness Tablets concluída com sucesso!\n`);

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

vincularComprimidosMarinhos();
