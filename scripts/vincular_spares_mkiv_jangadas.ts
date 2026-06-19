#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SPARE_REFERENCIAS = [
  '0855009',
  '0855109',
  '0871900',
  '0878700',
  '08742009',
  '08426009',
  '08923009',
  '08322009',
  '08220009',
  '41674001',
  '50067002',
  'WE11',
  '50067006',
  '50067003',
];

function norm(v?: string | null) {
  return (v || '').toUpperCase().trim();
}

function isTargetJangada(brand?: string | null, model?: string | null) {
  const b = norm(brand);
  const m = norm(model);

  if (b.includes('RFD') || b.includes('DSB') || b.includes('EUROVINIL')) return true;

  if (b.includes('ALMAR') || b.includes('ARIMAR')) {
    if (m.includes('STD') || m.includes('COASTAL') || m.includes('SEA WORLD')) return true;
  }

  if (m.includes('MKIV') || m.includes('MK IV') || m.includes('LR07') || m.includes('LR97')) return true;

  return false;
}

async function main() {
  const apply = process.argv.includes('--apply');

  console.log('\n🧩 VINCULAR SPARES MKIV/LR A JANGADAS\n');
  console.log(`Modo: ${apply ? 'APLICAÇÃO' : 'DRY-RUN'}\n`);

  const stocks = await prisma.stock.findMany({
    where: {
      referencia: { in: SPARE_REFERENCIAS },
    },
    select: {
      referencia: true,
      descricao: true,
      codigoFabricante: true,
    },
  });

  if (stocks.length === 0) {
    console.log('❌ Nenhum dos spares foi encontrado no Stock.');
    return;
  }

  const stockByRef = new Map(stocks.map((s) => [s.referencia, s]));

  const jangadas = await prisma.jangada.findMany({
    select: {
      id: true,
      serial: true,
      brand: true,
      model: true,
    },
    orderBy: { id: 'asc' },
  });

  const target = jangadas.filter((j) => isTargetJangada(j.brand, j.model));
  let criados = 0;
  let jaExistentes = 0;

  console.log(`Jangadas totais: ${jangadas.length}`);
  console.log(`Jangadas alvo: ${target.length}`);
  console.log(`Spares disponíveis no stock: ${stocks.length}`);

  for (const j of target) {
    for (const referencia of SPARE_REFERENCIAS) {
      const stock = stockByRef.get(referencia);
      if (!stock) continue;

      const existente = await prisma.artigoJangada.findFirst({
        where: {
          jangadaId: j.id,
          OR: [
            { referencia },
            { codigoFabricante: stock.codigoFabricante || referencia },
          ],
        },
        select: { id: true },
      });

      if (existente) {
        jaExistentes++;
        continue;
      }

      if (apply) {
        await prisma.artigoJangada.create({
          data: {
            jangadaId: j.id,
            name: stock.descricao,
            referencia,
            codigoFabricante: stock.codigoFabricante || referencia,
            quantidade: 1,
          },
        });
      }

      criados++;
    }
  }

  console.log('\n============================================================');
  console.log('✅ RESUMO');
  console.log(`Vínculos novos ${apply ? 'criados' : 'planeados'}: ${criados}`);
  console.log(`Vínculos já existentes: ${jaExistentes}`);

  if (apply) {
    const totalAgora = await prisma.artigoJangada.count({
      where: { referencia: { in: SPARE_REFERENCIAS } },
    });
    console.log(`Total de registos ArtigoJangada com estes spares: ${totalAgora}`);
  }

  console.log('============================================================\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
