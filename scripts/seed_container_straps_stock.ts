#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ContainerStrapEntry {
  referencia: string;
  descricao: string;
  codigoFabricante?: string;
  tipoConteiner: string;
  tamanho?: string;
  quantidadeCintas: number;
  categoria: string;
  precoCompra?: number;
  precoVenda: number;
  aplicavelMarcaJangada?: string;
  aplicavelModeloJangada?: string;
  pagina?: string;
}

const CONTAINER_STRAPS: ContainerStrapEntry[] = [
  // MK 10 - D508 straps (generic, used across MK 10)
  {
    referencia: "D508-2.1M",
    descricao: "Cinta de fecho D508 para contentor MK 10 (2,1 m)",
    tipoConteiner: "MK 10",
    quantidadeCintas: 1, // per strap
    categoria: "Cintas & Fecaduras",
    precoVenda: 45.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1120",
  },
  {
    referencia: "D508-2.8M",
    descricao: "Cinta de fecho D508 para contentor MK 14 (2,8 m)",
    tipoConteiner: "MK 14",
    quantidadeCintas: 1,
    categoria: "Cintas & Fecaduras",
    precoVenda: 52.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1124",
  },
  {
    referencia: "D508-2.5M",
    descricao: "Cinta de fecho D508 para contentor MK 14 alternativa (2,5 m)",
    tipoConteiner: "MK 14",
    quantidadeCintas: 1,
    categoria: "Cintas & Fecaduras",
    precoVenda: 50.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1124",
  },

  // MK 10 Throwover - Quantities by size
  {
    referencia: "STRAP-MK10-SIZE3",
    descricao: "Jogo cintas contentor MK 10 Throwover - tamanho 3 (4 unidades)",
    tipoConteiner: "MK 10 Throwover",
    tamanho: "3",
    quantidadeCintas: 4,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 180.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1120",
  },
  {
    referencia: "STRAP-MK10-SIZE6",
    descricao: "Jogo cintas contentor MK 10 Throwover - tamanho 6 (6 unidades)",
    tipoConteiner: "MK 10 Throwover",
    tamanho: "6",
    quantidadeCintas: 6,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 270.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1120",
  },
  {
    referencia: "STRAP-MK10-SIZE7",
    descricao: "Jogo cintas contentor MK 10 Throwover - tamanho 7 (8 unidades)",
    tipoConteiner: "MK 10 Throwover",
    tamanho: "7",
    quantidadeCintas: 8,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 360.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1120",
  },
  {
    referencia: "STRAP-MK10-SIZE9",
    descricao: "Jogo cintas contentor MK 10 Throwover - tamanho 9 (8 unidades, 25p)",
    tipoConteiner: "MK 10 Throwover",
    tamanho: "9",
    quantidadeCintas: 8,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 360.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1120",
  },

  // MK 10 Davit-launch (DL) - Quantities based on Table 1117/1118
  {
    referencia: "STRAP-MK10DL-SIZE4",
    descricao: "Jogo cintas contentor MK 10 Davit-launch - tamanho 4 (4 cintas, 6/8 crimpagens)",
    tipoConteiner: "MK 10 Davit",
    tamanho: "4",
    quantidadeCintas: 4,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 180.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV, DSB LR07",
    pagina: "1128-1129",
  },
  {
    referencia: "STRAP-MK10DL-SIZE6",
    descricao: "Jogo cintas contentor MK 10 Davit-launch - tamanho 6 (6 cintas, 8/12 crimpagens)",
    tipoConteiner: "MK 10 Davit",
    tamanho: "6",
    quantidadeCintas: 6,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 270.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV, DSB LR07",
    pagina: "1128-1129",
  },
  {
    referencia: "STRAP-MK10DL-SIZE7",
    descricao: "Jogo cintas contentor MK 10 Davit-launch - tamanho 7 (10 cintas, 12 crimpagens)",
    tipoConteiner: "MK 10 Davit",
    tamanho: "7",
    quantidadeCintas: 10,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 450.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV, DSB LR07",
    pagina: "1128-1129",
  },
  {
    referencia: "STRAP-MK10DL-SIZE9",
    descricao: "Jogo cintas contentor MK 10 Davit-launch - tamanho 9 (2 cintas, 2 crimpagens)",
    tipoConteiner: "MK 10 Davit",
    tamanho: "9",
    quantidadeCintas: 2,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 90.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV, DSB LR07",
    pagina: "1128-1129",
  },

  // MK 14 Throwover - Quantities by size  
  {
    referencia: "STRAP-MK14-SIZE12",
    descricao: "Jogo cintas contentor MK 14 Throwover - tamanho 12 (4 cintas)",
    tipoConteiner: "MK 14 Throwover",
    tamanho: "12",
    quantidadeCintas: 4,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 180.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1124",
  },
  {
    referencia: "STRAP-MK14-SIZE14",
    descricao: "Jogo cintas contentor MK 14 Throwover - tamanho 14 (6-8 cintas)",
    tipoConteiner: "MK 14 Throwover",
    tamanho: "14",
    quantidadeCintas: 6,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 270.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1124",
  },
  {
    referencia: "STRAP-MK14-SIZE17",
    descricao: "Jogo cintas contentor MK 14 Throwover - tamanho 17 (8-10 cintas)",
    tipoConteiner: "MK 14 Throwover",
    tamanho: "17",
    quantidadeCintas: 8,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 360.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1124",
  },

  // MK 14 Davit-launch (DL)
  {
    referencia: "STRAP-MK14DL-SIZE10",
    descricao: "Jogo cintas contentor MK 14 Davit-launch - tamanho 10 (4 cintas + componentes)",
    tipoConteiner: "MK 14 Davit",
    tamanho: "10",
    quantidadeCintas: 4,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 180.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1130",
  },
  {
    referencia: "STRAP-MK14DL-SIZE16",
    descricao: "Jogo cintas contentor MK 14 Davit-launch - tamanho 16 (10 cintas + componentes)",
    tipoConteiner: "MK 14 Davit",
    tamanho: "16",
    quantidadeCintas: 10,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 450.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1130",
  },

  // MK 16 Throwover
  {
    referencia: "STRAP-MK16-SIZE2",
    descricao: "Jogo cintas contentor MK 16 Throwover - tamanho 2 (4 cintas)",
    tipoConteiner: "MK 16 Throwover",
    tamanho: "2",
    quantidadeCintas: 4,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 180.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1125",
  },

  // MK 18 Throwover
  {
    referencia: "STRAP-MK18-SIZE1",
    descricao: "Jogo cintas contentor MK 18 Throwover - tamanho 1 (2 cintas)",
    tipoConteiner: "MK 18 Throwover",
    tamanho: "1",
    quantidadeCintas: 2,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 90.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1126",
  },
  {
    referencia: "STRAP-MK18-SIZE3",
    descricao: "Jogo cintas contentor MK 18 Throwover - tamanho 3 (2 cintas)",
    tipoConteiner: "MK 18 Throwover",
    tamanho: "3",
    quantidadeCintas: 2,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 90.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "1126",
  },

  // MK 20 Flat-Pack
  {
    referencia: "STRAP-MK20-DL",
    descricao: "Jogo cintas contentor MK 20 Flat-Pack (20 ou 25 pessoa)",
    tipoConteiner: "MK 20 Flat-Pack",
    quantidadeCintas: 2,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 90.00,
    aplicavelMarcaJangada: "Survitec, Marine MK IV",
    pagina: "113",
  },

  // G21 Container
  {
    referencia: "STRAP-G21-SIZE17",
    descricao: "Jogo cintas contentor G21 (12 pessoa, SOLAS B-Pack) (4 cintas)",
    tipoConteiner: "G21",
    tamanho: "17",
    quantidadeCintas: 4,
    categoria: "Cintas & Fecaduras - Contentores",
    precoVenda: 180.00,
    aplicavelMarcaJangada: "Survitec, G21",
    pagina: "1127",
  },

  // Additional components: Crimpings and hand loops
  {
    referencia: "04874009",
    descricao: "Crimpagem padrão para cintas de contentor (100 un.)",
    codigoFabricante: "04874009",
    tipoConteiner: "Geral",
    quantidadeCintas: 100,
    categoria: "Cintas & Fecaduras - Componentes",
    precoVenda: 120.00,
    aplicavelMarcaJangada: "Survitec, DSB",
    pagina: "1128-1129",
  },
  {
    referencia: "DSB80303360",
    descricao: "Laço de mão para contentor (manual loop) (2-4 un.)",
    codigoFabricante: "DSB80303360",
    tipoConteiner: "Geral",
    quantidadeCintas: 4,
    categoria: "Cintas & Fecaduras - Componentes",
    precoVenda: 45.00,
    aplicavelMarcaJangada: "Survitec, DSB LR07",
    pagina: "1128-1129",
  },
];

