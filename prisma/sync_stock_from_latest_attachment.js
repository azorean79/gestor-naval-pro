const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const RAW_TABLE = `
43858001|Con l.D Attachment|Mk 1,2 ,3+Mk4||2|5
41423001|Strps & Crimps|Mk 1,2 ,3+Mk4|Formerly Red sleeve 2.1m|80|80
41295001|Strps & Crimps|Mk1,2+3+Mk4|Formerly White Sleeve 2.5m|0|0
06729009|Power units|Mk1,2+3||6|5
08279009|Ext light/Battery RL5|Mk 4|RL5 Battery|3|2
08280009|Internal light assy RL5|Mk 4|RL5 Light|3|2
11788009|Ext light/Battery RL6|Mk4|RL6 Battery 4-25p TO and DL|1|1
11785009|Internal light assy RL6|Mk4|RL6 Light|1|1
06484009|First Aid Kits|Mk 1,2 ,3+Mk4|Orange FAK|1|3
10085001|Repair Kits Eu|Mk1,2+3||0|0
10085003|Repair Kits|Mk 4||2|4
42951001|Labels(set)|Mk 1,2 ,3+Mk4|Surviva|10|18
01174009|Anti Seasick tabs|Mk 1,2 ,3+Mk4|x1 4-10p, x2 12-20p, x3 20-25p (pack of 60 tablets)|10|4
08413009|Solution Tube|Mk1,2+3||10|7
05720107|Jug Baler|Mk 1,2 ,3+Mk4||4|6
15384001|Tape "do not Remove|Mk 1,2 ,3+Mk4||1|8
05544009|Inflation Hose|Mk1,2+3|Black Dunlop Inflation Hose Parker Brand|2|2
05121009|Paddle|Mk 1,2 ,3+Mk4||2|1
15323021|Painter assy 25mts|Mk1,2+3||1|1
07966009|Torch c/w Batts|Mk 1,2 ,3+Mk4|BCB Orange Torch|1|3
15199001|FA Kit SOLAS|Mk 1,2 ,3+Mk4|Yellow FAK|3|3
15323111|Painter 28mts assy|Mk 4||1|1
03820009|Canopy fabric|Mk1,2+3||1mt|0
01199069|pad protection Op Hd|Mk1,2+3||8|8
50067002|pad protection Op Hd|Mk 4||2|2
50067001|pad protection Op Hd||DK 99 outboard (top part of op head on cylinder)|2|0
50067003|pad protection Op Hd||DK 99 inboard (lower part of op head on cylinder)|2|0
05053009|Bouy Surviva|Mk1,2+3|PU Material|1mt|0
08008009|Op Head DK99|||1|1
06255009|Op Head DK88|Mk1,2+3||1|2
06721009|Op Head DK94|Mk1,2+3||1|1
08211009|Op head Leafield|Mk3+Mk4||5|5
08211009|Leafield actuator|Mk4|Additional Cable|2|2
08211007|Hose Assy Leafield|Mk3+Mk4|Black Inflation Hose Double Bayonet PN 08718009|2|2
08255009|Hose assy Leafield|Mk3+Mk4|Black Inflation Hose Dunlop Brand Right Angle|2|2
00220020|Fabric bouy|Mk 4|Rubber Material|1mt|0
DSB0020430|Fabric Canopy|Mk 4|Orange outer|1mt|1
DSB0020240|Fabric Canopy|Mk 4|Blue Inner Material|1mt|1
06408009|Radar Reflector|Mk 4||1|1
04929009|Adhesive 486|Mk1,2+3|1 litre|1|0
06726009|Lamp outer|Mk1,2+3||0|0
06727009|Lamp inner|Mk1,2+3||0|0
41941001|Ferryman Logo|Ferryman|Main Logo (base against 2 labels per raft)|0|0
20765001|Surviva Main Logo|Mk 1,2,3+Mk4|Main Logo (base against 2 labels per raft)|0|0
06231001|RFD Logo|Mk 1,2,3+Mk4|RFD small logo ends of container|20|20
05656001|Throwover instruction|Mk 1,2 ,3+Mk4|Instructional label|0|0
20924011|Davit Label 1-2|DL Rafts|Procedure 1-2|0|0
20924021|Davit Label 3-6|DL Rafts|Procedure 3-6|0|0
20085011|Davit Label '1'|DL Rafts||0|0
20085021|Davit Label '2'|DL Rafts||0|0
20085031|Davit Label '3'|DL Rafts||0|0
41144001|Do Not Roll Label|Mk 1,2,3+Mk4||0|0
43869001|Label Solas 96'|Mk 1,2,3+Mk4|All rafts|0|0
20958011|Label 'R'|Mk 1,2,3+Mk4||0|0
20958021|Label 'F'|Mk 1,2,3+Mk4||0|0
20958031|Label 'D'|Mk 1,2,3+Mk4||0|0
20883001|Painter Block|Mk 1,2,3+Mk4|x1 per raft serviced|10|50
5606009|Container Seal|Mk 1,2,3+Mk4|upper container water tight seal strips|50m|50
07945009|Molykote 111|Mk1,2,3+Mk4|Lubricant for op heads (Usually 1 tin or tube)|1 tube|1
45435001|Leak Test Kit||approx 40 cylinders per bottle|1|1
20993021|Valise|||0|0
20993031|Valise||Emergency pack Valise (800 x 750mm)|0|0
20993051|Valise||Emergency pack Valise (1050 x 750mm)|0|0
`;

function parseNumericValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return { number: null, raw: '' };
  const match = raw.match(/-?\d+(?:[\.,]\d+)?/);
  if (!match) return { number: null, raw };
  const number = Number(match[0].replace(',', '.'));
  return { number: Number.isFinite(number) ? Math.round(number) : null, raw };
}

function inferCategory(description, notes) {
  const d = `${description || ''} ${notes || ''}`.toLowerCase();
  if (/first aid|anti seasick|solas|kit solas/.test(d)) return 'PRIMEIROS SOCORROS';
  if (/light|lamp|battery|torch/.test(d)) return 'ILUMINAÇÃO';
  if (/label|logo|tape|seal|instruction/.test(d)) return 'MANUTENÇÃO';
  if (/fabric|canopy|valise|bouy|baler|paddle|radar reflector/.test(d)) return 'SOBREVIVÊNCIA';
  return 'EQUIPAMENTO';
}

function appendStructuredNotes(existingNotes, incomingNotes) {
  const left = String(existingNotes || '').trim();
  const right = String(incomingNotes || '').trim();
  if (!right) return left || null;
  if (!left) return right;
  if (left.includes(right)) return left;
  return `${left} | ${right}`;
}

function parseRows(raw) {
  const rows = String(raw || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [codigoFabricante, descricao, modelos, notes, minimo, quantidade] = line.split('|');
      return {
        codigoFabricante: String(codigoFabricante || '').trim().toUpperCase(),
        descricao: String(descricao || '').trim(),
        modelos: String(modelos || '').trim(),
        notes: String(notes || '').trim(),
        minimo: String(minimo || '').trim(),
        quantidade: String(quantidade || '').trim(),
      };
    })
    .filter((row) => row.codigoFabricante);

  const byCode = new Map();
  for (const row of rows) {
    byCode.set(row.codigoFabricante, row);
  }

  return Array.from(byCode.values());
}

async function cleanupMisparsedRows(rows) {
  const badKeys = new Set(rows.map((row) => row.descricao).filter(Boolean));
  if (badKeys.size === 0) return 0;

  const result = await prisma.stock.deleteMany({
    where: {
      OR: [
        { referencia: { in: Array.from(badKeys) } },
        { codigoFabricante: { in: Array.from(badKeys) } },
      ],
    },
  });

  return result.count;
}

async function syncLatestAttachment() {
  const rows = parseRows(RAW_TABLE);
  const cleaned = await cleanupMisparsedRows(rows);
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const minParsed = parseNumericValue(row.minimo);
    const qtyParsed = parseNumericValue(row.quantidade);
    const extraNotes = [
      row.notes ? `Notas: ${row.notes}` : '',
      row.minimo && minParsed.raw !== String(minParsed.number ?? '') ? `Mínimo original: ${row.minimo}` : '',
      row.quantidade && qtyParsed.raw !== String(qtyParsed.number ?? '') ? `Quantidade original: ${row.quantidade}` : '',
    ].filter(Boolean).join(' | ');

    const existing = await prisma.stock.findMany({
      where: {
        OR: [
          { codigoFabricante: row.codigoFabricante },
          { referencia: row.codigoFabricante },
        ],
      },
      select: {
        id: true,
        referencia: true,
        observacoes: true,
      },
    });

    const mergedNotes = appendStructuredNotes(existing[0]?.observacoes, extraNotes);
    const data = {
      descricao: row.descricao || row.codigoFabricante,
      categoria: inferCategory(row.descricao, row.notes),
      associavelJangada: true,
      aplicavelModeloJangada: row.modelos || null,
      codigoFabricante: row.codigoFabricante,
      estadoArtigo: 'ATIVO',
      observacoes: mergedNotes,
      quantidadeMinima: minParsed.number,
      quantidade: qtyParsed.number ?? 0,
    };

    if (existing.length > 0) {
      await prisma.stock.updateMany({
        where: {
          OR: [
            { codigoFabricante: row.codigoFabricante },
            { referencia: row.codigoFabricante },
          ],
        },
        data,
      });
      updated += existing.length;
    } else {
      await prisma.stock.create({
        data: {
          referencia: row.codigoFabricante,
          precoVenda: 0,
          ...data,
        },
      });
      created += 1;
    }
  }

  console.log('✅ Sincronização da última tabela concluída');
  console.log(`Linhas processadas: ${rows.length}`);
  console.log(`Registos errados limpos: ${cleaned}`);
  console.log(`Criados: ${created}`);
  console.log(`Atualizados: ${updated}`);
}

if (require.main === module) {
  syncLatestAttachment()
    .catch((error) => {
      console.error('❌ Erro na sincronização:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { syncLatestAttachment, parseRows, parseNumericValue };
