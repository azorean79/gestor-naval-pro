import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const ITEMS_TO_ADD = [
  // Tablets
  { referencia: "30202051", descricao: "Comprimidos p/ Enjoo SB 12/24", precoVenda: 0.0, categoria: "PRIMEIROS SOCORROS", associavelJangada: true },

  // First Aid Kit SOLAS
  { referencia: "12865009", descricao: "Farmácia Solas SB 12/24", precoVenda: 0.0, categoria: "PRIMEIROS SOCORROS", associavelJangada: true },

  // First Aid Kit Cat C
  { referencia: "06484009", descricao: "Farmácia Cat C SB 12/24", precoVenda: 0.0, categoria: "PRIMEIROS SOCORROS", associavelJangada: true },

  // First Aid Kit Cat C Ext
  { referencia: "12874009", descricao: "Farmácia Cat C Ext SB 12/24", precoVenda: 0.0, categoria: "PRIMEIROS SOCORROS", associavelJangada: true },

  // Lights RL6
  { referencia: "12866009", descricao: "Luz Interna RL6 SB 12/24", precoVenda: 0.0, categoria: "ILUMINAÇÃO", associavelJangada: true },
  { referencia: "12868009", descricao: "Luz Externa RL6 SB 12/24", precoVenda: 0.0, categoria: "ILUMINAÇÃO", associavelJangada: true },
  { referencia: "12867009", descricao: "Light p.i. RL6 Survitec 3500mm SB 12/24", precoVenda: 0.0, categoria: "ILUMINAÇÃO", associavelJangada: true },
  { referencia: "12875009", descricao: "Light p.i. RL6 Survitec 4000mm SB 12/24", precoVenda: 0.0, categoria: "ILUMINAÇÃO", associavelJangada: true },

  // Lights RL5
  { referencia: "12869009", descricao: "Luz Interna RL5 / Bateria de Lítio RL5 SB 12/24", precoVenda: 0.0, categoria: "ILUMINAÇÃO", associavelJangada: true },
  { referencia: "12870009", descricao: "Luz Externa RL5 SB 12/24", precoVenda: 0.0, categoria: "ILUMINAÇÃO", associavelJangada: true },
  { referencia: "12871009", descricao: "Lamp Unit Marine Ext. RL5 950mm SB 12/24", precoVenda: 0.0, categoria: "ILUMINAÇÃO", associavelJangada: true },

  // Lights RB2
  { referencia: "12872009", descricao: "Power Unit Assy. Marine RB2 SB 12/24", precoVenda: 0.0, categoria: "ILUMINAÇÃO", associavelJangada: true },

  // Ribo
  { referencia: "80913820", descricao: "Battery RL6 + Line Ribo SB 12/24", precoVenda: 0.0, categoria: "ILUMINAÇÃO", associavelJangada: true }
];

async function main() {
  console.log("Inserindo artigos do SB 12/24 no stock...");
  let createdCount = 0;
  let skippedCount = 0;
  
  for (const item of ITEMS_TO_ADD) {
    const exists = await prisma.stock.findUnique({
      where: { referencia: item.referencia }
    });
    if (!exists) {
      await prisma.stock.create({
        data: {
          referencia: item.referencia,
          descricao: item.descricao,
          precoVenda: item.precoVenda,
          categoria: item.categoria,
          associavelJangada: item.associavelJangada,
          quantidade: 0,
        }
      });
      console.log(`+ Criado: ${item.referencia} - ${item.descricao}`);
      createdCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log(`Concluído! Criados: ${createdCount}, Ignorados (já existem): ${skippedCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
