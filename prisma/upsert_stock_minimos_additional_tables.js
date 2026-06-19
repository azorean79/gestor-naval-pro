const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const RAW_TABLE = `
Z2524|Op head outlet Safety cap (5)||1|1
Z3594|Tool for inflation valve||1|1
Z63313|Seal Clamping Tool||1|1
Z63314|Closing strip tightener||1|1
Z63735|Torq wrench sockets set||1|1
Z7031|Spanner for collar nut||1|1
Z7053|Rearming Tool for operating head||1|1
Z7113|Z01 operating head gauge (valid until 2016)||1|1
Z73070|Digital manometer 0-2000 mb||2|2
Z73030|Heater||1|1
Z63736|Electronic label marker BROTHER||1|1
Z63737|Anti UV tape (2)||1|1
Z63073|Deflate Nozzle||1|1
Z63041|Liferaft TH Cylinder CAP||1|1
Z63488|Protection Trigger Pin Z01-DK99||1|1
Z63694|LOADING TOOL LEAFIELD FIRING HEAD||1|1
Z63715|LEAFIELD CYLINDER TRANSIT PLUG (4)||1|1
Z63734|LEAFIELD FIRING HEAD ACTUATOR PROTECTION (5)||1|1
Z63692|TORQUE SCREWDRIVER & ALLEN KEY 3MM||1|1
Z63698|Open end adaptor 16 mm||1|1
Z63690|Open end adaptor 18mm||1|1
Z7059|Tool for TH cylinder refilling *|||
Z5939|TH 250 bar membrane|||
Z63153|Painter strap gasket (10)||1|1
Z2038|Identification label||1|1
Z2356|SOLAS Label (10)||1|1
Z2438|Floating knife||1|1
Z64173|Kit LR < 25 Light RL6||1|1
Z63757|SURVITEC ZODIAC SMALL STICKER (10)||1|1
Z2507|Copper gasket (10) (valid until 2016)||1|1
Z2508|Fiber gasket 15x5x1,5 (30)||1|0
Z63598|Grey tape 25mm (33m)||1|1
Z2487|Cylinder label (10)||1|0
Z2625|Fiber gasket 14,5x8x2 (20)||2|0
Z2847SO|Black valve (10)||1|1
Z2936|CO2 coupling||1|1
Cert Web|Re-inspection certificate (online order)||3|26
Z64175|Kit Ori Light RL6||1|1
Z3539|"DO NOT ROLL" label||3|0
Z6217|SOLAS TO& DL identification label (5)||1|0
Z6218|Sticker Identification Cont TO/ORIL (5)||1|0
Z2633|Sticker DO NOT CUT (50)||1|1
Z63124SO|Index tête Z01/ Z01 trigger pin (valid until 2016)||0|0
Z63126|DK99 1 outlet operating head||1|11
Z63135|DK99 servicing Kit||1|1
Z63137|DK99 release toggle kit(2)||2|2
Z63152|Servicing history (10)||1|1
Z63154|Operating head grease kit||1|1
Z63287|Solas Strap Kit||1|1
Z63334|zip tie 9kg (100)||1|1
Z2370|Repair Kit PU Fabric||1|1
Z63703|ZODIAC FIRST AID KIT||1|2
Z7020|Glue PVC 25 cc (10)||1|1
Z7055|Container lip seal (10 m)||1|1
Z2490|OP Valve B10 190MB white||1|1
Z63733|polyethylene sheet 150µ||1|1
Z63748|Relief Valve B10 Cap (2)||1|1
Z7096SO|Glue PVC 800 cc||1|1
Z63003|CO2 leak test solution (1 L)||1|0
Z7408|Black fabric ring (10 m)||1|1
Z2623|Inflation hose L 0,30 m||1|1
Z3194|Inflation hose L 0,90 m||1|0
Z63462|QUICK CONNEC HOSE G3/8 LGTH 0,30M||1|0
Z63464|QUICK CONNEC HOSE G3/8 LGTH 0,90M||1|0
Z63970|Hose, Rapid elbow 0.8m||1|0
Z63971|Hose, Rapid male M16 Quck connect 0.8m||1|0
Z63727|QUICK FIT CONNECTOR MALE M16 HOSE LG 0,30M||1|0
Z63726|QUICK FIT CONNECTOR HOSE RIGHT ANGLE LG 0,90M||1|1
Z63714|LEAFIELD OPERATING HEAD||1|1
Z63716|LEAFIELD CYLINDER RECOIL CAP||2|2
Z63717|LEAFIELD OPERATING HEAD FIXING SCREWS (6)||1|1
Z63718|LEAFIELD OPERATING HEAD ACTUATOR CABLE (2)||1|1
Z63720|LEAFIELD BREAK STEM SEAL & O RING||1|1
Z63721|LEAFIELD QUICK FIT CONNECTOR O RING (10)||1|1
Z63722|LEAFIELD HOSE O RING (10)||1|1
Z63723|LEAFIELD CYLINDER VALVE O RING (5)||1|0
Z63731|LEAFIELD HOSE CONNECTOR||2|0
Z63477|LEAFIELD INLET VALVE KIT||1|1
Z63479|MOLYKOTE 111 GREASE (LEAFIELD OP HEAD)||1|1
26325 or similar|Electrical host 3,5|||
No ref|Water bags for overload test 3 500 L|||
No ref|Water pump to empty the water bag|||
Z2001|Container retrieving line kit|||
Z2037|Shackle access cover (5)|||
Z64508|Neoprene Glue 50cc|||
Z2705|Blue pocket with bowsing line|||
Z6221|SOLAS DL instr. label (5)|||
Z63076|DL Bowsing line Blue pocket (10)|||
Z63077|Container retrieving line red pocket(5)|||
Z2039|Head Z01 protection (10) (valid until 2016)|||
Z2809|Gasket 19,5x14,5x2,5|||
Z2810|Gasket 19x10x1,5|||
Z3202|Hose L 0,25 m (between cylinders)|||
Z3203|Hose L 0,21 m (between cylinders)|||
Z63088|Hose protector (10)|||
Z64174|Kit LR > 25 Light RL6|||
Z5944|T coupler TH|||
Z5945|Adaptor G 1/4 TH|||
Z5946|Elbow connector TH|||
Z5947|Union G 3/8 TH|||
Z63085|TH Head protector (10)|||
Z63087|Thanner T banjo protector (10)|||
Z63104|Banjo nut|||
Z63127|DK99 (2 outlets) operating head|||
Z6907|Union G 1/4 TH|||
Z63401|JOINT 19X13X1,5 elbow^ TH(10)|||
Z63350|TAHNNER T BANJO|||
Z63351|THANNER ELBOW BANJO|||
Z64183|Kit SIS light RL6|||
Z64191|Battery + Ext Light RL6 LR >25|||
Z7075SO|welding machine|||
Z63218|32mm wrench|||
Z63150|kit liferaft vaccum|||
Z2215|38mm adhesive tape|||
Z6017|50 mm adhesive tape|||
Z63443|Equipment bag XTREM|||
Z22541|Adhesive tape for Xtrem Equipment bag closing|||
Z63005|Vacuum Pouch 12/16p PU XTREM|||
Z63006|Vacuum Pouch 06/08p PU XTREM|||
Z63008|Vacuum Pouch 10/12p NG XTREM|||
Z63935|Vacuum Pouch Leafield Operating Head|||
Z63164|PRESSURE CONTROL EPS LIFERAFT|||
Z63156|CERTIF ANNUAL VISIT EPS|||
Z63118|STIC 12 MONTHS CONTROL EPS (10)|||
`;

