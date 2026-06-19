const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BULLETIN_NOTE = 'SB 12/24 Ver.1 - Consolidation of multiple branded part numbers';

const ORDER_ITEMS = [
  { referencia: '01174009', descricao: "TABLET ANTI-SEASICK 60'S (SURVITEC)", categoria: 'Equip. de Emergência', aliases: ['DSB00940350', 'Z64514', 'Z7406'] },
  { referencia: '12865009', descricao: 'KIT FIRST AID SOLAS (SURVITEC)', categoria: 'Equip. de Emergência', aliases: ['15199001', 'DSB00940220', '05886009'] },
  { referencia: '06484009', descricao: 'KIT FIRST AID CAT C (SURVITEC)', categoria: 'Equip. de Emergência', aliases: ['11801009', '11802009', '11803009', '11804009', 'Z63703', '06556009'] },
  { referencia: '12874009', descricao: 'KIT FIRST AID CAT C EXT (SURVITEC)', categoria: 'Equip. de Emergência', aliases: ['12162009'] },
  { referencia: '12866009', descricao: 'LIGHT READING RL6 SURVITEC', categoria: 'ILUMINAÇÃO E BATERIAS', aliases: ['11785009', '11786009', '11787009', '11796009', '11797009', '12236009', 'Z64186'] },
  { referencia: '12868009', descricao: 'LIGHT P.I. RL6 SURVITEC 650MM', categoria: 'ILUMINAÇÃO E BATERIAS', aliases: ['11788009', '11790009', '11793009', '11798009', '11799009', '12235009', 'Z64228'] },
  { referencia: '12867009', descricao: 'LIGHT P.I. RL6 SURVITEC 3500MM', categoria: 'ILUMINAÇÃO E BATERIAS', aliases: ['11791009', '11800009'] },
  { referencia: '12875009', descricao: 'LIGHT P.I. RL6 SURVITEC 4000MM', categoria: 'ILUMINAÇÃO E BATERIAS', aliases: ['11794009', 'Z64233'] },
  { referencia: '12869009', descricao: "LAMP/INT+BATT D'MANT RL5 5YR SURVITEC", categoria: 'ILUMINAÇÃO E BATERIAS', aliases: ['08279009', '08402009', '11848009'] },
  { referencia: '12870009', descricao: 'LAMP UNIT MARINE EXT. RL5 65 SURVITEC', categoria: 'ILUMINAÇÃO E BATERIAS', aliases: ['08280009', '08403009', '11847009'] },
  { referencia: '12871009', descricao: 'LAMP UNIT MARINE EXT. RL5 950MM SURVITEC', categoria: 'ILUMINAÇÃO E BATERIAS', aliases: ['08461009'] },
  { referencia: '12872009', descricao: 'POWER UNIT ASSY. MARINE RB2 SURVITEC', categoria: 'ILUMINAÇÃO E BATERIAS', aliases: ['06729009', '08195009'] },
  { referencia: '80913820', descricao: 'BATTERY RL6 + LINE RIBO', categoria: 'ILUMINAÇÃO E BATERIAS', aliases: ['Z68106'] },
];

