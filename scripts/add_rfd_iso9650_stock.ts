#!/usr/bin/env tsx
/**
 * Sincroniza artigos RFD ISO 9650 no stock.
 * - referencia interna: RFD-<P/N>
 * - codigoFabricante: <P/N>
 */

import { PrismaClient } from '@prisma/client';
import { normalizeStockCategory } from '@/lib/stock-categories';

const prisma = new PrismaClient();

type StockSeed = {
  pn: string;
  descricao: string;
  categoria: string;
  precoVenda?: number;
  observacoes?: string;
};

const RFD_ISO_ITEMS: StockSeed[] = [
  { pn: '11105001', descricao: 'Bag, seasickness, poly 229x366', categoria: 'Consumíveis / Pack' },
  { pn: '05720107', descricao: 'Bailer PVC 1 pint', categoria: 'Equipamento / Pack' },
  { pn: '45201002', descricao: 'Bellows', categoria: 'Equipamento / Pack' },
  { pn: 'E99930156', descricao: 'First Aid Kit', categoria: 'Primeiros Socorros' },
  { pn: '05829009', descricao: 'Heliograph', categoria: 'Sinalização' },
  { pn: '08557009', descricao: 'Sealing caps (Leafield B10)', categoria: 'Válvulas e Vedantes' },
  { pn: '45036001', descricao: 'Label E-pack', categoria: 'Etiquetagem / Pack' },
  { pn: 'E15100208', descricao: 'Immediate action leaflet', categoria: 'Documentação / Pack' },
  { pn: '40318001', descricao: 'Leak stopper No.1', categoria: 'Equipamento / Pack' },
  { pn: '05720019', descricao: 'Leak stopper No.3', categoria: 'Equipamento / Pack' },
  { pn: '05720023', descricao: 'Leak stopper No.5', categoria: 'Equipamento / Pack' },
  { pn: 'E10360009', descricao: 'Repair kit', categoria: 'Equipamento / Pack' },
  { pn: '02176011', descricao: 'Rescue signal table', categoria: 'Sinalização' },
  { pn: '06317009', descricao: 'Thermal protection aid', categoria: 'Sobrevivência' },
  { pn: '06973009', descricao: 'Torch waterproof c/w spares', categoria: 'Sinalização' },
  { pn: '05090005', descricao: 'Whistle', categoria: 'Sinalização' },
  { pn: '20993051', descricao: 'Valise 1050 mm', categoria: 'Containers e Embalagem' },
  { pn: '45510101', descricao: 'Sea anchor', categoria: 'Equipamento / Pack' },
  { pn: '08376009', descricao: 'Smoke signal', categoria: 'Sinalização' },
  { pn: '51765011', descricao: 'Smoke protection pipe', categoria: 'Sinalização' },
  { pn: '51765021', descricao: 'Smoke protection foam', categoria: 'Sinalização' },
  { pn: '06408009', descricao: 'Radar reflector', categoria: 'Sinalização' },

  { pn: '08426009', descricao: 'Leafield operating head (GIST)', categoria: 'Inflação / Cabeças' },
  { pn: 'DSB00812180', descricao: 'Inflate/deflate valve', categoria: 'Inflação / Válvulas' },
  { pn: 'DSB00810070', descricao: 'Inflate/deflate valve cap', categoria: 'Inflação / Válvulas' },
  { pn: '08423009', descricao: 'GIST inlet check valve 2.2 mm', categoria: 'Inflação / Válvulas' },
  { pn: '08424009', descricao: 'GIST inlet check valve 2.8 mm', categoria: 'Inflação / Válvulas' },
  { pn: '08554009', descricao: 'GIST PRV B10 2.8 psi', categoria: 'Inflação / Válvulas' },
  { pn: '12869009', descricao: "LAMP/INT+BATT D'MANT RL5 5YR SURVITEC", categoria: 'Iluminação', observacoes: 'SB 12/24 Ver.1: consolidado de 08279009 / 08402009 / 11848009.' },
  { pn: '12870009', descricao: 'LAMP UNIT MARINE EXT. RL5 65 SURVITEC', categoria: 'Iluminação', observacoes: 'SB 12/24 Ver.1: consolidado de 08280009 / 08403009 / 11847009.' },
  { pn: 'E10359063', descricao: 'Drogue (less swivel)', categoria: 'Equipamento / Raft' },
  { pn: '45932001', descricao: 'Rescue line and quoit assembly', categoria: 'Equipamento / Raft' },
  { pn: '08211009R', descricao: 'Hydrostatic Release Unit', categoria: 'Segurança / HRU' },
  { pn: '45435001', descricao: 'Leak detector test kit', categoria: 'Ferramentas e Teste' },
  { pn: '15384002', descricao: 'Do Not Cut tape', categoria: 'Consumíveis Serviço' },
  { pn: '08244009', descricao: 'Heat sealing tool 230V', categoria: 'Ferramentas e Teste' },
  { pn: '50292005', descricao: 'Vacuum valve plug tool', categoria: 'Ferramentas e Teste' },
];

function buildReferencia(pn: string) {
  return `RFD-${pn}`;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');

  console.log(`🧰 Sync stock RFD ISO 9650 (${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'})`);

  let created = 0;
  let updated = 0;

  for (const item of RFD_ISO_ITEMS) {
    const referencia = buildReferencia(item.pn);

    const existing = await prisma.stock.findUnique({ where: { referencia } });

    const data = {
      referencia,
      descricao: item.descricao,
      categoria: normalizeStockCategory(item.categoria) || 'EQUIPAMENTO',
      associavelJangada: true,
      aplicavelMarcaJangada: 'RFD',
      aplicavelModeloJangada: 'SEASAVA PLUS,SEASAVA PRO-ISO,SURVIVA MKIII,SURVIVA MKIV TO',
      codigoFabricante: item.pn,
      precoVenda: item.precoVenda ?? 0,
      quantidade: existing?.quantidade ?? 0,
      observacoes: item.observacoes ?? 'Fonte: Manual RFD ISO 9650 (Service Manual 283).',
    };

    if (dryRun) {
      console.log(`${existing ? '↻' : '✓'} ${referencia} (${item.pn}) - ${item.descricao}`);
      if (existing) updated++; else created++;
      continue;
    }

    await prisma.stock.upsert({
      where: { referencia },
      create: data,
      update: {
        descricao: data.descricao,
        categoria: data.categoria,
        associavelJangada: data.associavelJangada,
        aplicavelMarcaJangada: data.aplicavelMarcaJangada,
        aplicavelModeloJangada: data.aplicavelModeloJangada,
        codigoFabricante: data.codigoFabricante,
        precoVenda: data.precoVenda,
        observacoes: data.observacoes,
      },
    });

    if (existing) {
      console.log(`↻ Atualizado: ${referencia} (${item.pn})`);
      updated++;
    } else {
      console.log(`✓ Criado: ${referencia} (${item.pn})`);
      created++;
    }
  }

  const totalRfd = await prisma.stock.count({
    where: {
      aplicavelMarcaJangada: { contains: 'RFD', mode: 'insensitive' },
    },
  });

  console.log('\n✅ Concluído');
  console.log(`   Criados: ${created}`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Total artigos com aplicabilidade RFD: ${totalRfd}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no sync de stock RFD:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
