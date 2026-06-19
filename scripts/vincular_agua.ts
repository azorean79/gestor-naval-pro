import { PrismaClient } from "@prisma/client";
import { DRINKING_WATER_REFERENCE_CANDIDATES, DRINKING_WATER_STOCK_REFERENCE } from "../src/lib/stock-reference-rules";

const prisma = new PrismaClient();

async function vincularAguaJangadas() {
  console.log("\n🌊 VINCULANDO ÁGUA (WATER) ÀS JANGADAS\n");
  console.log("=".repeat(80));

  try {
    // 1. Buscar a água no Stock
    const agua = await prisma.stock.findFirst({
      where: { referencia: { in: [...DRINKING_WATER_REFERENCE_CANDIDATES] } },
    });

    if (!agua) {
      console.log(`❌ Água com referência ${DRINKING_WATER_STOCK_REFERENCE} não encontrada no Stock!`);
      return;
    }

    console.log("\n✓ Encontrado no Stock:");
    console.log(`   Nome: ${agua.descricao}`);
    console.log(`   Referência: ${agua.referencia}`);
    console.log(`   Quantidade: ${agua.quantidade} unidades`);
    console.log(`   Preço: €${agua.precoVenda}`);

    // 2. Buscar todas as jangadas
    const jangadas = await prisma.jangada.findMany({
      select: { id: true, serial: true },
    });

    console.log(`\n🔄 Processando ${jangadas.length} jangadas...\n`);

    let adicionadas = 0;
    let jaExistentes = 0;

    for (let i = 0; i < jangadas.length; i++) {
      const jangada = jangadas[i];

      // Verificar se já existe
      const temArtigo = await prisma.artigoJangada.findFirst({
        where: {
          jangadaId: jangada.id,
          referencia: DRINKING_WATER_STOCK_REFERENCE,
        },
      });

      if (!temArtigo) {
        await prisma.artigoJangada.create({
          data: {
            jangadaId: jangada.id,
            name: "Água (Water)",
            referencia: DRINKING_WATER_STOCK_REFERENCE,
            quantidade: 1,
          },
        });
        adicionadas++;
      } else {
        jaExistentes++;
      }

      // Log de progresso
      if ((i + 1) % 50 === 0) {
        console.log(`   ✓ Processadas ${i + 1}/${jangadas.length} jangadas`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n🎯 RESUMO FINAL\n");
    console.log(`✓ Água adicionada: ${adicionadas}`);
    console.log(`ℹ️  Já existentes: ${jaExistentes}`);
    console.log(`📦 Total de jangadas com Água: ${adicionadas + jaExistentes}/${jangadas.length}\n`);

    // 3. Verificação
    const verificacao = await prisma.artigoJangada.count({
      where: {
        referencia: DRINKING_WATER_STOCK_REFERENCE,
      },
    });

    console.log(`🔍 Verificação: ${verificacao} jangadas têm Água\n`);

    // 4. Exemplos
    const exemplos = await prisma.artigoJangada.findMany({
      where: { referencia: DRINKING_WATER_STOCK_REFERENCE },
      include: { Jangada: true },
      take: 5,
    });

    console.log("🎁 Exemplos de jangadas com Água:");
    exemplos.forEach((ex) => {
      console.log(`  • ${ex.Jangada?.serial || ex.jangadaId}`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("\n✅ Vinculação de Água concluída com sucesso!\n");
  } catch (error) {
    console.error("❌ Erro ao vincular água:", error);
  } finally {
    await prisma.$disconnect();
  }
}

vincularAguaJangadas();
