import { PrismaClient } from "@prisma/client";
import {
  FOOD_RATIONS_REFERENCE_CANDIDATES,
  FOOD_RATIONS_STOCK_REFERENCE,
} from "../src/lib/stock-reference-rules";

const prisma = new PrismaClient();

async function vincularFoodRations() {
  console.log(`\n🍖 VINCULANDO RAÇÕES DE COMIDA (FOOD RATIONS) ÀS JANGADAS\n`);
  console.log(`${"=".repeat(100)}`);

  try {
    // 1. Procurar Rações no Stock
    const racoesStock = await prisma.stock.findFirst({
      where: { referencia: { in: [...FOOD_RATIONS_REFERENCE_CANDIDATES] } },
    });

    if (!racoesStock) {
      console.error(`❌ Rações de Comida (${FOOD_RATIONS_STOCK_REFERENCE}) não encontrada no Stock!`);
      return;
    }

    console.log(`✅ Encontrado no Stock:`);
    console.log(`   Nome: ${racoesStock.descricao}`);
    console.log(`   Referência: ${racoesStock.referencia}`);
    console.log(`   Quantidade: ${racoesStock.quantidade} unidades`);
    console.log(`   Preço: €${racoesStock.precoVenda}\n`);

    // 2. Criar/Verificar Artigo model
    let artigoDb = await prisma.artigo.findFirst({
      where: { referencia: FOOD_RATIONS_STOCK_REFERENCE },
    });

    if (!artigoDb) {
      artigoDb = await prisma.artigo.create({
        data: {
          name: racoesStock.descricao,
          referencia: FOOD_RATIONS_STOCK_REFERENCE,
          descricao: `Food Rations - Rações de Comida de Emergência`,
          unit: "un",
          stock: racoesStock.quantidade,
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

    // 4. Adicionar Rações a cada jangada
    for (const jangada of jangadas) {
      // Verificar se já tem Rações
      const temRacoes = jangada.artigos.some(
        (a) => a.referencia === FOOD_RATIONS_STOCK_REFERENCE
      );

      if (!temRacoes) {
        await prisma.artigoJangada.create({
          data: {
            name: racoesStock.descricao,
            quantidade: 1,
            referencia: FOOD_RATIONS_STOCK_REFERENCE,
            codigoFabricante: racoesStock.codigoFabricante || undefined,
            jangadaId: jangada.id,
          },
        });
        adicionados++;
        if (adicionados <= 10 || adicionados % 50 === 0) {
          console.log(`✅ Rações adicionadas a ${jangada.serial}`);
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
    console.log(`✅ Rações adicionadas: ${adicionados}`);
    console.log(`ℹ️  Já existentes: ${jaExistentes}`);
    console.log(`📦 Total de jangadas com Rações de Comida: ${adicionados + jaExistentes}/${jangadas.length}`);

    // 6. Verificação final
    const jangadasComRacoes = await prisma.jangada.findMany({
      where: {
        artigos: {
          some: {
            referencia: FOOD_RATIONS_STOCK_REFERENCE,
          },
        },
      },
      include: {
        artigos: {
          where: {
            referencia: FOOD_RATIONS_STOCK_REFERENCE,
          },
        },
      },
    });

    console.log(
      `\n🔍 Verificação: ${jangadasComRacoes.length} jangadas têm Rações de Comida\n`
    );

    // 7. Mostrar exemplos
    if (jangadasComRacoes.length > 0) {
      console.log(`📌 Exemplos de jangadas com Rações:`);
      jangadasComRacoes.slice(0, 5).forEach((j) => {
        console.log(`  • ${j.serial}`);
      });
    }

    console.log(`\n${"=".repeat(100)}\n`);
    console.log(`✅ Vinculação de Rações de Comida concluída com sucesso!\n`);

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

vincularFoodRations();
