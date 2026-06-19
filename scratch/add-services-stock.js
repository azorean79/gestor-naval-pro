import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const SERVICES_TO_ADD = [
  // Serviços de Inspeção e Testes
  { referencia: "L-JD", descricao: "Inspeção de Jangada", precoVenda: 180.0, categoria: "Serviço", associavelJangada: true },
  { referencia: "L-FS", descricao: "Teste FS", precoVenda: 35.0, categoria: "Serviço", associavelJangada: true },
  { referencia: "L-NAP", descricao: "Teste NAP", precoVenda: 35.0, categoria: "Serviço", associavelJangada: true },
  { referencia: "L-GI", descricao: "Teste GI", precoVenda: 35.0, categoria: "Serviço", associavelJangada: true },
  { referencia: "L-TH", descricao: "Teste Hidrostático", precoVenda: 45.0, categoria: "Serviço", associavelJangada: true },
  { referencia: "L-CO2", descricao: "Carga de CO2", precoVenda: 55.0, categoria: "Serviço", associavelJangada: true },

  // Cintas de Fecho (Consumíveis do Contentor)
  { referencia: "D508", descricao: "Jogo cintas contentor D508", precoVenda: 9.0, categoria: "CONTENTORES", associavelJangada: true },
  { referencia: "D509", descricao: "Jogo cintas contentor D509", precoVenda: 9.0, categoria: "CONTENTORES", associavelJangada: true },
  { referencia: "MK20-FLAT", descricao: "Jogo cintas contentor MK20 Flat", precoVenda: 9.0, categoria: "CONTENTORES", associavelJangada: true }
];

async function main() {
  console.log("Inserindo serviços e cintas de fecho no stock...");
  let createdCount = 0;
  let updatedCount = 0;
  
  for (const item of SERVICES_TO_ADD) {
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
      console.log(`+ Criado: ${item.referencia} - ${item.descricao} (${item.precoVenda} €)`);
      createdCount++;
    } else {
      await prisma.stock.update({
        where: { referencia: item.referencia },
        data: {
          precoVenda: item.precoVenda,
          categoria: item.categoria,
          associavelJangada: item.associavelJangada,
        }
      });
      console.log(`~ Atualizado: ${item.referencia} - ${item.descricao} (${item.precoVenda} €)`);
      updatedCount++;
    }
  }
  
  console.log(`Concluído! Criados: ${createdCount}, Atualizados: ${updatedCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