function inferCategory(description) {
  const d = String(description || '').toLowerCase();
  if (/first aid|certificate|certif|inspection/.test(d)) return 'PRIMEIROS SOCORROS';
  if (/label|sticker|tape|seal|card/.test(d)) return 'MANUTENÇÃO';
  if (/light|lamp|battery/.test(d)) return 'ILUMINAÇÃO';
  if (/knife|solas|pocket|line|container/.test(d)) return 'SOBREVIVÊNCIA';
  return 'EQUIPAMENTO';
}

function cleanCode(code) {
  return String(code || '').trim().toUpperCase();
}

function parseRows(raw) {
  return String(raw || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, descricao, modelo, minReq, currentQty] = line.split('|');
      return {
        code: cleanCode(code),
        descricao: String(descricao || '').trim(),
        modelo: String(modelo || '').trim(),
        minReq: String(minReq || '').trim(),
        currentQty: String(currentQty || '').trim(),
      };
    })
    .filter((row) => row.code);
}

async function upsertAdditionalMinimums() {
  const rows = parseRows(RAW_TABLE);
  let created = 0;
  let updated = 0;
  let untouched = 0;

  for (const row of rows) {
    const existing = await prisma.stock.findFirst({
      where: {
        OR: [
          { codigoFabricante: row.code },
          { referencia: row.code },
        ],
      },
      select: { id: true, referencia: true, quantidade: true },
    });

    const minValue = row.minReq === '' ? null : Number(row.minReq);
    const qtyValue = row.currentQty === '' ? 0 : Number(row.currentQty);
    const safeMin = Number.isFinite(minValue) ? minValue : null;
    const safeQty = Number.isFinite(qtyValue) ? qtyValue : 0;

    if (existing) {
      await prisma.stock.update({
        where: { id: existing.id },
        data: {
          descricao: row.descricao || undefined,
          categoria: inferCategory(row.descricao),
          associavelJangada: true,
          aplicavelModeloJangada: row.modelo || null,
          codigoFabricante: row.code,
          ...(safeMin !== null ? { quantidadeMinima: safeMin } : {}),
        },
      });
      updated += 1;
      continue;
    }

    await prisma.stock.create({
      data: {
        referencia: row.code,
        descricao: row.descricao || row.code,
        categoria: inferCategory(row.descricao),
        associavelJangada: true,
        aplicavelModeloJangada: row.modelo || null,
        codigoFabricante: row.code,
        estadoArtigo: 'ATIVO',
        precoVenda: 0,
        quantidade: safeQty,
        quantidadeMinima: safeMin,
      },
    });
    created += 1;
  }

  console.log('✅ Importação adicional concluída');
  console.log(`Linhas processadas: ${rows.length}`);
  console.log(`Criados: ${created}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Sem alterações especiais: ${untouched}`);
}

if (require.main === module) {
  upsertAdditionalMinimums()
    .catch((error) => {
      console.error('❌ Erro na importação adicional:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { upsertAdditionalMinimums, parseRows };
