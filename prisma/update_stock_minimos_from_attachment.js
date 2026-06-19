const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const RAW_TABLE = `
00109110|Repair Kit Adhesive Apollo|LR05|1|1
00109230|Repair Kit Adhesive|LR86/97/07|1|1
00301050|Flax Webbing|LR86/97|0|0
80403160|Straps & Crimps 50+100 length 2.40m|LR97|0|0
80403180|Straps & Crimps 100+100 length 2.60m|LR97|1|1
80403190|Straps & Crimps 50+50 length 3.60m|LR97SR|0|0
80403220|100 pcs PP container strap red length 2.10m|LR05/07|0|
80403230|100 pcs PP container strap clear length 2.50m|LR05/07|0|
00406160|Painter Assembly for 25m stowage length 36m|LR05/07|0|
00406170|Painter Assembly T/O 36m stowage length 46m|LR05/07|0|
00406180|Painter Assembly D/L 36m stowage length 46m|LR05/07|0|
00707260|HP Hose 800 mm Thanner|LR05|1|0
00707350|GIST Hose 800 mm|LR05/07|1|0
00707480|GIST Hose 800mm double bayonet|LR05/07|1|0
00709200|HP Hose 215 mm all sizes|LR86/97|1|3
00709280|HP Hose 1150mm 35 pers|LR97SR|0|0
00709430|HP Hose 750 mm 25 pers|LR86/97|1|2
00709480|HP Hose 1250mm 35 pers|LR97SR|0|0
00709530|HP Hose 620 mm 16/20 pers|LR86/97|1|2
00709540|HP Hose 550 mm 10/12 pers|LR86/97|1|1
00709550|HP Hose 450 mm 6/8 pers|LR86/97|1|2
00711230|Nut M8|LR86||
00725040|Adjusting Screw M8 x 55|LR86||
00712460|Lead Seal|LR86||
00715340|Copper sealing washer|LR05/07|1|1
00724250|DK99 Op Head twin|LR05|1|1
00724740|DK94 Operating Head|LR97|1|1
00724900|DK99 Op Head single|LR97|1|1
00724830|DK88 Operating Head|LR86|1|1
00724840|DK88 Op. Head Release Wire|LR86|1|1
00724080|Release Wire for DK94 operating head|LR97|1|
00724220|Release Wire for DK99 single|LR97|1|
00724210|Release Wire for DK99 Twin|LR97|1|
00724850|Thanner Red Cap|LR86/97/05|1|
00729630|RL5 External Lamp|LR05/07|1|0
00729120|RL5 Light & Battery|LR05/07|1|1
R11790009|RL6 External Lamp|LR07|1|0
R11786009|RL6 Light & Battery|LR07|1|0
00729140|Rescuelite Battery|LR86/97|1|1
00729190|Rescue Dan R Battery|LR97/05|1|10
00729300|RescueMaster 3B Battery|LR86/97|1|4
00729380|RB2 Battery|LR05|3|2
00729420|Rescue Dan R Ext Battery|LR97/05|1|
00902570|Repair Kit complete|LR05|2|2
80603080|Repair Kit complete|LR86/97/07|2|2
00940220|First Aid Kit SOLAS|LR86/97/05/07|3|4
00940170|First Aid Kit EU|LR86/97/05/07|1|1
00904990|Torch|LR97/05/07|1|1
00805180|ID Container c/w card|LR86/97/05/07|2|2
00940350|Anti Seasickness Tablets (60 tablets)|LR86/97/05/07|10|15
00904710|Label - DSB Logo (115 x 135mm)|LR05/07||
00904900|Label - DSB Logo (135 x 158mm)|LR86/97||
00941070|Label - LR97L Launch|LR97L||
00941100|Label, Raft ID Dates|LR05/07||
00941370|Label - Throwover Launch|LR86/97||
00941380|Label - Identification|LR86/97||
00941400|Label - LR86L Launch|LR86L||
00941460|Label - Do Not Cut|LR97||
00950270|Label - Transport|LR86/9705/07||
00952140|Label - Wheelmark|LR07||
00952190|Label - Wheelmark|LR86/97/05||
00953440|Label - Service|LR86/97/05/07||
80905010|DSB label Sets|Only LR07 TO|10|15
80202280|Bursting Strip|LR86||
80202810|Shackle Flap|LR86||
80303100|Aux. Belt DL Rafts|LR97/05/07||
80303100|Aux belt/buckle Length 2730mm for DL rafts|LR97/05/07||
80303360|Hand loops for DL rafts|LR97/05/07||
80109410|Main repair glue small can|LR86/97/07|1|0
R45435001|Leak Test Solution|LR97/86/05/07|1|1
00101930|Leak Stopper No. 1|LR05/07||
00101940|Leak Stopper No. 3|LR05/07||
00101950|Leak Stopper No. 5|LR05/07||
00202030|Canopy inner fabric|LR05||
00202430|Outer Canopy Fabric|LR97/05/07||
00220240|NK205 buoyancy fabric 1.5m wide|LR86/97/07||
00202890|Nylon fabric black single coat|LR05||
00202970|Nylon fabric black two coat|LR05||
00203000|Retro reflective tape|LR86/97/05/07||
00606310|"A" Pack Valise 800 mm|LR97/05/07||
00606320|"A" Pack Valise 700 mm|LR97/05/07||
00606330|"A" Pack Valise 1050 mm|LR97/05/07||
00730560|Radar Reflector KR2|LR86/97/07||
00107190|Rescue Quoit & Line (30m)|LR07||
80107170|Rescue Quoit & Line (30m)|LR86/97/05/07||
00904010|Fishing Kit|LR86/97/05/07||
00904040|Floating Knife|LR86/97/05/07||
00940470|Sea Anchor (SOLAS)|LR86/97/05/07||
00107320|Painter Seal for container 'N' Type|LR86/97/05/07||
00107340|Painter Seal for container 'E' Type|LR86||
00107390|Painter retaining block 'F' and 'G' type|LR05/07||
00107400|Painter Seal for container 'F' Type|LR97||
00107430|Painter seal for LR 05/07|LR05/07||
`;