async function main() {
  const dryRun = !process.argv.includes("--apply");

  console.log("\n📦 ADD CONTAINER STRAPS TO STOCK");
  console.log(`Mode: ${dryRun ? "DRY-RUN" : "APPLY"}\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const strap of CONTAINER_STRAPS) {
    try {
      const existing = await prisma.stock.findUnique({
        where: { referencia: strap.referencia },
      });

      if (existing) {
        console.log(`⏭️  SKIP: ${strap.referencia} (já existe)`);
        skipped++;
        continue;
      }

      if (!dryRun) {
        await prisma.stock.create({
          data: {
            referencia: strap.referencia,
            descricao: strap.descricao,
            codigoFabricante: strap.codigoFabricante,
            categoria: strap.categoria,
            precoVenda: strap.precoVenda,
            precoCompra: strap.precoCompra || strap.precoVenda * 0.6,
            quantidade: 0, // Start with 0, will be managed manually
            quantidadeMinima: 1,
            associavelJangada: true,
            aplicavelMarcaJangada: strap.aplicavelMarcaJangada,
            aplicavelModeloJangada: strap.tipoConteiner,
            estadoArtigo: "ATIVO",
            observacoes: `Tamanho contentor: ${strap.tamanho || "N/A"} | Quantidade de cintas por jogo: ${strap.quantidadeCintas} | Página manual: ${strap.pagina || "N/A"}`,
          },
        });
      }

      console.log(
        `✅ INSERT: ${strap.referencia} - ${strap.descricao.substring(0, 50)}`
      );
      inserted++;
    } catch (err: any) {
      console.error(`❌ ERROR: ${strap.referencia} - ${err.message}`);
    }
  }

  console.log(
    `\n📊 Results: ${inserted} inserted, ${updated} updated, ${skipped} skipped`
  );
  console.log(
    dryRun
      ? "\n💡 Para aplicar: npx tsx scripts/seed_container_straps_stock.ts --apply"
      : "\n✅ Cintas adicionadas ao stock com sucesso!"
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
