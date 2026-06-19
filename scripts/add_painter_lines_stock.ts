#!/usr/bin/env tsx
/**
 * Adiciona Painter Lines (retenidas) ao stock.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PAINTER_ITEMS = [
  {
    referencia: 'PAINTER-10M',
    descricao: 'Painter Line / Retenida 10m',
    categoria: 'Cordas e Âncoras',
    codigoFabricante: 'PAINTER-10M',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR,EUROVINIL,SEA-SAFE',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD,PL',
    precoVenda: 22.0,
    quantidade: 0,
  },
  {
    referencia: 'PAINTER-28M',
    descricao: 'Painter Line / Retenida 28m',
    categoria: 'Cordas e Âncoras',
    codigoFabricante: 'PAINTER-28M',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR,EUROVINIL,SEA-SAFE',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD,PL',
    precoVenda: 36.0,
    quantidade: 0,
  },
  {
    referencia: 'PAINTER-36M',
    descricao: 'Painter Line / Retenida 36m',
    categoria: 'Cordas e Âncoras',
    codigoFabricante: 'PAINTER-36M',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR,EUROVINIL,SEA-SAFE',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD,PL',
    precoVenda: 45.0,
    quantidade: 0,
  },
  {
    referencia: 'PAINTER-BAG',
    descricao: 'Saco de Retenida / Painter Line Bag',
    categoria: 'Containers e Embalagem',
    codigoFabricante: 'PAINTER-BAG',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR,EUROVINIL,SEA-SAFE',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD,PL',
    precoVenda: 8.5,
    quantidade: 0,
  },
  {
    referencia: 'PAINTER-RETAIN-BLOCK',
    descricao: 'Bloco de Retenção da Painter Line',
    categoria: 'Containers e Embalagem',
    codigoFabricante: 'PAINTER-RETAIN-BLOCK',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR,EUROVINIL,SEA-SAFE',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD,PL',
    precoVenda: 6.0,
    quantidade: 0,
  },
];

async function main() {
  console.log('🧵 A adicionar Painter Lines ao stock...\n');

  let created = 0;
  let updated = 0;

  for (const item of PAINTER_ITEMS) {
    const existing = await prisma.stock.findUnique({ where: { referencia: item.referencia } });

    await prisma.stock.upsert({
      where: { referencia: item.referencia },
      create: item,
      update: {
        descricao: item.descricao,
        categoria: item.categoria,
        codigoFabricante: item.codigoFabricante,
        associavelJangada: item.associavelJangada,
        aplicavelMarcaJangada: item.aplicavelMarcaJangada,
        aplicavelModeloJangada: item.aplicavelModeloJangada,
        precoVenda: item.precoVenda,
      },
    });

    if (existing) {
      updated++;
      console.log(`↻ Atualizado: ${item.referencia} - ${item.descricao}`);
    } else {
      created++;
      console.log(`✓ Criado: ${item.referencia} - ${item.descricao}`);
    }
  }

  const totalPainter = await prisma.stock.count({
    where: {
      OR: [
        { referencia: { startsWith: 'PAINTER-' } },
        { descricao: { contains: 'retenida', mode: 'insensitive' } },
        { descricao: { contains: 'painter', mode: 'insensitive' } },
      ],
    },
  });

  console.log('\n✅ Concluído!');
  console.log(`   Criados: ${created}`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Total itens painter/retenida no stock: ${totalPainter}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
