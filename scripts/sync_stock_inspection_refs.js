const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TARGETS = [
  {
    canonical: '30202085',
    aliases: ['302020585', 'RAT-WATER-500ML', 'RAT-WATER-1.5L'],
    descricao: 'Água Potável / Water Sachets',
    categoria: 'Equip. de Emergência',
    keywords: ['agua', 'água', 'water sachets', 'water'],
  },
  {
    canonical: '320202084',
    aliases: [],
    descricao: 'Rações Alimentares 0,5 Kg / Food Rations 0,5 Kg',
    categoria: 'Equip. de Emergência',
    keywords: ['ração', 'racoes', 'rações', 'food rations'],
  },
  {
    canonical: '30202051',
    aliases: [],
    descricao: 'Comprimidos p/ Enjoo / Seasickness Tablets',
    categoria: 'Equip. de Emergência',
    keywords: ['comprimidos', 'enjoo', 'seasickness tablets'],
  },
  {
    canonical: '30202207',
    aliases: [],
    descricao: 'Ambulância / First Aid Kit',
    categoria: 'Equip. de Emergência',
    keywords: ['first aid', 'farmacia', 'farmácia', 'ambulancia', 'ambulância'],
  },
  {
    canonical: '20500023',
    aliases: [],
    descricao: 'Foguetões Paraquedas / Parachute Rockets',
    categoria: 'Equip. de Emergência',
    keywords: ['paraquedas', 'parachute rockets', 'foguetões'],
  },
  {
    canonical: '20500035',
    aliases: [],
    descricao: 'Fachos de Mão / Handflares',
    categoria: 'Equip. de Emergência',
    keywords: ['facho', 'fachos de mão', 'fachos de mao', 'handflares'],
  },
  {
    canonical: '20500002',
    aliases: [],
    descricao: 'Potes de Fumo / Smoke Signals',
    categoria: 'Equip. de Emergência',
    keywords: ['pote de fumo', 'potes de fumo', 'smoke signals'],
  },
  {
    canonical: '30202206',
    aliases: ['RL05'],
    descricao: 'Bateria de Lítio RL5 / Lithium Battery',
    categoria: 'Iluminação e Baterias',
    keywords: ['bateria rl5', 'lithium battery', 'rl5 battery'],
  },
  {
    canonical: '30203190',
    aliases: [],
    descricao: 'Luz Exterior RL5 / Top Light and Battery',
    categoria: 'Iluminação e Baterias',
    keywords: ['luz exterior rl5', 'top light and battery', 'top light'],
  },
  {
    canonical: '20909107',
    aliases: ['MK4-0034'],
    descricao: 'Jogo de Reparação / Repair Kit',
    categoria: 'Equipamento Jangada',
    keywords: ['repair kit', 'jogo de reparação', 'jogo de reparacao'],
  },
  {
    canonical: '30070273',
    aliases: ['MK4-0050'],
    descricao: 'Reflector de Radar / Radar Reflector',
    categoria: 'Equipamento Jangada',
    keywords: ['radar reflector', 'reflector de radar'],
  },
  {
    canonical: '20903168',
    aliases: [],
    descricao: 'Pilhas para Lanterna / Torch Batteries',
    categoria: 'Equip. de Emergência',
    keywords: ['torch batteries', 'pilhas para lanterna'],
  },
  {
    canonical: '30202108',
    aliases: [],
    descricao: 'Cinta de Fecho / Bursting Band / Tape',
    categoria: 'Contentor',
    keywords: ['bursting band', 'cinta de fecho', 'bursting band tape'],
    createIfAmbiguous: true,
  },
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function syncTarget(target) {
  const existingCanonical = await prisma.stock.findUnique({ where: { referencia: target.canonical } });
  if (existingCanonical) {
    const updated = await prisma.stock.update({
      where: { id: existingCanonical.id },
      data: {
        descricao: target.descricao,
        categoria: target.categoria,
        associavelJangada: true,
      },
    });
    return { action: 'updated', target: target.canonical, id: updated.id, note: 'canonical already existed' };
  }

  const aliasCandidates = target.aliases.length > 0
    ? await prisma.stock.findMany({ where: { referencia: { in: target.aliases } } })
    : [];

  if (aliasCandidates.length === 1) {
    const aliasItem = aliasCandidates[0];
    const updated = await prisma.stock.update({
      where: { id: aliasItem.id },
      data: {
        referencia: target.canonical,
        referenciaSubstituta: aliasItem.referencia,
        codigoFabricante: aliasItem.codigoFabricante || aliasItem.referencia,
        descricao: target.descricao,
        categoria: target.categoria,
        associavelJangada: true,
      },
    });
    return { action: 'rekeyed', target: target.canonical, id: updated.id, note: `from alias ${aliasItem.referencia}` };
  }

  const allStock = await prisma.stock.findMany({
    select: { id: true, referencia: true, descricao: true, codigoFabricante: true },
  });

  const candidates = allStock.filter((item) => {
    const desc = normalize(item.descricao);
    return target.keywords.some((keyword) => desc.includes(normalize(keyword)));
  });

  if (candidates.length === 1) {
    const item = candidates[0];
    const updated = await prisma.stock.update({
      where: { id: item.id },
      data: {
        referencia: target.canonical,
        referenciaSubstituta: item.referencia,
        codigoFabricante: item.codigoFabricante || item.referencia,
        descricao: target.descricao,
        categoria: target.categoria,
        associavelJangada: true,
      },
    });
    return { action: 'matched-and-rekeyed', target: target.canonical, id: updated.id, note: `from ${item.referencia}` };
  }

  if (candidates.length > 1) {
    if (target.createIfAmbiguous) {
      const created = await prisma.stock.create({
        data: {
          referencia: target.canonical,
          descricao: target.descricao,
          categoria: target.categoria,
          associavelJangada: true,
          precoVenda: 0,
          quantidade: 0,
          estadoArtigo: 'ATIVO',
          observacoes: `Referência genérica sincronizada; existem ${candidates.length} variantes específicas já no stock.`,
        },
      });
      return {
        action: 'created-generic',
        target: target.canonical,
        id: created.id,
        note: `generic item created; kept ${candidates.length} specific variants`,
      };
    }

    return {
      action: 'ambiguous',
      target: target.canonical,
      note: candidates.map((c) => `${c.id}:${c.referencia}:${c.descricao}`).join(' | '),
    };
  }

  const created = await prisma.stock.create({
    data: {
      referencia: target.canonical,
      descricao: target.descricao,
      categoria: target.categoria,
      associavelJangada: true,
      precoVenda: 0,
      quantidade: 0,
      estadoArtigo: 'ATIVO',
    },
  });
  return { action: 'created', target: target.canonical, id: created.id, note: 'new stock item created' };
}

async function main() {
  const results = [];
  for (const target of TARGETS) {
    results.push(await syncTarget(target));
  }

  const ambiguousManualRefs = [
    { ref: '20577723', note: 'aparece nas imagens para mais de um artigo; não foi sincronizada automaticamente por ambiguidade' },
    { ref: 'A10', note: 'código técnico/componentes, não validado como referência única de stock' },
    { ref: 'GIST', note: 'marcação técnica/componentes, não validada como referência única de stock' },
  ];

  console.log(JSON.stringify({ results, ambiguousManualRefs }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