const CANONICAL_UPDATES = [
  {
    referencia: '30202051',
    descricao: 'Comprimidos p/ Enjoo / Seasickness Tablets',
    codigoFabricante: '01174009',
    referenciaSubstituta: '01174009',
    categoria: 'Equip. de Emergência',
    observacoes: `${BULLETIN_NOTE}. Encomendar 01174009 em substituição das referências DSB00940350 / Z64514.`,
  },
  {
    referencia: 'MED-KIT-SOLAS',
    descricao: 'Kit Primeiros Socorros SOLAS Completo',
    codigoFabricante: '12865009',
    referenciaSubstituta: '12865009',
    categoria: 'Equip. de Emergência',
    observacoes: `${BULLETIN_NOTE}. Encomendar 12865009 em substituição de 15199001 / DSB00940220 / 05886009.`,
  },
  {
    referencia: '30202207',
    descricao: 'Ambulância / First Aid Kit',
    codigoFabricante: null,
    referenciaSubstituta: '12865009 / 06484009 / 12874009',
    categoria: 'Equip. de Emergência',
    observacoes: `${BULLETIN_NOTE}. Verificar o tipo de kit antes de encomendar: 12865009 (SOLAS), 06484009 (CAT C) ou 12874009 (CAT C EXT).`,
  },
  {
    referencia: '30202205',
    descricao: 'Top Light and Battery',
    codigoFabricante: null,
    referenciaSubstituta: '12868009 / 12867009 / 12875009 / 80913820',
    categoria: 'Iluminação e Baterias',
    observacoes: `${BULLETIN_NOTE}. Para RL6/top light encomendar a referência consolidada aplicável: 12868009, 12867009, 12875009 ou 80913820.`,
  },
  {
    referencia: '30202206',
    descricao: 'Bateria de Lítio RL5 / Lithium Battery',
    codigoFabricante: '12869009',
    referenciaSubstituta: '12869009',
    categoria: 'Iluminação e Baterias',
    observacoes: `${BULLETIN_NOTE}. Encomendar 12869009 em substituição de 08279009 / 08402009 / 11848009.`,
  },
  {
    referencia: '30203190',
    descricao: 'Luz Exterior RL5 / Top Light and Battery',
    codigoFabricante: '12870009',
    referenciaSubstituta: '12870009',
    categoria: 'Iluminação e Baterias',
    observacoes: `${BULLETIN_NOTE}. Encomendar 12870009 em substituição de 08280009 / 08403009 / 11847009.`,
  },
  {
    referencia: 'LGT-RL5-INT',
    descricao: 'Luz Interna RL5 (Unidade)',
    codigoFabricante: '12869009',
    referenciaSubstituta: '12869009',
    categoria: 'ILUMINAÇÃO E BATERIAS',
    observacoes: `${BULLETIN_NOTE}. Encomendar 12869009 em substituição de 08279009 / 08402009 / 11848009.`,
  },
  {
    referencia: 'LGT-RL5-EXT',
    descricao: 'Luz Externa RL5 (Unidade)',
    codigoFabricante: '12870009',
    referenciaSubstituta: '12870009',
    categoria: 'ILUMINAÇÃO E BATERIAS',
    observacoes: `${BULLETIN_NOTE}. Encomendar 12870009 em substituição de 08280009 / 08403009 / 11847009.`,
  },
  {
    referencia: 'LGT-RL6-KIT',
    descricao: 'Kit Completo Luz RL6 (Int+Ext+Bat)',
    codigoFabricante: null,
    referenciaSubstituta: '12866009 / 12868009 / 12867009 / 12875009 / 80913820',
    categoria: 'ILUMINAÇÃO E BATERIAS',
    observacoes: `${BULLETIN_NOTE}. Nas substituições RL6 usar a referência consolidada conforme a função/comprimento: 12866009, 12868009, 12867009, 12875009 ou 80913820.`,
  },
  {
    referencia: 'LGT-RB2-KIT',
    descricao: 'Kit Luz RB2 p/ Colete Salvação',
    codigoFabricante: '12872009',
    referenciaSubstituta: '12872009',
    categoria: 'ILUMINAÇÃO E BATERIAS',
    observacoes: `${BULLETIN_NOTE}. Encomendar 12872009 em substituição de 06729009 / 08195009.`,
  },
];

function appendNote(existing, extra) {
  const base = String(existing || '').trim();
  if (!base) return extra;
  if (base.includes(extra)) return base;
  return `${base} | ${extra}`;
}

const CANONICAL_REFERENCES = new Set([
  ...ORDER_ITEMS.map((item) => item.referencia),
  ...CANONICAL_UPDATES.map((item) => item.referencia),
]);

