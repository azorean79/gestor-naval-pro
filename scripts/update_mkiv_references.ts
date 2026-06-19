#!/usr/bin/env tsx
/**
 * Atualiza as referências das spare parts MK IV
 * Gera referências automáticas e mantém o código do fabricante
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Atualizando referências das spare parts MK IV...\n');

  // Buscar todas as spare parts MK IV (onde referencia = codigoFabricante)
  const parts = await prisma.stock.findMany({
    where: {
      aplicavelModeloJangada: {
        contains: 'MK IV',
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  console.log(`📦 Encontradas ${parts.length} spare parts MK IV\n`);

  let updated = 0;
  let skipped = 0;

  for (const part of parts) {
    // Verificar se a referência é igual ao código do fabricante
    // (indicando que foi importado do manual)
    if (part.referencia === part.codigoFabricante) {
      // Gerar nova referência automática
      const newRef = `MK4-${String(part.id).padStart(4, '0')}`;

      try {
        await prisma.stock.update({
          where: { id: part.id },
          data: {
            referencia: newRef,
          },
        });

        console.log(`✓ ${part.codigoFabricante} → ${newRef}`);
        updated++;
      } catch (error: any) {
        console.error(`✗ Erro ao atualizar ID ${part.id}: ${error.message}`);
      }
    } else {
      console.log(`⊘ ID ${part.id} já tem referência personalizada: ${part.referencia}`);
      skipped++;
    }
  }

  console.log(`\n✅ Concluído!`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Mantidos: ${skipped}`);

  // Mostrar exemplos
  console.log(`\n📋 Exemplos de registos atualizados:`);
  const samples = await prisma.stock.findMany({
    where: {
      referencia: {
        startsWith: 'MK4-',
      },
    },
    take: 5,
    orderBy: {
      id: 'asc',
    },
  });

  samples.forEach((s) => {
    console.log(`   ${s.referencia} | Fab: ${s.codigoFabricante} | ${s.descricao.substring(0, 40)}...`);
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
