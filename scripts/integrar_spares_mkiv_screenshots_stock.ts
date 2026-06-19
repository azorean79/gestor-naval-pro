#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SpareItem = {
  partNumber: string;
  descricao: string;
  categoria: string;
};

const SPARE_ITEMS: SpareItem[] = [
  { partNumber: '0855009', descricao: 'Hose assembly (800 mm)', categoria: 'Gás e Inflação' },
  { partNumber: '0855109', descricao: 'Double bayonet assembly (800 mm)', categoria: 'Gás e Inflação' },
  { partNumber: '0871900', descricao: 'Union nut with O-ring', categoria: 'Gás e Inflação' },
  { partNumber: '0878700', descricao: 'O-ring seal (double bayonet to buoyancy)', categoria: 'Gás e Inflação' },
  { partNumber: '08742009', descricao: 'Union nut copper sealing (operating head)', categoria: 'Gás e Inflação' },
  { partNumber: '08426009', descricao: 'Operating head (white)', categoria: 'Gás e Inflação' },

  { partNumber: '08923009', descricao: 'Actuator cable (white)', categoria: 'Gás e Inflação' },
  { partNumber: '08322009', descricao: 'Dust cap', categoria: 'Gás e Inflação' },
  { partNumber: '08220009', descricao: 'Transit/recoil plug', categoria: 'Gás e Inflação' },
  { partNumber: '41674001', descricao: 'Cylinder identity label', categoria: 'Equipamento Geral' },

  { partNumber: '50067002', descricao: 'Protection pad, inlet check valve', categoria: 'Gás e Inflação' },
  { partNumber: 'WE11', descricao: 'Webbing, 13 mm undyed polyester', categoria: 'Cordas e Âncoras' },
  { partNumber: '50067006', descricao: 'Protection pad, operating head (outboard)', categoria: 'Gás e Inflação' },
  { partNumber: '50067003', descricao: 'Protection pad, operating head (inboard)', categoria: 'Gás e Inflação' },
];

async function main() {
  console.log('\n📦 INTEGRAÇÃO DE SPARES MKIV (SCREENSHOTS) NO STOCK\n');

  let criados = 0;
  let atualizados = 0;
  let erros = 0;

  for (const item of SPARE_ITEMS) {
    try {
      const existente = await prisma.stock.findFirst({
        where: {
          OR: [
            { referencia: item.partNumber },
            { codigoFabricante: item.partNumber },
          ],
        },
      });

      if (!existente) {
        await prisma.stock.create({
          data: {
            referencia: item.partNumber,
            descricao: item.descricao,
            categoria: item.categoria,
            codigoFabricante: item.partNumber,
            associavelJangada: true,
            aplicavelMarcaJangada: 'RFD,DSB,Survitec',
            aplicavelModeloJangada: 'MK IV,Surviva MKIV,LR07,LR97',
            estadoArtigo: 'ATIVO',
            precoVenda: 0,
            quantidade: 0,
            observacoes: 'Integrado a partir de screenshots do Marine MKIV Service Manual',
          },
        });

        criados++;
        console.log(`✓ Criado: ${item.partNumber} - ${item.descricao}`);
        continue;
      }

      await prisma.stock.update({
        where: { id: existente.id },
        data: {
          descricao: item.descricao,
          categoria: item.categoria,
          codigoFabricante: item.partNumber,
          associavelJangada: true,
          aplicavelMarcaJangada: existente.aplicavelMarcaJangada || 'RFD,DSB,Survitec',
          aplicavelModeloJangada: existente.aplicavelModeloJangada || 'MK IV,Surviva MKIV,LR07,LR97',
          observacoes: 'Integrado a partir de screenshots do Marine MKIV Service Manual',
        },
      });

      atualizados++;
      console.log(`↻ Atualizado: ${item.partNumber} (ID ${existente.id})`);
    } catch (error: any) {
      erros++;
      console.error(`✗ Erro em ${item.partNumber}: ${error.message}`);
    }
  }

  const verificados = await prisma.stock.findMany({
    where: {
      codigoFabricante: {
        in: SPARE_ITEMS.map((i) => i.partNumber),
      },
    },
    orderBy: { codigoFabricante: 'asc' },
    select: {
      id: true,
      referencia: true,
      codigoFabricante: true,
      descricao: true,
    },
  });

  console.log('\n============================================================');
  console.log('✅ RESUMO');
  console.log(`Itens alvo: ${SPARE_ITEMS.length}`);
  console.log(`Criados: ${criados}`);
  console.log(`Atualizados: ${atualizados}`);
  console.log(`Erros: ${erros}`);
  console.log(`Verificados no stock por codigoFabricante: ${verificados.length}`);

  if (verificados.length > 0) {
    console.log('\n📋 Itens verificados:');
    verificados.forEach((v) => {
      console.log(`  • [ID ${v.id}] Ref=${v.referencia} | CodFab=${v.codigoFabricante} | ${v.descricao}`);
    });
  }
  console.log('============================================================\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
