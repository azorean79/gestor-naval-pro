const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const partsPath = path.join(process.cwd(), 'manuais', 'parts-extracted.json');
  if (!fs.existsSync(partsPath)) {
    console.error('parts-extracted.json not found. Run scripts/extract-parts.js first.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(partsPath, 'utf8'));
  const parts = raw.parts || {};
  const keys = Object.keys(parts);
  console.log('Found', keys.length, 'part candidates');

  for (const pn of keys) {
    try {
      // Skip obviously short numeric table headers
      if (pn.trim().length < 3) continue;

      // Check existing by codigoFabricante
      const existing = await prisma.itemStock.findFirst({ where: { codigoFabricante: pn } });
      if (existing) {
        console.log('exists:', pn, '->', existing.nome);
        continue;
      }

      // derive a name from the first occurrence context
      const occ = parts[pn].occurrences && parts[pn].occurrences[0];
      let nome = `Peça ${pn}`;
      if (occ && occ.context) {
        // try to pick the phrase before part number in context
        const ctx = occ.context.replace(/\t/g, ' | ');
        const before = ctx.split(pn)[0];
        const candidates = before.split('|').map(s => s.trim()).filter(Boolean);
        if (candidates.length) {
          nome = candidates[candidates.length - 1];
        } else if (occ.line) {
          nome = occ.line.substring(0, 60).trim();
        }
      }

      const numeroReferencia = `PN-${pn}`;

      const up = await prisma.itemStock.create({
        data: {
          numeroReferencia,
          nome,
          categoria: 'peca',
          codigoFabricante: pn,
          quantidadeAtual: 0,
          quantidadeMinima: 0
        }
      });
      console.log('created:', pn, up.id, up.nome);
    } catch (err) {
      console.error('error handling', pn, err);
    }
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
