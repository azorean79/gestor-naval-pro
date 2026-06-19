#!/usr/bin/env tsx
/**
 * Adiciona cintas de fecho e autocolantes ao stock
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CINTAS_E_AUTOCOLANTES = [
  // Cintas de fecho
  {
    descricao: 'Cinta de fecho container - 500mm (Preta)',
    categoria: 'Containers e Embalagem',
    codigoFabricante: 'SEAL-500-BK',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 0.50,
    quantidade: 0,
  },
  {
    descricao: 'Cinta de fecho container - 750mm (Preta)',
    categoria: 'Containers e Embalagem',
    codigoFabricante: 'SEAL-750-BK',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 0.75,
    quantidade: 0,
  },
  {
    descricao: 'Cinta de fecho container - 1000mm (Preta)',
    categoria: 'Containers e Embalagem',
    codigoFabricante: 'SEAL-1000-BK',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 1.00,
    quantidade: 0,
  },
  {
    descricao: 'Cinta de fecho reforçada - metal lock',
    categoria: 'Containers e Embalagem',
    codigoFabricante: 'SEAL-METAL-LOCK',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV',
    precoVenda: 2.50,
    quantidade: 0,
  },

  // Autocolantes / Labels
  {
    descricao: 'Autocolante identificação jangada (grande)',
    categoria: 'Equipamento Geral',
    codigoFabricante: 'LABEL-RAFT-LG',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 1.50,
    quantidade: 0,
  },
  {
    descricao: 'Autocolante identificação jangada (pequeno)',
    categoria: 'Equipamento Geral',
    codigoFabricante: 'LABEL-RAFT-SM',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 0.75,
    quantidade: 0,
  },
  {
    descricao: 'Autocolante data próxima inspeção',
    categoria: 'Equipamento Geral',
    codigoFabricante: 'LABEL-INSP-DATE',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 0.50,
    quantidade: 0,
  },
  {
    descricao: 'Autocolante aprovação SOLAS/MED',
    categoria: 'Equipamento Geral',
    codigoFabricante: 'LABEL-SOLAS-MED',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV',
    precoVenda: 2.00,
    quantidade: 0,
  },
  {
    descricao: 'Autocolante capacidade (pessoas)',
    categoria: 'Equipamento Geral',
    codigoFabricante: 'LABEL-CAPACITY',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 1.00,
    quantidade: 0,
  },
  {
    descricao: 'Autocolante instruções de uso (PT)',
    categoria: 'Equipamento Geral',
    codigoFabricante: 'LABEL-INSTR-PT',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 1.50,
    quantidade: 0,
  },
  {
    descricao: 'Autocolante instruções de uso (EN)',
    categoria: 'Equipamento Geral',
    codigoFabricante: 'LABEL-INSTR-EN',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 1.50,
    quantidade: 0,
  },
  {
    descricao: 'Autocolante serviço autorizado (logotipo)',
    categoria: 'Equipamento Geral',
    codigoFabricante: 'LABEL-SERVICE-AUTH',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 0.75,
    quantidade: 0,
  },
  {
    descricao: 'Autocolante código de barras (genérico)',
    categoria: 'Equipamento Geral',
    codigoFabricante: 'LABEL-BARCODE',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 0.25,
    quantidade: 0,
  },

  // Cintas adicionais específicas
  {
    descricao: 'Cinta de segurança container (vermelha)',
    categoria: 'Containers e Embalagem',
    codigoFabricante: 'SEAL-SAFETY-RED',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV',
    precoVenda: 1.25,
    quantidade: 0,
  },
  {
    descricao: 'Cinta numerada anti-tamper (100 unid.)',
    categoria: 'Containers e Embalagem',
    codigoFabricante: 'SEAL-NUMBERED-100',
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD,DSB,Survitec,ALMAR,ARIMAR',
    aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97,STD',
    precoVenda: 25.00,
    quantidade: 0,
  },
];

async function main() {
  console.log('🏷️  Adicionando cintas de fecho e autocolantes ao stock...\n');

  let created = 0;
  let updated = 0;
  let errors = 0;

  // Obter próximo ID disponível para referências
  const lastStock = await prisma.stock.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });

  let nextId = (lastStock?.id || 0) + 1;

  for (const item of CINTAS_E_AUTOCOLANTES) {
    const referencia = `GEN-${String(nextId).padStart(4, '0')}`;

    try {
      const result = await prisma.stock.upsert({
        where: { referencia },
        create: {
          referencia,
          ...item,
        },
        update: {
          ...item,
        },
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        console.log(`✓ Criado: ${referencia} - ${item.descricao}`);
        created++;
      } else {
        console.log(`↻ Atualizado: ${referencia} - ${item.descricao}`);
        updated++;
      }

      nextId++;
    } catch (error: any) {
      console.error(`✗ Erro: ${item.descricao} - ${error.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Concluído!`);
  console.log(`   Criados: ${created}`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Erros: ${errors}`);

  // Estatísticas
  const totalCintas = await prisma.stock.count({
    where: {
      categoria: 'Containers e Embalagem',
      codigoFabricante: {
        startsWith: 'SEAL-',
      },
    },
  });

  const totalAutocolantes = await prisma.stock.count({
    where: {
      categoria: 'Equipamento Geral',
      codigoFabricante: {
        startsWith: 'LABEL-',
      },
    },
  });

  console.log(`\n📊 Stock atual:`);
  console.log(`   Cintas de fecho: ${totalCintas} tipos`);
  console.log(`   Autocolantes: ${totalAutocolantes} tipos`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
