const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const RAW_LIST = `
00109110 Repair Kit Adhesive Apollo LR05
00109230 Repair Kit Adhesive LR86/97/07
00301050 Flax Webbing LR86/97
80403160 Straps & Crimps 50+100 length 2.40m LR97
80403180 Straps & Crimps 100+100 length 2.60m LR97
80403190 Straps & Crimps 50+50 length 3.60m LR97SR
80403220 100 pcs PP container strap red length 2.10m LR05/07
80403230 100 pcs PP container strap clear length 2.50m LR05/07
00406160 Painter Assembly for 25m stowage length 36m LR05/07
00406170 Painter Assembly T/O 36m stowage length 46m LR05/07
00406180 Painter Assembly D/L 36m stowage length 46m LR05/07
00707260 HP Hose 800 mm Thanner LR05
00707350 GIST Hose 800 mm LR05/07
00707480 GIST Hose 800mm double bayonet LR05/07
00709200 HP Hose 215 mm all sizes LR86/97
00709280 HP Hose 1150mm 35 pers LR97SR
00709430 HP Hose 750 mm 25 pers LR86/97
00709480 HP Hose 1250mm 35 pers LR97SR
00709530 HP Hose 620 mm 16/20 pers LR86/97
00709540 HP Hose 550 mm 10/12 pers LR86/97
00709550 HP Hose 450 mm 6/8 pers LR86/97
00711230 Nut M8 LR86
00725040 Adjusting Screw M8 x 55 LR86
00712460 Lead Seal LR86
00715340 Copper sealing washer LR05/07
00724250 DK99 Op Head twin LR05
00724740 DK94 Operating Head LR97
00724900 DK99 Op Head single LR97
00724830 DK88 Operating Head LR86
00724840 DK88 Op. Head Release Wire LR86
00724080 Release Wire for DK94 operating head LR97
00724220 Release Wire for DK99 single LR97
00724210 Release Wire for DK99 Twin LR97
00724850 Thanner Red Cap LR86/97/05
00729630 RL5 External Lamp LR05/07
00729120 RL5 Light & Battery LR05/07
R11790009 RL6 External Lamp LR07
R11786009 RL6 Light & Battery LR07
00729140 Rescuelite Battery LR86/97
00729190 Rescue Dan R Battery LR97/05
00729300 RescueMaster 3B Battery LR86/97
00729380 RB2 Battery LR05
00729420 Rescue Dan R Ext Battery LR97/05
00902570 Repair Kit complete LR05
80603080 Repair Kit complete LR86/97/07
00940220 First Aid Kit SOLAS LR86/97/05/07
00940170 First Aid Kit EU LR86/97/05/07
00904990 Torch LR97/05/07
00805180 ID Container c/w card LR86/97/05/07
00940350 Anti Seasickness Tablets (60 tablets) LR86/97/05/07
00904710 Label - DSB Logo (115 x 135mm) LR05/07
00904900 Label - DSB Logo (135 x 158mm) LR86/97
00941070 Label - LR97L Launch LR97L
00941100 Label, Raft ID Dates LR05/07
00941370 Label - Throwover Launch LR86/97
00941380 Label - Identification LR86/97
00941400 Label - LR86L Launch LR86L
00941460 Label - Do Not Cut LR97
00950270 Label - Transport LR86/9705/07
00952140 Label - Wheelmark LR07
00952190 Label - Wheelmark LR86/97/05
00953440 Label - Service LR86/97/05/07
80905010 DSB label Sets Only LR07 TO
80202280 Bursting Strip LR86
80202810 Shackle Flap LR86
80303100 Aux. Belt DL Rafts LR97/05/07
80303100 Aux belt/buckle Length 2730mm for DL rafts LR97/05/07
80303360 Hand loops for DL rafts LR97/05/07
80109410 Main repair glue small can LR86/97/07
R45435001 Leak Test Solution LR97/86/05/07
00101930 Leak Stopper No. 1 LR05/07
00101940 Leak Stopper No. 3 LR05/07
00101950 Leak Stopper No. 5 LR05/07
00202030 Canopy inner fabric LR05
00202430 Outer Canopy Fabric LR97/05/07
00220240 NK205 buoyancy fabric 1.5m wide LR86/97/07
00202890 Nylon fabric black single coat LR05
00202970 Nylon fabric black two coat LR05
00203000 Retro reflective tape LR86/97/05/07
00606310 "A" Pack Valise 800 mm LR97/05/07
00606320 "A" Pack Valise 700 mm LR97/05/07
00606330 "A" Pack Valise 1050 mm LR97/05/07
00730560 Radar Reflector KR2 LR97/05/07
00107190 Rescue Quoit & Line (30m) LR07
80107170 Rescue Quoit & Line (30m) LR86/97/05/07
00904010 Fishing Kit LR86/97/05/07
00904040 Floating Knife LR86/97/05/07
00940470 Sea Anchor (SOLAS) LR86/97/05/07
00107320 Painter Seal for container 'N' Type LR86/97/05/07
00107340 Painter Seal for container 'E' Type LR86/97/05/07
00107390 Painter retaining block 'F' and 'G' type LR05/07
00107400 Painter Seal for container 'F' Type LR97
00107430 Painter seal for LR 05/07 LR05/07
01107080 Torque screwdriver 1/4” SD LR05/07
01107090 Adaptor for hex bit to torque screwdriver LR05/07
01107100 Hex bit 3 mm LR05/07
01106620 OTS65 adapter LR86/97/05
01106880 Torque tool inner A10/B10 LR05/07
01106820 Fitting Tool outer leafield B10 PRV LR05/07
R11813009 Blast Test Valve Leafield with counter LR05/07
R11816009 Blast Test Valve Thanner with counter LR86/97
00203000 Retro Reflective Tape LR97/86/05/07
00109020 Bostick 486 c/w hardener 5 litre Can LR05
`;

