#!/usr/bin/env tsx
/**
 * Sincroniza artigos Eurovinil Syntesy no stock.
 * - referencia interna: EV-<P/N>
 * - codigoFabricante: <P/N> (conforme pedido operacional)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type StockSeed = {
  pn: string;
  descricao: string;
  categoria: string;
  precoVenda?: number;
  observacoes?: string;
};

const EUROVINIL_ITEMS: StockSeed[] = [
  { pn: '10388044', descricao: 'Valve VTE/99-ISO/V1 (1” NGT)', categoria: 'Válvulas e Cabeças' },
  { pn: '10388046', descricao: 'Valve VTE/99-ISO/V1W (25E)', categoria: 'Válvulas e Cabeças' },
  { pn: '10388043', descricao: 'Operating Head VTE/99-ISO/TSV', categoria: 'Válvulas e Cabeças' },
  { pn: '10399596', descricao: 'VTE/99 Operating Head Activation Cable', categoria: 'Cabos e Acionamento' },
  { pn: '99201319', descricao: 'Obtutator for Valve VTE/99-ISO', categoria: 'Válvulas e Cabeças' },
  { pn: '99201015', descricao: 'Plummer for Valve VTE/99 (up to 7L)', categoria: 'Válvulas e Cabeças' },

  { pn: '10399405', descricao: 'Valve VTE/87-PED (17E)', categoria: 'Válvulas e Cabeças' },
  { pn: '10399424', descricao: 'Operating Head VTE/87 - 1 WAY', categoria: 'Válvulas e Cabeças' },
  { pn: '10399594', descricao: 'VTE/87 Operating Head Activation Cable', categoria: 'Cabos e Acionamento' },
  { pn: '99201312', descricao: 'Obtutator for Valve VTE/87-PED', categoria: 'Válvulas e Cabeças' },
  { pn: '99201035', descricao: 'Plummer for Valve VTE/87 (up to 4L)', categoria: 'Válvulas e Cabeças' },

  { pn: '99182047', descricao: 'Watertight Cap for Operating Head', categoria: 'Vedantes e Tampas' },
  { pn: '99182147', descricao: 'OR106 Gasket (red) for Operating Head', categoria: 'Vedantes e Tampas' },
  { pn: '99182145', descricao: 'OR2087 Gasket O.H./Valve Coupling', categoria: 'Vedantes e Tampas' },

  { pn: '10304222', descricao: 'Closing Straps (6P/8P)', categoria: 'Containers e Embalagem' },
  { pn: '10304232', descricao: 'Closing Straps (10P/12P)', categoria: 'Containers e Embalagem' },

  { pn: '99991560', descricao: 'VTR Container (4P)', categoria: 'Containers e Embalagem' },
  { pn: '99991561', descricao: 'VTR Container', categoria: 'Containers e Embalagem' },
  { pn: '99991562', descricao: 'VTR Container', categoria: 'Containers e Embalagem' },
  { pn: '99991563', descricao: 'VTR Container', categoria: 'Containers e Embalagem' },
  { pn: '99991564', descricao: 'VTR Container', categoria: 'Containers e Embalagem' },
  { pn: '99991565', descricao: 'VTR Container', categoria: 'Containers e Embalagem' },
  { pn: '99991572', descricao: 'VTR Container', categoria: 'Containers e Embalagem' },

  { pn: '99991023', descricao: 'ABS Container', categoria: 'Containers e Embalagem' },
  { pn: '99991024', descricao: 'ABS Container', categoria: 'Containers e Embalagem' },
  { pn: '99991025', descricao: 'ABS Container', categoria: 'Containers e Embalagem' },
  { pn: '99991026', descricao: 'ABS Container', categoria: 'Containers e Embalagem' },
  { pn: '99991027', descricao: 'ABS Container', categoria: 'Containers e Embalagem' },
  { pn: '99991050', descricao: 'ABS Container', categoria: 'Containers e Embalagem' },

  { pn: '10362153', descricao: 'Valise', categoria: 'Containers e Embalagem' },
  { pn: '10362163', descricao: 'Valise', categoria: 'Containers e Embalagem' },
  { pn: '10362173', descricao: 'Valise', categoria: 'Containers e Embalagem' },
  { pn: '10362183', descricao: 'Valise', categoria: 'Containers e Embalagem' },
  { pn: '10362213', descricao: 'Valise', categoria: 'Containers e Embalagem' },
];

function buildReferencia(pn: string) {
  return `EV-${pn}`;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');

  console.log(`🧰 Sync stock Eurovinil Syntesy (${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'})`);

  let created = 0;
  let updated = 0;

  for (const item of EUROVINIL_ITEMS) {
    const referencia = buildReferencia(item.pn);

    const existing = await prisma.stock.findUnique({ where: { referencia } });

    const data = {
      referencia,
      descricao: item.descricao,
      categoria: item.categoria,
      associavelJangada: true,
      aplicavelMarcaJangada: 'EUROVINIL',
      aplicavelModeloJangada: 'SYNTESY ISO 9650-1 MK2,SYNTESY ISO 9650-2 MK2,SYNTESY SOLAS-B PACK',
      codigoFabricante: item.pn,
      precoVenda: item.precoVenda ?? 0,
      quantidade: existing?.quantidade ?? 0,
      observacoes: item.observacoes ?? 'Fonte: Eurovinil Leisure Syntesy Liferafts manual (packing/spares).',
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

  const totalEurovinil = await prisma.stock.count({
    where: {
      aplicavelMarcaJangada: { contains: 'EUROVINIL', mode: 'insensitive' },
    },
  });

  console.log('\n✅ Concluído');
  console.log(`   Criados: ${created}`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Total artigos com aplicabilidade EUROVINIL: ${totalEurovinil}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no sync de stock Eurovinil:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