function parseRows(raw) {
  return String(raw || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, descricao, modelo, minReq, quantidade] = line.split('|');
      return {
        code: String(code || '').trim().toUpperCase(),
        descricao: String(descricao || '').trim(),
        modelo: String(modelo || '').trim(),
        minReq: String(minReq || '').trim(),
        quantidade: String(quantidade || '').trim(),
      };
    })
    .filter((row) => row.code);
}

async function updateMinimums() {
  const rows = parseRows(RAW_TABLE);
  let updated = 0;
  let missing = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.minReq === '') {
      skipped += 1;
      continue;
    }

    const quantidadeMinima = Number(row.minReq);
    if (!Number.isFinite(quantidadeMinima)) {
      skipped += 1;
      continue;
    }

    const existing = await prisma.stock.findFirst({
      where: {
        OR: [
          { codigoFabricante: row.code },
          { referencia: row.code },
        ],
      },
      select: { id: true, referencia: true, codigoFabricante: true, quantidadeMinima: true },
    });

    if (!existing) {
      missing += 1;
      console.warn(`⚠️ Não encontrado: ${row.code} - ${row.descricao}`);
      continue;
    }

    await prisma.stock.update({
      where: { id: existing.id },
      data: {
        quantidadeMinima,
      },
    });
    updated += 1;
  }

  console.log('✅ Atualização de mínimos concluída');
  console.log(`Linhas lidas: ${rows.length}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Sem mínimo definido: ${skipped}`);
  console.log(`Não encontrados: ${missing}`);
}

if (require.main === module) {
  updateMinimums()
    .catch((error) => {
      console.error('❌ Erro ao atualizar mínimos:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { updateMinimums, parseRows };
