const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VERIFIED_ITEMS = [
  {
    referencia: '20431001',
    codigoFabricante: '20431001',
    descricao: 'Valve, A8/1 modified - Upper and lower buoyancy',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Manual Surviva MKIII 251, torque table / service sections. Sistema de insuflação: THANNER.',
  },
  {
    referencia: '06719009',
    codigoFabricante: '06719009',
    descricao: 'Hose, inflation 800mm (Thanner system)',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Confirmado no manual Surviva MKIII 251, cap.11 common spares. Sistema de insuflação: THANNER.',
  },
  {
    referencia: '06760009',
    codigoFabricante: '06760009',
    descricao: 'Bolt, banjo, Thanner MkIII inflation valve - Inflation hose',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Confirmado no manual Surviva MKIII 251, cap.11 common spares. Sistema de insuflação: THANNER.',
  },
  {
    referencia: '06761009',
    codigoFabricante: '06761009',
    descricao: 'Washer, fibre, inner, MkIII inflation valve (Thanner)',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Manual Surviva MKIII 251. Sistema de insuflação: THANNER.',
  },
  {
    referencia: '06762009',
    codigoFabricante: '06762009',
    descricao: 'Washer, fibre, outer, MkIII inflation valve (Thanner)',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Manual Surviva MKIII 251. Sistema de insuflação: THANNER.',
  },
  {
    referencia: 'VAL-THAN-OTS65',
    codigoFabricante: 'VAL-THAN-OTS65',
    descricao: 'Válvula Sobrepressão Thanner OTS65',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Aplicável à SURVIVA MKIII. Sistema de insuflação: THANNER.',
  },
  {
    referencia: '08152009',
    codigoFabricante: '08152009',
    descricao: 'Valve, pressure relief 2.90 p.s.i. (Thanner) - Upper and lower buoyancy',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Aplicável à SURVIVA MKIII. Sistema de insuflação: THANNER.',
  },
  {
    referencia: '08008009',
    codigoFabricante: '08008009',
    descricao: 'Head, operating, Thanner DK99 - Cylinder',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Confirmado no manual Surviva MKIII 251, cap.11 common spares. Sistema de insuflação: THANNER.',
  },
  {
    referencia: '06721009',
    codigoFabricante: '06721009',
    descricao: 'Adaptor, operating head DK94 (option) - Thanner system',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Opção DK94 para SURVIVA MKIII. Sistema de insuflação: THANNER.',
  },
  {
    referencia: '08387009',
    codigoFabricante: '08387009',
    descricao: 'Adaptor, cylinder DIN477 Thanner - TPED cylinders',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Confirmado no manual Surviva MKIII 251, tabela 1118. Sistema de insuflação: THANNER.',
  },
  {
    referencia: '06457009',
    codigoFabricante: '06457009',
    descricao: 'Membrane assembly 250 bar, Thanner (A) - TPED cylinder adaptor',
    categoria: 'Inflação / THANNER',
    sistema: 'THANNER',
    observacoes: 'Confirmado no manual Surviva MKIII 251, tabela 1118. Sistema de insuflação: THANNER.',
  },
  {
    referencia: '30203001',
    codigoFabricante: '08255009',
    descricao: 'Hose assembly (800 mm)',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Confirmado no manual Surviva MKIII 251, cap.11 associated spares. Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: 'GISTW',
    codigoFabricante: '08211009',
    descricao: 'Operating head (white)',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Confirmado no manual Surviva MKIII 251, cap.11 associated spares. Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: '08209009',
    codigoFabricante: '08209009',
    descricao: 'GIST Inlet check valve 2.2mm (Yellow) - Lower buoyancy (Leafield)',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Aplicável à SURVIVA MKIII. Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: '08210009',
    codigoFabricante: '08210009',
    descricao: 'GIST Inlet check valve 2.8mm (Purple) - Upper buoyancy (Leafield)',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Aplicável à SURVIVA MKIII. Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: '08221009',
    codigoFabricante: '08221009',
    descricao: 'Adaptor, cylinder TPED Leafield inflation system',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Confirmado no manual Surviva MKIII 251, tabela 1120. Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: '08217009',
    codigoFabricante: '08217009',
    descricao: 'Membrane, TPED Leafield inflation system',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Confirmado no manual Surviva MKIII 251, tabela 1120. Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: 'VAL-LEAF-A10',
    codigoFabricante: '08223009',
    descricao: 'Válvula de Alívio Leafield A10 (Alta vazão)',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Aplicável à SURVIVA MKIII. O excerto extraído do manual confirma a válvula A10, mas não mostrou o PN da válvula completa; mantida a referência atual de stock 08223009. Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: 'CONN-M24-NUT',
    codigoFabricante: 'Universal',
    descricao: 'M24 Nut',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Equivalência técnica para SURVIVA MKIII Leafield: M24 nut (inlet check valve). Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: 'CONN-M16',
    codigoFabricante: 'Universal',
    descricao: 'M16 Connector',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Equivalência técnica para SURVIVA MKIII Leafield: M16 connector / cylinder valve-hose. Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: 'OSL0115',
    codigoFabricante: 'OSL0115',
    descricao: 'GIST Cylinder Valve Assembly - 250 Bar',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Equivalência técnica para SURVIVA MKIII Leafield: cylinder valve / gas cylinder assembly. Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: 'OSL0110',
    codigoFabricante: 'OSL0110',
    descricao: 'GIST Break Stem 250 Bar',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Equivalência técnica para SURVIVA MKIII Leafield: break stem seal assembly / valve body. Sistema de insuflação: LEAFIELD.',
  },
  {
    referencia: 'OSL0105',
    codigoFabricante: 'OSL0105',
    descricao: 'Torque Drive Assembly',
    categoria: 'Inflação / LEAFIELD',
    sistema: 'LEAFIELD',
    observacoes: 'Equivalência técnica para SURVIVA MKIII Leafield: torque drive assembly / valve body. Sistema de insuflação: LEAFIELD.',
  },
];

