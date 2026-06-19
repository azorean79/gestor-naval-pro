const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function asText(v) {
  return String(v || '').trim();
}

function scoreItem(it) {
  let score = 0;
  if (asText(it.imagem)) score += 80;
  if (asText(it.descricao)) score += Math.min(asText(it.descricao).length, 120);
  if (Number(it.precoVenda || 0) > 0) score += 20;
  if (Number(it.precoCompra || 0) > 0) score += 20;
  return score;
}

function dedupeItemsByPartno(items) {
  const byPartno = new Map();
  for (const it of items) {
    const partno = asText(it.partno).toUpperCase();
    if (!partno) continue;
    const current = byPartno.get(partno);
    if (!current || scoreItem(it) > scoreItem(current)) {
      byPartno.set(partno, it);
    }
  }
  return [...byPartno.values()];
}

async function getUniqueReference(baseRef) {
  const cleanBase = asText(baseRef);
  if (!cleanBase) return `OS-${Date.now()}`;

  const exact = await prisma.stock.findUnique({ where: { referencia: cleanBase } });
  if (!exact) return cleanBase;

  for (let i = 2; i <= 9999; i++) {
    const candidate = `${cleanBase}-${i}`;
    const exists = await prisma.stock.findUnique({ where: { referencia: candidate } });
    if (!exists) return candidate;
  }

  return `${cleanBase}-${Date.now()}`;
}

function chooseBestCandidate(candidates, partno) {
  const normalizedPartno = asText(partno).toUpperCase();
  const ranked = [...candidates].sort((a, b) => {
    const score = (row) => {
      let s = 0;
      if (asText(row.codigoFabricante).toUpperCase() === normalizedPartno) s += 1000;
      if (asText(row.referencia).toUpperCase() === normalizedPartno) s += 300;
      if (asText(row.referencia).toUpperCase() === `OS-${normalizedPartno}`) s += 250;
      if (asText(row.foto)) s += 50;
      s += Math.min(asText(row.descricao).length, 100);
      return s;
    };
    return score(b) - score(a);
  });
  return ranked[0] || null;
}

async function main() {
  const jsonPath = path.join(process.cwd(), 'scripts', 'ocean_safety_items.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Ficheiro não encontrado: ${jsonPath}`);
  }

  const rawItems = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const items = dedupeItemsByPartno(rawItems);

  let updated = 0;
  let created = 0;
  let notFound = 0;

  for (const it of items) {
    const partno = asText(it.partno).toUpperCase();
    const desc = asText(it.descricao);
    const oldName1 = `${partno} - ${desc}`;
    const oldName2 = `${partno} ${desc}`;

    if (!partno || !desc) continue;

    const candidates = await prisma.stock.findMany({
      where: {
        OR: [
          { descricao: oldName1 },
          { descricao: oldName2 },
          { codigoFabricante: partno },
          { referencia: partno },
          { referencia: `OS-${partno}` },
        ],
      },
      take: 25,
    });

    const target = chooseBestCandidate(candidates, partno);

    const data = {
      descricao: desc,
      codigoFabricante: partno,
      precoCompra: Number(it.precoCompra ?? 0),
      precoVenda: Number(it.precoVenda ?? 0),
      quantidadeMinima: Number(it.quantidadeMinima ?? 0),
      foto: (it.imagem && String(it.imagem).trim()) ? String(it.imagem).trim() : null,
      categoria: 'Jangadas e Salvatagem',
    };

    if (target) {
      const patch = { ...data };
      if (!asText(target.referencia)) {
        patch.referencia = await getUniqueReference(`OS-${partno}`);
      }
      await prisma.stock.update({ where: { id: target.id }, data: patch });
      updated++;
    } else {
      // criar os que faltarem sem repetir referências
      const uniqueRef = await getUniqueReference(`OS-${partno}`);
      await prisma.stock.create({
        data: {
          referencia: uniqueRef,
          estadoArtigo: 'ATIVO',
          quantidade: 0,
          ...data,
        },
      });
      created++;
      notFound++;
    }
  }

  // limpeza opcional: para artigos ocean safety já existentes com formato antigo, sem código
  // tenta extrair o código do início da descrição e normalizar
  const legacy = await prisma.stock.findMany({
    where: {
      descricao: { startsWith: 'OSL' },
      codigoFabricante: null,
    },
    take: 2000,
  });

  let normalizedLegacy = 0;
  for (const row of legacy) {
    const m = String(row.descricao || '').match(/^([A-Z0-9-]{4,20})\s*-\s*(.+)$/);
    if (!m) continue;
    const part = m[1].trim().toUpperCase();
    const desc = m[2].trim();
    await prisma.stock.update({
      where: { id: row.id },
      data: {
        codigoFabricante: part,
        descricao: desc,
      },
    });
    normalizedLegacy++;
  }

  const duplicateRefs = await prisma.$queryRawUnsafe(`
    SELECT "referencia", COUNT(*)::int AS total
    FROM "Stock"
    WHERE "referencia" IS NOT NULL AND BTRIM("referencia") <> ''
    GROUP BY "referencia"
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, "referencia" ASC
    LIMIT 20
  `);

  const duplicateCodes = await prisma.$queryRawUnsafe(`
    SELECT "codigoFabricante", COUNT(*)::int AS total
    FROM "Stock"
    WHERE "codigoFabricante" IS NOT NULL AND BTRIM("codigoFabricante") <> ''
    GROUP BY "codigoFabricante"
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, "codigoFabricante" ASC
    LIMIT 20
  `);

  console.log('=== Fix Ocean Safety Stock ===');
  console.log(`Itens JSON (originais): ${rawItems.length}`);
  console.log(`Itens após dedupe por partno: ${items.length}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Criados (faltantes): ${created}`);
  console.log(`Normalizados legado: ${normalizedLegacy}`);
  console.log(`Não encontrados no mapeamento original: ${notFound}`);
  console.log(`Duplicados por referencia (top 20): ${duplicateRefs.length}`);
  console.log(`Duplicados por codigoFabricante (top 20): ${duplicateCodes.length}`);

  if (duplicateRefs.length) {
    console.log('Top duplicados referencia:', duplicateRefs.slice(0, 10));
  }
  if (duplicateCodes.length) {
    console.log('Top duplicados codigoFabricante:', duplicateCodes.slice(0, 10));
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
