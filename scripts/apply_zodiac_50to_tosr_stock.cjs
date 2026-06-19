const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ITEMS = [
  { pn: 'Z63334', descricao: 'Zip tie - RR 9 daN', categoria: 'Fixação e Consumíveis', modelos: 'TO,TO SR', observacoes: 'Manual Zodiac 50 TO / TO SR SM20/01 p.19 e SM20/04 p.8.' },
  { pn: 'Z2491', descricao: 'A10 relief valve cap', categoria: 'Inflação / Válvulas', modelos: 'TO,TO SR', observacoes: 'Spare part do manual Zodiac 50 TO / TO SR.' },
  { pn: 'Z2038', descricao: 'Identification tube', categoria: 'Documentação / Marcação', modelos: 'TO,TO SR', observacoes: 'Spare part do manual Zodiac 50 TO / TO SR.' },
  { pn: 'Z63748', descricao: 'B10 relief valve cap', categoria: 'Inflação / Válvulas', modelos: 'TO,TO SR', observacoes: 'Spare part do manual Zodiac 50 TO / TO SR.' },
  { pn: 'Z2566', descricao: 'Rain water collector - 2L', categoria: 'Equipamento / Sobrevivência', modelos: 'TO,TO SR', observacoes: 'Spare part do manual Zodiac 50 TO / TO SR.' },
  { pn: 'Z64174', descricao: 'RL6 replacement kit (25 TOSR liferafts & >25 persons)', categoria: 'Iluminação', modelos: 'TO SR', observacoes: 'Manual Zodiac TO/TOSR. Aplicável a 25 TOSR e lotações acima de 25 pessoas.' },
  { pn: 'Z63798', descricao: 'Sea anchor (3 sizes)', categoria: 'Equipamento / Sobrevivência', modelos: 'TO,TO SR', observacoes: 'Spare part do manual Zodiac 50 TO / TO SR.' },
  { pn: '12866009', descricao: 'LIGHT READING RL6 SURVITEC', categoria: 'Iluminação', modelos: 'TO,TO SR', observacoes: 'SB 12/24 Ver.1: consolidado de Z64186 / 11785009 / 11786009 / 11787009 / 11796009 / 11797009 / 12236009.' },
  { pn: 'Z2438', descricao: 'Floating knife', categoria: 'Equipamento / Segurança', modelos: 'TO,TO SR', observacoes: 'Spare part do manual Zodiac 50 TO / TO SR.' },
  { pn: 'Z64191', descricao: 'RL6 battery + ext. light (liferafts > 25 persons)', categoria: 'Iluminação', modelos: 'TO,TO SR', observacoes: 'Kit bateria + luz externa RL6 para jangadas >25 pessoas.' },
  { pn: 'Z63500', descricao: 'Rescue quoit', categoria: 'Equipamento / Sobrevivência', modelos: 'TO,TO SR', observacoes: 'Spare part do manual Zodiac 50 TO / TO SR.' },
  { pn: '12875009', descricao: 'LIGHT P.I. RL6 SURVITEC 4000MM', categoria: 'Iluminação', modelos: 'TO,TO SR', observacoes: 'SB 12/24 Ver.1: consolidado de Z64233 / 11794009.' },
  { pn: 'Z6951', descricao: 'Immediate actions', categoria: 'Documentação / Pack', modelos: 'TO,TO SR', observacoes: 'Folha de ações imediatas.' },
  { pn: 'Z7405', descricao: 'Rescue signal table (DOT)', categoria: 'Documentação / Pack', modelos: 'TO,TO SR', observacoes: 'Tabela de sinais de socorro DOT.' },
  { pn: 'Z2463', descricao: 'Rescue signal table (FMM)', categoria: 'Documentação / Pack', modelos: 'TO,TO SR', observacoes: 'Tabela de sinais de socorro FMM.' },
  { pn: 'Z63598', descricao: 'Adhesive tape L25mm', categoria: 'Fixação e Consumíveis', modelos: 'TO,TO SR', observacoes: 'Consumível de serviço usado nas operações de folding/preparação.' },
  { pn: 'Z7120', descricao: 'Flat rubber bands', categoria: 'Fixação e Consumíveis', modelos: 'TO,TO SR', observacoes: 'Consumível de serviço usado nas operações de folding/preparação.' },
  { pn: 'Z7406', descricao: 'Anti sea sickness tablets', categoria: 'Consumíveis / Pack', modelos: 'TO SR', observacoes: 'Apenas TO SR 50 segundo SM20/04 p.8.' },

  { pn: 'Z63138', descricao: 'Survitec Y coupling', categoria: 'Inflação / THANNER', modelos: 'TO SR', observacoes: 'Substitui THANNER Y coupling Z3233 em TO SR fabricadas desde 10/2011.' },
  { pn: 'Z63738', descricao: 'Y coupling retrofit replacement kit', categoria: 'Inflação / THANNER', modelos: 'TO SR', observacoes: 'Kit de substituição para retrofitar Y coupling Survitec em jangadas anteriores a 10/2011.' },
  { pn: 'Z63351', descricao: 'Elbow banjo connector', categoria: 'Inflação / THANNER', modelos: 'TO,TO SR', observacoes: 'Conector banjo de cotovelo para DK96; substitui configuração antiga conforme manual.' },
  { pn: 'Z6907', descricao: 'Connector UMA 10L G1/4 Thanner', categoria: 'Inflação / THANNER', modelos: 'TO,TO SR', observacoes: 'Conector legado em configurações anteriores; mantido para serviço histórico.' },
  { pn: 'Z5946', descricao: 'Elbow connector Thanner', categoria: 'Inflação / THANNER', modelos: 'TO,TO SR', observacoes: 'Conector legado em configurações anteriores; substituído por Z63351 em revisões posteriores.' },

  { pn: 'Z2625', descricao: 'Fibre gasket 14,5x8x2', categoria: 'Inflação / Vedantes', modelos: 'TO', observacoes: 'THANNER 50 TO inflation system parts.' },
  { pn: 'Z64766', descricao: 'DK99 head servicing kit', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Kit de serviço da cabeça DK99.' },
  { pn: 'Z2508', descricao: 'Fibre gasket 15x5x1,5', categoria: 'Inflação / Vedantes', modelos: 'TO', observacoes: 'THANNER 50 TO inflation system parts.' },
  { pn: 'Z63134', descricao: 'DK96 head servicing kit', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Kit de serviço da cabeça DK96.' },
  { pn: 'Z7400', descricao: 'Fibre gasket 15,5x5x1,5', categoria: 'Inflação / Vedantes', modelos: 'TO', observacoes: 'THANNER 50 TO inflation system parts.' },
  { pn: 'Z63127', descricao: 'DK99 head - 2 discharge ports', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Cabeça DK99 com 2 portas de descarga.' },
  { pn: 'Z2512SO', descricao: 'T coupling kit', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Kit T coupling do sistema Zodiac/Thanner.' },
  { pn: 'Z5943', descricao: 'DK96 head - 1 discharge port', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Cabeça DK96 com 1 porta de descarga.' },
  { pn: 'Z2467', descricao: 'Fibre gasket 14,8x5x4', categoria: 'Inflação / Vedantes', modelos: 'TO', observacoes: 'Vedante de fibra do sistema Zodiac/Thanner.' },
  { pn: 'Z3106', descricao: 'Hose G3/8-G3/8 1,50m (50 TO)', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Mangueira 1,50m para 50 TO.' },
  { pn: 'Z2928', descricao: 'Fibre gasket 15x4x1,5', categoria: 'Inflação / Vedantes', modelos: 'TO', observacoes: 'Vedante de fibra do sistema Zodiac/Thanner.' },
  { pn: 'Z3194', descricao: 'Hose G3/8-G3/8 0,90m (37 DL)', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Mangueira 0,90m listada na mesma tabela de spares; útil em família TO/DL.' },
  { pn: 'Z5945', descricao: 'Connector Thanner G1/4', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Conector Thanner G1/4.' },
  { pn: 'Z3205', descricao: 'Hose M16-G3/8 0,25m', categoria: 'Inflação / THANNER', modelos: 'TO,TO SR', observacoes: 'Mangueira de ligação entre DK96 e DK99 em revisões posteriores.' },
  { pn: 'Z5947', descricao: 'Connector', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Conector legado DK99.' },
  { pn: 'Z3202', descricao: 'Hose M16-M16 0,25m', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Mangueira legado DK96/DK99 até 10/2011.' },
  { pn: 'Z63401', descricao: 'Thanner T elbow gasket 19x13x1,5', categoria: 'Inflação / Vedantes', modelos: 'TO,TO SR', observacoes: 'Vedante do banjo/cotovelo Thanner.' },
  { pn: 'Z63286', descricao: 'DK99 head protective foam', categoria: 'Inflação / Proteções', modelos: 'TO', observacoes: 'Espuma protetora da cabeça DK99.' },
  { pn: 'Z63088', descricao: 'Hose protective foam', categoria: 'Inflação / Proteções', modelos: 'TO', observacoes: 'Espuma protetora de mangueira.' },
  { pn: 'Z63071', descricao: 'Connector protective foam', categoria: 'Inflação / Proteções', modelos: 'TO', observacoes: 'Espuma protetora do conector.' },
  { pn: 'Z2041', descricao: 'CO² valve protective foam', categoria: 'Inflação / Proteções', modelos: 'TO', observacoes: 'Espuma protetora da válvula CO².' },
  { pn: 'Z2524', descricao: 'CO² discharge port safety cap', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Tampa de segurança da porta de descarga CO².' },
  { pn: 'Z63488', descricao: 'DK99 trigger pin protector', categoria: 'Inflação / THANNER', modelos: 'TO', observacoes: 'Protetor do pino de disparo DK99.' },
  { pn: 'Z63154', descricao: 'Grease kit', categoria: 'Inflação / Consumíveis', modelos: 'TO', observacoes: 'Kit de massa lubrificante para serviço do sistema de inflação.' },

  { pn: 'Z63714', descricao: 'LEAFIELD firing head - 2 discharge ports', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Cabeça de disparo Leafield com 2 portas de descarga.' },
  { pn: 'Z64529', descricao: 'Rapid elbow hose 1,30m (50 TO)', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Mangueira rapid elbow 1,30m para upper buoyancy (LEFT liferaft).' },
  { pn: 'Z64295', descricao: 'LEAFIELD slave head - 1 discharge port', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Cabeça slave Leafield com 1 porta de descarga.' },
  { pn: 'Z64660', descricao: 'Rapid elbow hose 2,50m (50 TO)', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Mangueira rapid elbow 2,50m para upper buoyancy (RIGHT liferaft).' },
  { pn: 'Z63718', descricao: 'Firing cable / actuator', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Cabo de disparo / actuator Leafield.' },
  { pn: 'Z64528', descricao: 'Rapid hose G3/8 1,20m (50 TO)', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Mangueira rápida G3/8 1,20m para lower buoyancy (LEFT liferaft).' },
  { pn: 'Z63717', descricao: 'Operating head screws', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Parafusos da operating head Leafield.' },
  { pn: 'Z63564', descricao: 'Rapid hose G3/8 2,50m (50 TO)', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Mangueira rápida G3/8 2,50m para lower buoyancy (RIGHT liferaft).' },
  { pn: 'Z63479', descricao: 'Molykote 111 grease', categoria: 'Inflação / Consumíveis', modelos: 'TO,TO SR', observacoes: 'Massa Molykote 111 referida no manual para componentes Leafield.' },
  { pn: 'Z63734', descricao: 'Firing cable protective tube', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Tubo protetor do cabo de disparo.' },
  { pn: 'Z63720', descricao: 'Torque drive assembly + O-ring', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Conjunto torque drive + O-ring.' },
  { pn: 'Z63723', descricao: 'Cylinder valve O-ring', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'O-ring da válvula do cilindro.' },
  { pn: 'Z63721', descricao: 'Cylinder valve / hose O-ring', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'O-ring da ligação válvula do cilindro / hose.' },
  { pn: 'Z63716', descricao: 'CO² discharge port recoil cap', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Tampa recoil da porta de descarga CO².' },
  { pn: 'Z64286', descricao: 'Slave head valve 250 bar', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Válvula da slave head 250 bar.' },
  { pn: 'Z63727', descricao: 'Rapid male M16 hose 0,30m', categoria: 'Inflação / LEAFIELD', modelos: 'TO', observacoes: 'Mangueira M16 macho 0,30m para ligação firing/slave head.' },
];

function appendCsvValue(existing, value) {
  const parts = String(existing || '').split(',').map((part) => part.trim()).filter(Boolean);
  for (const piece of String(value || '').split(',').map((part) => part.trim()).filter(Boolean)) {
    if (!parts.some((part) => part.toUpperCase() === piece.toUpperCase())) parts.push(piece);
  }
  return parts.join(',');
}

function appendObservation(existing, extra) {
  const base = String(existing || '').trim();
  if (!base) return extra;
  if (base.toLowerCase().includes(String(extra).toLowerCase())) return base;
  return `${base} | ${extra}`;
}

function photoUrlForPn(pn) {
  return `/manual-parts/${pn}.jpg`;
}

async function upsertItem(item, dryRun) {
  const referencia = `ZOD-${item.pn}`;
  const imagePath = path.join(process.cwd(), 'public', 'manual-parts', `${item.pn}.jpg`);
  const foto = fs.existsSync(imagePath) ? photoUrlForPn(item.pn) : null;

  const existing = await prisma.stock.findUnique({ where: { referencia } });
  const existingByCode = !existing
    ? await prisma.stock.findFirst({ where: { codigoFabricante: item.pn } })
    : null;
  const target = existing || existingByCode;

  const data = {
    referencia: target?.referencia || referencia,
    descricao: item.descricao,
    categoria: item.categoria,
    associavelJangada: true,
    aplicavelMarcaJangada: 'ZODIAC',
    aplicavelModeloJangada: item.modelos,
    codigoFabricante: item.pn,
    precoVenda: target?.precoVenda ?? 0,
    quantidade: target?.quantidade ?? 0,
    estadoArtigo: target?.estadoArtigo ?? 'ATIVO',
    foto,
    observacoes: item.observacoes,
  };

  if (!target) {
    if (dryRun) {
      console.log(`CREATE ${referencia} :: ${item.pn} :: ${item.descricao}`);
      return;
    }
    await prisma.stock.create({ data });
    console.log(`✓ Criado ${referencia}`);
    return;
  }

  const update = {
    descricao: item.descricao,
    categoria: item.categoria,
    associavelJangada: true,
    aplicavelMarcaJangada: appendCsvValue(target.aplicavelMarcaJangada, 'ZODIAC'),
    aplicavelModeloJangada: appendCsvValue(target.aplicavelModeloJangada, item.modelos),
    codigoFabricante: item.pn,
    foto: foto || target.foto,
    observacoes: appendObservation(target.observacoes, item.observacoes),
  };

  if (dryRun) {
    console.log(`UPDATE ${target.referencia} :: ${item.pn} :: ${item.descricao}`);
    return;
  }

  await prisma.stock.update({ where: { id: target.id }, data: update });
  console.log(`↻ Atualizado ${target.referencia}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Sync stock Zodiac 50 TO/TOSR (${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'})`);
  for (const item of ITEMS) {
    await upsertItem(item, dryRun);
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