function appendCsvValue(existing, value) {
  const parts = String(existing || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.some((part) => part.toUpperCase() === value.toUpperCase())) parts.push(value);
  return parts.join(',');
}

function appendObservation(existing, extra) {
  const base = String(existing || '').trim();
  if (!base) return extra;
  if (base.toLowerCase().includes(extra.toLowerCase())) return base;
  return `${base} | ${extra}`;
}

async function upsertOrUpdate(item, dryRun) {
  const existing = await prisma.stock.findUnique({
    where: { referencia: item.referencia },
  });

  const data = {
    referencia: item.referencia,
    descricao: item.descricao,
    categoria: item.categoria,
    associavelJangada: true,
    aplicavelMarcaJangada: 'RFD',
    aplicavelModeloJangada: 'SURVIVA MKIII',
    codigoFabricante: item.codigoFabricante,
    precoVenda: existing?.precoVenda ?? 0,
    quantidade: existing?.quantidade ?? 0,
    estadoArtigo: existing?.estadoArtigo ?? 'ATIVO',
    observacoes: item.observacoes,
  };

  if (!existing) {
    if (dryRun) {
      console.log(`CREATE ${item.referencia} :: ${item.descricao}`);
      return;
    }
    await prisma.stock.create({ data });
    console.log(`✓ Criado ${item.referencia}`);
    return;
  }

  const update = {
    descricao: item.descricao,
    categoria: item.categoria,
    associavelJangada: true,
    aplicavelMarcaJangada: appendCsvValue(existing.aplicavelMarcaJangada, 'RFD'),
    aplicavelModeloJangada: appendCsvValue(existing.aplicavelModeloJangada, 'SURVIVA MKIII'),
    observacoes: appendObservation(existing.observacoes, item.observacoes),
    codigoFabricante: existing.codigoFabricante || item.codigoFabricante,
  };

  if (dryRun) {
    console.log(`UPDATE ${existing.referencia || item.referencia} :: ${item.descricao}`);
    return;
  }

  await prisma.stock.update({ where: { id: existing.id }, data: update });
  console.log(`↻ Atualizado ${existing.referencia || item.referencia}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Reconciliação stock SURVIVA MKIII (${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'})`);
  for (const item of VERIFIED_ITEMS) {
    await upsertOrUpdate(item, dryRun);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