async function upsertOrderItems(dryRun) {
  const summary = [];

  for (const item of ORDER_ITEMS) {
    const existing = await prisma.stock.findUnique({ where: { referencia: item.referencia } });
    const data = {
      referencia: item.referencia,
      descricao: item.descricao,
      categoria: item.categoria,
      associavelJangada: false,
      codigoFabricante: item.referencia,
      referenciaSubstituta: null,
      estadoArtigo: 'ATIVO',
      precoVenda: existing?.precoVenda ?? 0,
      quantidade: existing?.quantidade ?? 0,
      observacoes: appendNote(existing?.observacoes, `${BULLETIN_NOTE}. Consolida: ${item.aliases.join(' / ')}.`),
    };

    summary.push(`${existing ? '↻' : '✓'} ${item.referencia} · ${item.descricao}`);
    if (dryRun) continue;

    await prisma.stock.upsert({
      where: { referencia: item.referencia },
      create: data,
      update: {
        descricao: data.descricao,
        categoria: data.categoria,
        associavelJangada: false,
        codigoFabricante: data.codigoFabricante,
        referenciaSubstituta: null,
        estadoArtigo: 'ATIVO',
        observacoes: data.observacoes,
      },
    });
  }

  return summary;
}

async function tagLegacyRows(dryRun) {
  const summary = [];

  for (const item of ORDER_ITEMS) {
    const rows = await prisma.stock.findMany({
      where: {
        AND: [
          {
            OR: [
              { referencia: { in: item.aliases } },
              { codigoFabricante: { in: item.aliases } },
            ],
          },
          { referencia: { notIn: Array.from(CANONICAL_REFERENCES) } },
        ],
      },
      orderBy: { id: 'asc' },
    });

    for (const row of rows) {
      const observacoes = appendNote(row.observacoes, `${BULLETIN_NOTE}. Referência consolidada para ${item.referencia}. O stock existente pode continuar em serviço até expirar ou ficar inservível.`);
      summary.push(`• ${row.referencia} -> ${item.referencia} [INATIVO]`);
      if (dryRun) continue;

      await prisma.stock.update({
        where: { id: row.id },
        data: {
          estadoArtigo: 'INATIVO',
          referenciaSubstituta: item.referencia,
          observacoes,
        },
      });
    }
  }

  return summary;
}

async function updateCanonicalRows(dryRun) {
  const summary = [];

  for (const item of CANONICAL_UPDATES) {
    const row = await prisma.stock.findUnique({ where: { referencia: item.referencia } });
    if (!row) {
      summary.push(`- ${item.referencia} (não encontrado)`);
      continue;
    }

    const data = {
      descricao: item.descricao,
      categoria: item.categoria || row.categoria,
      associavelJangada: false,
      estadoArtigo: 'ATIVO',
      codigoFabricante: item.codigoFabricante,
      referenciaSubstituta: item.referenciaSubstituta,
      observacoes: appendNote(row.observacoes, item.observacoes),
    };

    summary.push(`• ${item.referencia} -> ${item.referenciaSubstituta || 'nota operacional'}`);
    if (dryRun) continue;

    await prisma.stock.update({
      where: { id: row.id },
      data,
    });
  }

  return summary;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(`🧰 Aplicar ${BULLETIN_NOTE} (${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'})`);

  const orderSummary = await upsertOrderItems(dryRun);
  const canonicalSummary = await updateCanonicalRows(dryRun);
  const legacySummary = await tagLegacyRows(dryRun);

  console.log('\n### Novas referências de encomenda');
  orderSummary.forEach((line) => console.log(line));

  console.log('\n### Referências internas/canónicas');
  canonicalSummary.forEach((line) => console.log(line));

  console.log('\n### Legadas assinaladas com referência substituta');
  if (legacySummary.length === 0) {
    console.log('(nenhuma encontrada)');
  } else {
    legacySummary.forEach((line) => console.log(line));
  }
}

main()
  .catch((error) => {
    console.error('❌ Erro ao aplicar SB 12/24:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });