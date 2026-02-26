import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '..', 'manuais', 'parts-extracted.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  const parts = parsed.parts || {};

  const keys = Object.keys(parts);
  console.log(`Found ${keys.length} extracted part entries, upserting into ItemStock...`);

  let inserted = 0;
  for (const key of keys) {
    const entry: any = (parts as any)[key];
    const pn = entry.partNumber || key;
    const occ = (entry.occurrences || []) as any[];
    const snippet = occ.length ? ((occ[0].line || '') + ' | ' + (occ[0].context || '')).slice(0, 300) : '';
    const codigoFabricante = /\bRFD\b/i.test(snippet) ? 'RFD' : undefined;
    const numeroReferencia = `PN-${pn}`;

    try {
      await prisma.itemStock.upsert({
        where: { numeroReferencia },
        update: {
          nome: `Part ${pn}`,
          categoria: 'Manual/Parsed',
          descricao: snippet || undefined,
          codigoFabricante: codigoFabricante || undefined,
        },
        create: {
          numeroReferencia,
          nome: `Part ${pn}`,
          categoria: 'Manual/Parsed',
          descricao: snippet || undefined,
          codigoFabricante: codigoFabricante || undefined,
          quantidadeAtual: 0,
        },
      });
      inserted += 1;
    } catch (err) {
      console.error('Upsert failed for', pn, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Upserted ${inserted} items into ItemStock.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
