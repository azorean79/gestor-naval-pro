import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const ALIAS_REFERENCES = [
  // Tablets aliases
  "01174009", "DSB00940350", "Z64514", "Z7406",
  // First Aid Kit SOLAS aliases
  "15199001", "DSB00940220", "05886009",
  // First Aid Kit Cat C aliases
  "11801009", "11802009", "11803009", "11804009", "Z63703", "06556009",
  // First Aid Kit Cat C Ext aliases
  "12162009",
  // Lights RL6 aliases
  "11785009", "11786009", "11787009", "11796009", "11797009", "12236009", "Z64186",
  "11788009", "11790009", "11793009", "11798009", "11799009", "12235009", "Z64228",
  "11791009", "11800009",
  "11794009", "Z64233",
  // Lights RL5 aliases
  "08279009", "R08279009", "08402009", "11848009", "30202206",
  "08280009", "R08280009", "08403009", "11847009",
  "08461009",
  // Lights RB2 aliases
  "06729009", "08195009",
  // Ribo aliases
  "Z68106"
];

async function main() {
  console.log("Removendo referências duplicadas (aliases) de stock...");
  
  const result = await prisma.stock.deleteMany({
    where: {
      referencia: {
        in: ALIAS_REFERENCES
      }
    }
  });
  
  console.log(`Remoção concluída! Foram eliminados ${result.count} registos duplicados.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
