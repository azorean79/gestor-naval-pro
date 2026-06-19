import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ArtigoEmergencia {
  nome: string;
  referencia: string;
  descricao: string;
  categoria: string;
}

// Artigos de emergência para sincronizar com jangadas
const artigos: ArtigoEmergencia[] = [
  {
    nome: "Paraquedas",
    referencia: "20500023",
    descricao: "Paraquedas para sinalizadores de emergência",
    categoria: "Emergência",
  },
  {
    nome: "Fachos de Mão",
    referencia: "20500035",
    descricao: "Fachos de mão para sinalizadores de emergência",
    categoria: "Emergência",
  },
  {
    nome: "Potes",
    referencia: "20500002",
    descricao: "Potes para sinalizadores de fumo de emergência",
    categoria: "Emergência",
  },
];

async function sincronizarArtigosEmergencia() {
  console.log(`\n🔄 SINCRONIZAÇÃO DE ARTIGOS DE EMERGÊNCIA COM JANGADAS\n`);
  console.log(`${"=".repeat(100)}`);

  try {
    for (const artigo of artigos) {
      console.log(`\n📦 Processando: ${artigo.nome} (${artigo.referencia})`);

      // 1. Verificar se existe no Stock
      const stock = await prisma.stock.findUnique({
        where: { referencia: artigo.referencia },
      });

      if (stock) {
        console.log(`  ✅ Encontrado no Stock: ${stock.descricao}`);
        console.log(`     Quantidade: ${stock.quantidade}`);
        console.log(`     Preço Venda: €${stock.precoVenda}`);
      } else {
        console.log(`  ⚠️  NÃO ENCONTRADO NO STOCK`);
      }

      // 2. Verificar se existe em Artigo model
      let artigoDb = await prisma.artigo.findFirst({
        where: { referencia: artigo.referencia },
      });

      if (artigoDb) {
        console.log(`  ✅ Encontrado em Artigos: ${artigoDb.name}`);
      } else {
        console.log(`  ➕ CRIANDO Artigo...`);
        artigoDb = await prisma.artigo.create({
          data: {
            name: artigo.nome,
            referencia: artigo.referencia,
            descricao: artigo.descricao,
            unit: "un",
            stock: stock?.quantidade || 0,
            minStock: 2,
          },
        });
        console.log(`  ✅ Artigo criado com sucesso (ID: ${artigoDb.id})`);
      }

      // 3. Listar jangadas que deveriam ter este artigo
      if (artigoDb) {
        const jangadas = await prisma.jangada.findMany({
          include: { artigos: true },
        });

        console.log(`  🔍 Verificando ${jangadas.length} jangadas...`);

        let jangadasComArtigo = 0;
        const jangadasSemArtigo: string[] = [];

        for (const jangada of jangadas) {
          const temArtigo = jangada.artigos.some(
            (a) => a.referencia === artigo.referencia
          );

          if (temArtigo) {
            jangadasComArtigo++;
          } else {
            jangadasSemArtigo.push(jangada.serial);
          }
        }

        console.log(`     ✅ Com artigo: ${jangadasComArtigo}`);
        console.log(`     ❌ Sem artigo: ${jangadasSemArtigo.length}`);

        if (jangadasSemArtigo.length > 0 && jangadasSemArtigo.length <= 5) {
          console.log(`     Jangadas sem ${artigo.nome}:`);
          jangadasSemArtigo.slice(0, 5).forEach((serial) => {
            console.log(`       • ${serial}`);
          });
        }
      }
    }

    // 4. Resumo final
    console.log(`\n${"=".repeat(100)}`);
    console.log(`📋 RESUMO DA SINCRONIZAÇÃO\n`);

    for (const artigo of artigos) {
      const stock = await prisma.stock.findUnique({
        where: { referencia: artigo.referencia },
      });
      const artigoDb = await prisma.artigo.findFirst({
        where: { referencia: artigo.referencia },
      });

      console.log(`${artigo.nome} (${artigo.referencia}):`);
      console.log(
        `  Stock: ${stock ? `✅ ${stock.quantidade} unidades` : "❌ Não existe"}`
      );
      console.log(
        `  Artigo: ${artigoDb ? `✅ ID ${artigoDb.id}` : "❌ Não criado"}`
      );
      console.log();
    }

    console.log(`${"=".repeat(100)}\n`);

    // 5. Visualizar artigos com categoria "Emergência"
    const artgosEmergencia = await prisma.stock.findMany({
      where: { categoria: "Emergência" },
      orderBy: { referencia: "asc" },
    });

    console.log(`📦 ARTIGOS DE EMERGÊNCIA NO STOCK (${artgosEmergencia.length}):\n`);
    artgosEmergencia.forEach((a) => {
      console.log(`  • ${a.referencia} - ${a.descricao}`);
      console.log(`    Quantidade: ${a.quantidade} | Preço: €${a.precoVenda}`);
    });

    console.log(`\n${"=".repeat(100)}\n`);
    console.log(`✅ Sincronização concluída com sucesso!\n`);

  } catch (error) {
    console.error("❌ Erro na sincronização:", error);
  } finally {
    await prisma.$disconnect();
  }
}

sincronizarArtigosEmergencia();
