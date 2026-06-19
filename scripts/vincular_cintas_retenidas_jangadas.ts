#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CINTAS_REFS = {
  mm500: 'GEN-0180',
  mm750: 'GEN-0181',
  mm1000: 'GEN-0182',
  metalLock: 'GEN-0183',
  safetyRed: 'GEN-0193',
  numbered: 'GEN-0194',
} as const;

const RETENIDA_REFS = {
  m10: 'PAINTER-10M',
  m28: 'PAINTER-28M',
  m36: 'PAINTER-36M',
  bag: 'PAINTER-BAG',
  retainBlock: 'PAINTER-RETAIN-BLOCK',
} as const;

type RefQtd = { referencia: string; quantidade: number; nomeFallback: string };

function escolherCintaPorCapacidade(capacity: number): string {
  if (capacity <= 8) return CINTAS_REFS.mm500;
  if (capacity <= 16) return CINTAS_REFS.mm750;
  return CINTAS_REFS.mm1000;
}

function escolherRetenidaPorCapacidade(capacity: number, brand?: string, model?: string): string {
  const brandModel = `${brand || ''} ${model || ''}`.toUpperCase();
  if (brandModel.includes('SEASAVA PLUS')) return RETENIDA_REFS.m10;
  if (capacity <= 6) return RETENIDA_REFS.m10;
  if (capacity <= 12) return RETENIDA_REFS.m28;
  return RETENIDA_REFS.m36;
}

function isMkFamily(brand: string, model: string): boolean {
  const b = `${brand} ${model}`.toUpperCase();
  return ['MK IV', 'MKIV', 'LR07', 'LR97', 'SEASAVA', 'EUROVINIL', 'SEA-SAFE', 'ALMAR', 'ARIMAR', 'RFD', 'DSB']
    .some((k) => b.includes(k));
}

async function main() {
  const dryRun = !process.argv.includes('--apply');

  console.log('\n🧩 VINCULAR CINTAS + RETENIDAS ÀS JANGADAS');
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'}\n`);

  const refsNecessarias = [
    ...Object.values(CINTAS_REFS),
    ...Object.values(RETENIDA_REFS),
  ];

  const stock = await prisma.stock.findMany({
    where: { referencia: { in: refsNecessarias } },
    select: { referencia: true, descricao: true, codigoFabricante: true },
  });

  const stockByRef = new Map(stock.map((s) => [s.referencia, s]));
  const refsEmFalta = refsNecessarias.filter((r) => !stockByRef.has(r));
  if (refsEmFalta.length > 0) {
    console.log('❌ Faltam referências no Stock:');
    refsEmFalta.forEach((r) => console.log(`   - ${r}`));
    process.exit(1);
  }

  const jangadas = await prisma.jangada.findMany({
    select: { id: true, serial: true, brand: true, model: true, capacity: true },
    orderBy: { id: 'asc' },
  });

  let planeadas = 0;
  let criadas = 0;
  let jaExistiam = 0;

  for (const j of jangadas) {
    const artigosParaVincular: RefQtd[] = [];

    // 1) Cinta principal por capacidade
    artigosParaVincular.push({
      referencia: escolherCintaPorCapacidade(j.capacity),
      quantidade: 1,
      nomeFallback: 'Cinta de fecho',
    });

    // 2) Cintas transversais comuns
    artigosParaVincular.push({
      referencia: CINTAS_REFS.safetyRed,
      quantidade: 1,
      nomeFallback: 'Cinta de segurança container (vermelha)',
    });

    artigosParaVincular.push({
      referencia: CINTAS_REFS.numbered,
      quantidade: 1,
      nomeFallback: 'Cinta numerada anti-tamper',
    });

    // 3) Metal lock só para família MK/LR e afins
    if (isMkFamily(j.brand, j.model)) {
      artigosParaVincular.push({
        referencia: CINTAS_REFS.metalLock,
        quantidade: 1,
        nomeFallback: 'Cinta de fecho reforçada - metal lock',
      });
    }

    // 4) Retenida (painter) por capacidade
    artigosParaVincular.push({
      referencia: escolherRetenidaPorCapacidade(j.capacity, j.brand, j.model),
      quantidade: 1,
      nomeFallback: 'Painter Line / Retenida',
    });

    // 5) Itens associados da retenida
    artigosParaVincular.push({
      referencia: RETENIDA_REFS.bag,
      quantidade: 1,
      nomeFallback: 'Saco de Retenida',
    });

    artigosParaVincular.push({
      referencia: RETENIDA_REFS.retainBlock,
      quantidade: 1,
      nomeFallback: 'Bloco de Retenção da Painter Line',
    });

    for (const a of artigosParaVincular) {
      const existente = await prisma.artigoJangada.findFirst({
        where: {
          jangadaId: j.id,
          referencia: a.referencia,
        },
        select: { id: true },
      });

      if (existente) {
        jaExistiam++;
        continue;
      }

      const s = stockByRef.get(a.referencia)!;
      planeadas++;

      if (!dryRun) {
        await prisma.artigoJangada.create({
          data: {
            jangadaId: j.id,
            referencia: a.referencia,
            codigoFabricante: s.codigoFabricante || a.referencia,
            name: s.descricao || a.nomeFallback,
            quantidade: a.quantidade,
          },
        });
        criadas++;
      }
    }
  }

  console.log('=============================================================');
  console.log('✅ RESUMO');
  console.log(`Jangadas analisadas: ${jangadas.length}`);
  console.log(`Vínculos novos ${dryRun ? 'planeados' : 'criados'}: ${dryRun ? planeadas : criadas}`);
  console.log(`Vínculos já existentes: ${jaExistiam}`);

  if (dryRun) {
    console.log('\n⚠️  DRY-RUN — nenhum dado foi alterado.');
    console.log('   Para aplicar: npx tsx scripts/vincular_cintas_retenidas_jangadas.ts --apply');
  }
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