function inferCategory(description) {
  const d = String(description || '').toLowerCase();
  if (/first aid|tablet|seasickness|medical/.test(d)) return 'PRIMEIROS SOCORROS';
  if (/label|seal|tape|card|id container/.test(d)) return 'MANUTENÇÃO';
  if (/torch|lamp|light|battery/.test(d)) return 'ILUMINAÇÃO';
  if (/hose|valve|head|thanner|leafield|nut|screw|washer/.test(d)) return 'EQUIPAMENTO';
  if (/anchor|knife|fishing|quoit|line/.test(d)) return 'SOBREVIVÊNCIA';
  return 'EQUIPAMENTO';
}

function parseAttachmentLines(raw) {
  const lines = String(raw || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  const rx = /^([A-Z0-9]+)\s+(.+?)\s+(Only\s+LR\S+(?:\s+TO)?|LR[0-9A-Z/]+)$/i;

  for (const line of lines) {
    if (/^additional items/i.test(line)) continue;
    const m = line.match(rx);
    if (!m) continue;
    const code = m[1].trim().toUpperCase();
    const descricao = m[2].trim().replace(/^"|"$/g, '');
    const modelos = m[3].trim();

    rows.push({ code, descricao, modelos });
  }

  // Deduplicate by code (keep first meaningful description)
  const byCode = new Map();
  for (const row of rows) {
    if (!byCode.has(row.code)) {
      byCode.set(row.code, row);
    }
  }
  return Array.from(byCode.values());
}

async function upsertByManufacturerCode() {
  const parsed = parseAttachmentLines(RAW_LIST);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of parsed) {
    const existing = await prisma.stock.findFirst({
      where: {
        OR: [
          { codigoFabricante: item.code },
          { referencia: item.code },
        ],
      },
      select: { id: true, referencia: true, codigoFabricante: true },
    });

    const payload = {
      referencia: existing?.referencia || item.code,
      descricao: item.descricao,
      categoria: inferCategory(item.descricao),
      associavelJangada: true,
      aplicavelModeloJangada: item.modelos,
      codigoFabricante: item.code,
      estadoArtigo: 'ATIVO',
    };

    if (!existing) {
      try {
        await prisma.stock.create({
          data: {
            ...payload,
            precoVenda: 0,
            quantidade: 0,
          },
        });
        created += 1;
      } catch (error) {
        // Fallback in case reference already exists but wasn't matched due null code
        const dupRef = await prisma.stock.findUnique({ where: { referencia: item.code } });
        if (dupRef) {
          await prisma.stock.update({
            where: { referencia: item.code },
            data: {
              descricao: item.descricao,
              categoria: inferCategory(item.descricao),
              associavelJangada: true,
              aplicavelModeloJangada: item.modelos,
              codigoFabricante: item.code,
              estadoArtigo: 'ATIVO',
            },
          });
          updated += 1;
        } else {
          skipped += 1;
          console.warn(`⚠️ Skip ${item.code}: ${error.message}`);
        }
      }
    } else {
      await prisma.stock.update({
        where: { id: existing.id },
        data: {
          descricao: item.descricao,
          categoria: inferCategory(item.descricao),
          associavelJangada: true,
          aplicavelModeloJangada: item.modelos,
          codigoFabricante: item.code,
          estadoArtigo: 'ATIVO',
        },
      });
      updated += 1;
    }
  }

  console.log('✅ Upsert por código fabricante concluído');
  console.log(`Linhas válidas processadas: ${parsed.length}`);
  console.log(`Criados: ${created}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Ignorados/erro: ${skipped}`);
}

if (require.main === module) {
  upsertByManufacturerCode()
    .catch((error) => {
      console.error('❌ Erro no upsert:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { upsertByManufacturerCode, parseAttachmentLines };
