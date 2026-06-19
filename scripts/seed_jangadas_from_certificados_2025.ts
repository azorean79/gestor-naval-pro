import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Artigos relevantes a importar
const ARTIGOS_RELEVANTES = [
  'Handflares',
  'First Aid Kit',
  'Seasickness Tables',
  'Parachute Rockets',
  'Water Sachets',
  'Rações Alimentares 0,5 Kg',
  'Food Rations 0,5 Kg',
  'Lithium Battery',
  'Inside Light and Battery',
  'Top Light and Battery',
  'Smoke Signals',
  'Baterias',
  'Luzes',
];

const DATA_PATH = 'scripts/jangadas_pack_validades_2025.json';

async function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);
  const rows = Array.isArray(data.rows) ? data.rows : [];
  for (const row of rows) {
    const serial = row.raftSerial?.trim();
    if (!serial) continue;
    type Validity = { item: string; validade: string };
    const artigos = (Array.isArray(row.validities) ? row.validities : [])
      .filter((a: Validity) => ARTIGOS_RELEVANTES.includes(a.item))
      .map((a: Validity) => ({ item: a.item, validade: a.validade }));
    if (!artigos.length) continue;
    await prisma.jangada.updateMany({
      where: { serial },
      data: { artigos: JSON.stringify(artigos) },
    });
    console.log(`Atualizado artigos da jangada ${serial}`);
  }
  await prisma.$disconnect();
  console.log('Seed de artigos/validades concluído.');
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
