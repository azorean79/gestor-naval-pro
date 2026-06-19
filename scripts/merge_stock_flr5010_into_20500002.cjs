const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const CANONICAL_REF = '20500002';
const MANUFACTURER_CODE = 'FLR5010';

function appendUnique(base, extra) {
  const left = String(base || '').trim();
  const right = String(extra || '').trim();
  if (!right) return left || null;
  if (!left) return right;
  if (left.includes(right)) return left;
  return `${left} | ${right}`;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    return value;
  }
  return null;
}

function mergeCsvLike(...values) {
  const set = new Set();
  for (const value of values) {
    const raw = String(value || '').trim();
    if (!raw) continue;
    raw
      .split(/[|,;]+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => set.add(part));
  }
  return Array.from(set).join(', ') || null;
}

function sqlIntList(ids) {
  return ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0).join(', ');
}

async function hasInspecaoArtigoTable(tx) {
  const result = await tx.$queryRawUnsafe(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'InspecaoArtigo'
    ) AS "exists"
  `);

  return Array.isArray(result) && Boolean(result[0]?.exists);
}

async function fetchInspecaoArtigos(tx, stockIds) {
  const ids = sqlIntList(stockIds);
  if (!ids) return [];
  return tx.$queryRawUnsafe(`SELECT * FROM "InspecaoArtigo" WHERE "stockId" IN (${ids}) ORDER BY "id" ASC`);
}

async function mergeInspecaoArtigos(tx, canonical, aliases) {
  const hasTable = await hasInspecaoArtigoTable(tx);
  if (!hasTable) {
    return { total: 0, merged: 0, updated: 0, skipped: true };
  }

  const aliasIds = aliases.map((row) => row.id);
  const aliasInspecoes = await fetchInspecaoArtigos(tx, aliasIds);
  let merged = 0;
  let updated = 0;

  for (const item of aliasInspecoes) {
    const existing = await tx.$queryRawUnsafe(
      `SELECT * FROM "InspecaoArtigo" WHERE "inspecaoId" = ${Number(item.inspecaoId)} AND "stockId" = ${Number(canonical.id)} LIMIT 1`
    );

    if (Array.isArray(existing) && existing.length > 0) {
      const current = existing[0];
      const quantidadePlaneada = Math.max(Number(current.quantidadePlaneada || 0), Number(item.quantidadePlaneada || 0));
      const quantidadeUsada = Math.max(Number(current.quantidadeUsada || 0), Number(item.quantidadeUsada || 0));
      const estado = String(current.estado || '').trim() && String(current.estado || '').trim().toLowerCase() !== 'pendente'
        ? current.estado
        : item.estado;
      const observacoes = appendUnique(current.observacoes, `Fundido do stock ${item.referencia || item.stockId} para ${canonical.referencia}`);

      await tx.$executeRawUnsafe(
        `UPDATE "InspecaoArtigo"
         SET "quantidadePlaneada" = ${quantidadePlaneada},
             "quantidadeUsada" = ${quantidadeUsada},
             "estado" = ${estado ? `'${String(estado).replace(/'/g, "''")}'` : 'NULL'},
             "referencia" = '${String(canonical.referencia).replace(/'/g, "''")}',
             "descricao" = '${String(canonical.descricao).replace(/'/g, "''")}',
             "observacoes" = ${observacoes ? `'${String(observacoes).replace(/'/g, "''")}'` : 'NULL'}
         WHERE "id" = ${Number(current.id)}`
      );

      await tx.$executeRawUnsafe(`DELETE FROM "InspecaoArtigo" WHERE "id" = ${Number(item.id)}`);
      merged += 1;
      continue;
    }

    const observacoes = appendUnique(item.observacoes, `Stock fundido para ${canonical.referencia}`);
    await tx.$executeRawUnsafe(
      `UPDATE "InspecaoArtigo"
       SET "stockId" = ${Number(canonical.id)},
           "referencia" = '${String(canonical.referencia).replace(/'/g, "''")}',
           "descricao" = '${String(canonical.descricao).replace(/'/g, "''")}',
           "observacoes" = ${observacoes ? `'${String(observacoes).replace(/'/g, "''")}'` : 'NULL'}
       WHERE "id" = ${Number(item.id)}`
    );
    updated += 1;
  }

  return { total: aliasInspecoes.length, merged, updated };
}

async function main() {
  const rows = await prisma.stock.findMany({
    where: {
      OR: [
        { referencia: CANONICAL_REF },
        { codigoFabricante: MANUFACTURER_CODE },
      ],
    },
    orderBy: [{ referencia: 'asc' }, { id: 'asc' }],
  });

  const canonical = rows.find((row) => row.referencia === CANONICAL_REF);
  if (!canonical) {
    throw new Error(`Referência canónica não encontrada: ${CANONICAL_REF}`);
  }

  const aliases = rows.filter((row) => row.id !== canonical.id && String(row.codigoFabricante || '').trim().toUpperCase() === MANUFACTURER_CODE);

  console.log(`Artigos encontrados: ${rows.length}`);
  rows.forEach((row) => {
    console.log(`- id=${row.id} | ref=${row.referencia} | mfg=${row.codigoFabricante || '-'} | desc=${row.descricao} | qtd=${row.quantidade} | lote=${row.lote || '-'} | validade=${row.validade || '-'}`);
  });

  if (aliases.length === 0) {
    console.log(`Nenhum alias com código fabricante ${MANUFACTURER_CODE} para fundir em ${CANONICAL_REF}.`);
    return;
  }

  const distinctLotes = Array.from(new Set(rows.map((row) => String(row.lote || '').trim()).filter(Boolean)));
  const distinctValidades = Array.from(new Set(rows.map((row) => String(row.validade || '').trim()).filter(Boolean)));
  if (distinctLotes.length > 1 || distinctValidades.length > 1) {
    throw new Error(`Merge abortado: lotes/validades divergentes. lotes=[${distinctLotes.join(', ')}] validades=[${distinctValidades.join(', ')}]`);
  }

  const mergedQuantity = rows.reduce((sum, row) => sum + Number(row.quantidade || 0), 0);
  const mergedMin = Math.max(...rows.map((row) => Number(row.quantidadeMinima || 0)), 0) || null;
  const aliasRefs = aliases.map((row) => row.referencia);
  const note = `Merge manual em ${new Date().toISOString().slice(0, 10)}: FLR5010 -> ${CANONICAL_REF}. Aliases: ${aliasRefs.join(', ')}.`;

  console.log(`\nCanónico: ${canonical.referencia}`);
  console.log(`Aliases a fundir: ${aliasRefs.join(', ')}`);
  console.log(`Quantidade final prevista: ${mergedQuantity}`);
  console.log(`Quantidade mínima final prevista: ${mergedMin ?? '-'}`);

  if (!APPLY) {
    console.log('\nModo preview: nada foi alterado. Use --apply para executar.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.movimentacaoStock.updateMany({
      where: { stockId: { in: aliases.map((row) => row.id) } },
      data: { stockId: canonical.id },
    });

    const inspecaoStats = await mergeInspecaoArtigos(tx, canonical, aliases);

    await tx.stock.update({
      where: { id: canonical.id },
      data: {
        descricao: firstNonEmpty(canonical.descricao, ...aliases.map((row) => row.descricao)),
        categoria: firstNonEmpty(canonical.categoria, ...aliases.map((row) => row.categoria)),
        associavelJangada: rows.some((row) => Boolean(row.associavelJangada)),
        aplicavelMarcaJangada: mergeCsvLike(...rows.map((row) => row.aplicavelMarcaJangada)),
        aplicavelModeloJangada: mergeCsvLike(...rows.map((row) => row.aplicavelModeloJangada)),
        precoCompra: firstNonEmpty(canonical.precoCompra, ...aliases.map((row) => row.precoCompra)),
        codigoFabricante: MANUFACTURER_CODE,
        inventario: firstNonEmpty(canonical.inventario, ...aliases.map((row) => row.inventario)),
        lote: firstNonEmpty(canonical.lote, ...aliases.map((row) => row.lote)),
        validade: firstNonEmpty(canonical.validade, ...aliases.map((row) => row.validade)),
        precoVenda: firstNonEmpty(canonical.precoVenda, ...aliases.map((row) => row.precoVenda), 0),
        quantidade: mergedQuantity,
        quantidadeMinima: mergedMin,
        foto: firstNonEmpty(canonical.foto, ...aliases.map((row) => row.foto)),
        localizacao: firstNonEmpty(canonical.localizacao, ...aliases.map((row) => row.localizacao)),
        observacoes: appendUnique(canonical.observacoes, note),
      },
    });

    await tx.stock.deleteMany({
      where: { id: { in: aliases.map((row) => row.id) } },
    });

    console.log(`InspecaoArtigo atualizadas: ${inspecaoStats.updated}`);
    console.log(`InspecaoArtigo consolidadas: ${inspecaoStats.merged}`);
    if (inspecaoStats.skipped) {
      console.log('InspecaoArtigo: tabela inexistente nesta base, atualização ignorada.');
    }
  });

  console.log(`\n✓ Fundidos ${aliases.length} artigo(s) com código fabricante ${MANUFACTURER_CODE} em ${CANONICAL_REF}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
