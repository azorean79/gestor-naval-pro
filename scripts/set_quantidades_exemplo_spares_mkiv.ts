#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const QUANTIDADES_EXEMPLO = [
  { partNumber: '0855009',  descricao: 'Hose assembly (800 mm)',                        quantidade: 5  },
  { partNumber: '0855109',  descricao: 'Double bayonet assembly (800 mm)',               quantidade: 5  },
  { partNumber: '0871900',  descricao: 'Union nut with O-ring',                          quantidade: 10 },
  { partNumber: '0878700',  descricao: 'O-ring seal (double bayonet to buoyancy)',        quantidade: 10 },
  { partNumber: '08742009', descricao: 'Union nut copper sealing (operating head)',       quantidade: 10 },
  { partNumber: '08426009', descricao: 'Operating head (white)',                          quantidade: 3  },
  { partNumber: '08923009', descricao: 'Actuator cable (white)',                          quantidade: 5  },
  { partNumber: '08322009', descricao: 'Dust cap',                                        quantidade: 10 },
  { partNumber: '08220009', descricao: 'Transit/recoil plug',                             quantidade: 5  },
  { partNumber: '41674001', descricao: 'Cylinder identity label',                         quantidade: 20 },
  { partNumber: '50067002', descricao: 'Protection pad, inlet check valve',               quantidade: 10 },
  { partNumber: 'WE11',     descricao: 'Webbing, 13 mm undyed polyester',                 quantidade: 5  },
  { partNumber: '50067006', descricao: 'Protection pad, operating head (outboard)',        quantidade: 10 },
  { partNumber: '50067003', descricao: 'Protection pad, operating head (inboard)',         quantidade: 10 },
];

async function main() {
  console.log('\n📦 ATUALIZAR QUANTIDADES DE EXEMPLO — SPARES MKIV\n');

  let atualizados = 0;
  let naoEncontrados = 0;

  for (const item of QUANTIDADES_EXEMPLO) {
    const stock = await prisma.stock.findFirst({
      where: { referencia: item.partNumber },
      select: { id: true, quantidade: true },
    });

    if (!stock) {
      console.log(`⚠️  Não encontrado: ${item.partNumber}`);
      naoEncontrados++;
      continue;
    }

    await prisma.stock.update({
      where: { id: stock.id },
      data: { quantidade: item.quantidade },
    });

    console.log(`✓ ${item.partNumber.padEnd(10)} ${item.descricao.padEnd(50)} → ${item.quantidade} un`);
    atualizados++;
  }

  console.log('\n============================================================');
  console.log(`✅ Atualizados: ${atualizados}`);
  if (naoEncontrados > 0) console.log(`⚠️  Não encontrados: ${naoEncontrados}`);
  console.log('============================================================\n');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
