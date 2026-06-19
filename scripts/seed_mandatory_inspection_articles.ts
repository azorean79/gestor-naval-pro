#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ArtigoObrigatorio {
  referencia: string;
  nome: string;
  categoria: string;
  quantidadeDefault: number;
}

const ARTIGOS_OBRIGATORIOS_INSPECAO: ArtigoObrigatorio[] = [
  // Cintas de contentor - obrigatórias em TODA inspeção
  {
    referencia: "STRAP-GERAL-1",
    nome: "Cintas de Fecho Contentor (renovação obrigatória)",
    categoria: "Cintas & Fecaduras",
    quantidadeDefault: 1,
  },
  // Pyrotechnics - obrigatórias em inspeção
  {
    referencia: "20500023",
    nome: "Paraquedas",
    categoria: "Emergência",
    quantidadeDefault: 4,
  },
  {
    referencia: "20500035",
    nome: "Fachos de Mão",
    categoria: "Emergência",
    quantidadeDefault: 6,
  },
  {
    referencia: "20500002",
    nome: "Potes de Fumo",
    categoria: "Emergência",
    quantidadeDefault: 2,
  },
  // Painter Lines - obrigatórias
  {
    referencia: "PAINTER-GERAL",
    nome: "Painter Line (Retenida) - renovação obrigatória",
    categoria: "Amarrações & Retenções",
    quantidadeDefault: 1,
  },
  // First Aid - obrigatório
  {
    referencia: "30202207",
    nome: "Kit de Primeiros Socorros",
    categoria: "Saúde & Segurança",
    quantidadeDefault: 1,
  },
];

const CATEGORIAS_OBRIGATORIAS = [
  {
    nome: "Cintas & Fecaduras",
    descricao: "Cintas de fecho e componentes de fecho de contentores",
    ordem: 1,
  },
  {
    nome: "Amarrações & Retenções",
    descricao: "Painter lines e retenidas de emergência",
    ordem: 2,
  },
  {
    nome: "Emergência",
    descricao: "Equipamento de sinalização e sinais de emergência (Pyrotechnics)",
    ordem: 3,
  },
  {
    nome: "Saúde & Segurança",
    descricao: "Kits de primeiros socorros e equipamento médico",
    ordem: 4,
  },
  {
    nome: "Equipamento de Sobrevivência",
    descricao: "Água, rações, visibilidade, orientação",
    ordem: 5,
  },
];

async function main() {
  const dryRun = !process.argv.includes("--apply");

  console.log("\n📋 ADD MANDATORY INSPECTION ARTICLES");
  console.log(`Mode: ${dryRun ? "DRY-RUN" : "APPLY"}\n`);

  let processed = 0;
  let linked = 0;
  let skipped = 0;

  // Get all jangadas
  const jangadas = await prisma.jangada.findMany({
    select: { id: true, serial: true, capacity: true, brand: true, model: true },
  });

  console.log(`Processando ${jangadas.length} jangadas...\n`);

  for (const jangada of jangadas) {
    try {
      // Para cada jangada, vincular os artigos obrigatórios
      const artigosAkali = ARTIGOS_OBRIGATORIOS_INSPECAO.map((artigo) => ({
        referencia: artigo.referencia,
        name: artigo.nome,
        quantidade: artigo.quantidadeDefault,
        jangadaId: jangada.id,
      }));

      if (!dryRun) {
        for (const artigo of artigosAkali) {
          // Verificar se já existe
          const existe = await prisma.artigoJangada.findFirst({
            where: {
              jangadaId: artigo.jangadaId,
              referencia: artigo.referencia,
            },
          });

          if (!existe) {
            await prisma.artigoJangada.create({
              data: artigo,
            });
            linked++;
          } else {
            skipped++;
          }
        }
      } else {
        linked += artigosAkali.length;
      }

      processed++;
    } catch (err: any) {
      console.error(
        `❌ ERROR Processing jangada ${jangada.serial}: ${err.message}`
      );
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Jangadas processadas: ${processed}`);
  console.log(`   ✅ Artigos vinculados: ${linked}`);
  console.log(`   ⏭️  Artigos já existentes: ${skipped}`);

  console.log(
    dryRun
      ? "\n💡 Para aplicar: npx tsx scripts/seed_mandatory_inspection_articles.ts --apply"
      : "\n✅ Artigos obrigatórios de inspeção adicionados com sucesso!"
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
