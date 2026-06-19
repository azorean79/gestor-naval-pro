#!/usr/bin/env tsx
/**
 * Importa spare parts do manual MK IV para a tabela Stock
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface SparePartRaw {
  part_number: string;
  description: string;
  source_page: number;
}

const CATEGORIES = {
  'Gás e Inflação': ['gas', 'cylinder', 'valve', 'inflation', 'co2', 'pressure', 'prv'],
  'Iluminação': ['light', 'torch', 'beacon', 'battery', 'bulb'],
  'Sinalização': ['flare', 'smoke', 'signal', 'mirror', 'heliograph', 'whistle', 'reflector'],
  'Sobrevivência': ['water', 'ration', 'food', 'first aid', 'medical', 'seasickness', 'thermal'],
  'Ferramentas e Reparação': ['repair kit', 'knife', 'scissors', 'opener', 'leak stopper', 'bellows'],
  'Cordas e Âncoras': ['rope', 'line', 'drogue', 'anchor', 'painter'],
  'Equipamento Geral': ['bag', 'bailer', 'drinking', 'vessel', 'paddle', 'oar', 'fishing'],
  'Containers e Embalagem': ['container', 'valise', 'pack', 'cover', 'bag'],
};

function categorizeDescription(description: string): string {
  const descLower = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(kw => descLower.includes(kw))) {
      return category;
    }
  }
  
  return 'Jangada MK IV';
}

async function main() {
  console.log('📦 Importando spare parts do manual MK IV...\n');
  
  // Ler JSON
  const jsonPath = 'tmp_mkiv_parts.json';
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Ficheiro não encontrado: ${jsonPath}`);
    process.exit(1);
  }
  
  const parts: SparePartRaw[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📖 ${parts.length} spare parts a importar\n`);
  
  let imported = 0;
  let updated = 0;
  let errors = 0;
  
  for (const part of parts) {
    try {
      const categoria = categorizeDescription(part.description);
      
      const result = await prisma.stock.upsert({
        where: { referencia: part.part_number },
        create: {
          referencia: part.part_number,
          descricao: part.description,
          categoria,
          codigoFabricante: part.part_number,
          associavelJangada: true,
          aplicavelMarcaJangada: 'RFD,DSB,Survitec',
          aplicavelModeloJangada: 'MK IV,Surviva MKIV',
          precoVenda: 0.0,
          quantidade: 0,
        },
        update: {
          descricao: part.description,
          categoria,
          associavelJangada: true,
          aplicavelModeloJangada: 'MK IV,Surviva MKIV',
        },
      });
      
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        imported++;
        console.log(`✓ Inserido: ${part.part_number} - ${part.description.substring(0, 50)}...`);
      } else {
        updated++;
        console.log(`↻ Atualizado: ${part.part_number}`);
      }
    } catch (error: any) {
      errors++;
      console.error(`✗ Erro em ${part.part_number}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Importação concluída!`);
  console.log(`   Novos: ${imported}`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Erros: ${errors}`);
  
  // Sumário por categoria
  const stockByCategory = await prisma.stock.groupBy({
    by: ['categoria'],
    where: {
      aplicavelModeloJangada: {
        contains: 'MK IV',
      },
    },
    _count: true,
  });
  
  console.log(`\n📊 Stock por categoria (MK IV):`);
  for (const row of stockByCategory) {
    console.log(`   ${row.categoria}: ${row._count} itens`);
  }
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
