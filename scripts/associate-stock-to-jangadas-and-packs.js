const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const jangadas = await prisma.jangada.findMany({ where: { numeroReferencia: { contains: 'RFD-SURVIVA-MKIV' } } });
    if (!jangadas || jangadas.length === 0) {
      console.log('No RFD SURVIVA MKIV jangadas found, falling back to any jangadas.');
      const all = await prisma.jangada.findMany({});
      if (!all || all.length === 0) {
        console.error('No jangadas found in DB.');
        return;
      }
      jangadas.push(...all);
    }

    // find spares (RFD items) - fallback: any item with codigoFabricante starting with RFD-
    const spares = await prisma.itemStock.findMany({ where: { codigoFabricante: { startsWith: 'RFD-' } } });
    if (!spares || spares.length === 0) {
      console.log('No RFD spares found. Trying specific known seeds.');
      const known = ['RFD-BAG-001','RFD-STRAP-001','RFD-KIT-001'];
      for(const k of known) {
        const s = await prisma.itemStock.findFirst({ where: { codigoFabricante: k } });
        if (s) spares.push(s);
      }
    }

    if (!spares || spares.length === 0) {
      console.error('No spare items found to associate.');
      return;
    }

    const packs = ['SOLAS A', 'SOLAS B'];
    const associations = [];

    for (const jangada of jangadas) {
      // set default tipoPack for the jangada if not present
      if (!jangada.tipoPack) {
        // alternate packs by index
        const idx = jangadas.indexOf(jangada) || 0;
        const pack = packs[idx % packs.length];
        try {
          await prisma.jangada.update({ where: { id: jangada.id }, data: { tipoPack: pack } });
          console.log(`Set tipoPack=${pack} for jangada ${jangada.numeroReferencia}`);
        } catch (e) {
          console.warn('Failed to set tipoPack for', jangada.numeroReferencia, e.message || e);
        }
      }

      for (const pack of packs) {
        const itemIds = [];
        for (const spare of spares) {
          // update item.observacoes and localizacao to include jangada and pack
          const obs = spare.observacoes ? String(spare.observacoes) : '';
          const add = `Associado a: ${jangada.numeroReferencia} (Pack: ${pack})`;
          const newObs = obs.includes(add) ? obs : `${obs}${obs? ' | ' : ''}${add}`;
          try {
            await prisma.itemStock.update({ where: { id: spare.id }, data: { observacoes: newObs, localizacao: `${jangada.numeroReferencia} - ${pack}` } });
            itemIds.push(spare.id);
            console.log(`Associated item ${spare.numeroReferencia || spare.codigoFabricante || spare.id} to ${jangada.numeroReferencia} / ${pack}`);
          } catch (e) {
            console.warn('Failed to update item', spare.id, e.message || e);
          }
        }
        associations.push({ jangadaId: jangada.id, numeroReferencia: jangada.numeroReferencia, pack, itemIds });
      }
    }

    const outDir = path.join(process.cwd(), 'data');
    await fs.promises.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, 'jangada-stock-associations.json');
    await fs.promises.writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), associations }, null, 2));
    console.log('Wrote associations to', outPath);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
