#!/usr/bin/env node
/**
 * Adiciona spare parts do manual LR97 ao Stock
 */

const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function seedLR97Parts() {
  // Carregar parts do JSON
  const parts = JSON.parse(fs.readFileSync('tmp_lr97_parts_final.json', 'utf-8'));
  
  console.log(`\nAdicionando ${parts.length} spare parts do LR97 ao Stock...\n`);
  
  let created = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const part of parts) {
    const referencia = part.part_number.trim();
    const descricao = part.description.trim();
    
    // Pular se descrição for muito vaga
    if (!descricao || descricao.includes('Peça LR97 - Página') || descricao.length < 5) {
      console.log(`⏭️  Pulando ${referencia} (descrição vaga)`);
      skipped++;
      continue;
    }
    
    const data = {
      referencia,
      descricao,
      categoria: 'Jangada LR97',
      associavelJangada: true,
      aplicavelMarcaJangada: 'DSB',
      aplicavelModeloJangada: 'LR97, LR97 L',
      codigoFabricante: referencia,
      precoVenda: 0.0,
      quantidade: 0,
    };
    
    try {
      const existing = await prisma.stock.findUnique({ where: { referencia } });
      
      if (!existing) {
        await prisma.stock.create({ data });
        console.log(`✅ Criado: ${referencia} - ${descricao.substring(0, 60)}`);
        created++;
      } else {
        await prisma.stock.update({ where: { referencia }, data });
        console.log(`🔄 Atualizado: ${referencia} - ${descricao.substring(0, 60)}`);
        updated++;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ${referencia}:`, error.message);
    }
  }
  
  console.log(`\n✅ Processamento concluído!`);
  console.log(`   Criados: ${created}`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Pulados: ${skipped}`);
  console.log(`   Total: ${parts.length}\n`);
}

seedLR97Parts()
  .catch((error) => {
    console.error('Erro:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
