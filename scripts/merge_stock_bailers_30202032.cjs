const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const CANONICAL_REF = '30202032';
const MANUFACTURER_CODES = ['SUR0152', 'OSL0315', '05720107'];
const EXTRA_REFS = ['RFD-05720107'];
const DESCRIPTION_PATTERNS = ['bailer', 'batedouro', 'jarro pvc'];

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
    raw.split(/[|,;]+/).map((part) => part.trim()).filter(Boolean).forEach((part) => set.add(part));
  }
  return Array.from(set).join(', ') || null;
}

function sqlIntList(ids) {
  return ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0).join(', ');
}

async function fetchInspecaoArtigos(tx, stockIds) {
  const ids = sqlIntList(stockIds);
  if (!ids) return [];
  return tx.$queryRawUnsafe(`SELECT * FROM "InspecaoArtigo" WHERE "stockId" IN (${ids}) ORDER BY "id" ASC`);
}

async function mergeInspecaoArtigos(tx, canonical, aliases) {
  const aliasIds = aliases.map((row) => row.id);
  const aliasInspecoes = await fetchInspecaoArtigos(tx, aliasIds);
  let merged = 0;
  let deleted = 0;
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
      const observacoes = appendUnique(
        current.observacoes,
        `Fundido do stock ${item.referencia || item.stockId} para ${canonical.referencia}`,
      );

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
      deleted += 1;
      continue;
    }

    const mergedNote = appendUnique(item.observacoes, `Stock fundido para ${canonical.referencia}`);
    await tx.$executeRawUnsafe(
      `UPDATE "InspecaoArtigo"
       SET "stockId" = ${Number(canonical.id)},
           "referencia" = '${String(canonical.referencia).replace(/'/g, "''")}',
           "descricao" = '${String(canonical.descricao).replace(/'/g, "''")}',
           "observacoes" = ${mergedNote ? `'${String(mergedNote).replace(/'/g, "''")}'` : 'NULL'}
       WHERE "id" = ${Number(item.id)}`
    );
    updated += 1;
  }

  return { merged, deleted, updated, total: aliasInspecoes.length };
}

async function fetchRows() {
  return prisma.stock.findMany({
    where: {
      OR: [
        { referencia: CANONICAL_REF },
        { referencia: { in: EXTRA_REFS } },
        { codigoFabricante: { in: MANUFACTURER_CODES } },
        ...DESCRIPTION_PATTERNS.map((pattern) => ({ descricao: { contains: pattern, mode: 'insensitive' } })),
      ],
    },
    orderBy: { id: 'asc' },
  });
}

async function main() {
  const rows = await fetchRows();
  const canonical = rows.find((row) => row.referencia === CANONICAL_REF);
  if (!canonical) {
    throw new Error(`Referência canónica não encontrada: ${CANONICAL_REF}`);
  }

  const aliases = rows.filter((row) => row.id !== canonical.id);
  const allRows = [canonical, ...aliases];
  const manufacturerCodes = Array.from(new Set(allRows.map((row) => String(row.codigoFabricante || '').trim()).filter(Boolean)));
  const aliasRefs = aliases.map((row) => row.referencia);
  const mergedQuantity = allRows.reduce((sum, row) => sum + Number(row.quantidade || 0), 0);
  const mergedMin = Math.max(...allRows.map((row) => Number(row.quantidadeMinima || 0)), 0);
  const preferredDescription = firstNonEmpty(canonical.descricao, ...aliases.map((row) => row.descricao)) || 'Bailer';
  const note = [
    `Fusão manual de bailers em ${CANONICAL_REF} (${new Date().toISOString().slice(0, 10)}).`,
    aliasRefs.length ? `Aliases: ${aliasRefs.join(', ')}.` : null,
    manufacturerCodes.length ? `Códigos fabricante consolidados: ${manufacturerCodes.join(', ')}.` : null,
  ].filter(Boolean).join(' ');

  console.log(`Canónico: ${canonical.referencia} (#${canonical.id})`);
  console.log(`Descrição final proposta: ${preferredDescription}`);
  console.log(`Aliases encontrados: ${aliases.length}`);
  for (const row of aliases) {
    console.log(`- ${row.referencia} | ${row.descricao} | mfg=${row.codigoFabricante || '-'} | qtd=${row.quantidade || 0}`);
  }
  console.log(`Quantidade final: ${mergedQuantity}`);
  console.log(`Qtd. mínima final: ${mergedMin}`);
  console.log(`Códigos fabricante detetados: ${manufacturerCodes.join(', ') || '-'}`);

  if (!APPLY) {
    console.log('\nModo preview: nada foi alterado. Use --apply para executar.');
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.movimentacaoStock.updateMany({
      where: { stockId: { in: aliases.map((row) => row.id) } },
      data: { stockId: canonical.id },
    });

    const inspecaoStats = await mergeInspecaoArtigos(tx, canonical, aliases);

    await tx.stock.update({
      where: { id: canonical.id },
      data: {
        descricao: preferredDescription,
        categoria: firstNonEmpty(canonical.categoria, ...aliases.map((row) => row.categoria)),
        associavelJangada: allRows.some((row) => Boolean(row.associavelJangada)),
        aplicavelMarcaJangada: mergeCsvLike(...allRows.map((row) => row.aplicavelMarcaJangada)),
        aplicavelModeloJangada: mergeCsvLike(...allRows.map((row) => row.aplicavelModeloJangada)),
        precoCompra: firstNonEmpty(canonical.precoCompra, ...aliases.map((row) => row.precoCompra)),
        codigoFabricante: firstNonEmpty(canonical.codigoFabricante, ...aliases.map((row) => row.codigoFabricante)),
        inventario: firstNonEmpty(canonical.inventario, ...aliases.map((row) => row.inventario)),
        lote: firstNonEmpty(canonical.lote, ...aliases.map((row) => row.lote)),
        validade: firstNonEmpty(canonical.validade, ...aliases.map((row) => row.validade)),
        precoVenda: firstNonEmpty(canonical.precoVenda, ...aliases.map((row) => row.precoVenda), 0),
        quantidade: mergedQuantity,
        quantidadeMinima: mergedMin || null,
        foto: firstNonEmpty(canonical.foto, ...aliases.map((row) => row.foto)),
        localizacao: firstNonEmpty(canonical.localizacao, ...aliases.map((row) => row.localizacao)),
        observacoes: appendUnique(canonical.observacoes, note),
      },
    });

    await tx.stock.deleteMany({
      where: { id: { in: aliases.map((row) => row.id) } },
    });

    return { inspecaoStats };
  });

  console.log('\n✓ Bailers fundidos com sucesso.');
  console.log(`- referência canónica: ${CANONICAL_REF}`);
  console.log(`- aliases removidos: ${aliases.length}`);
  console.log(`- InspecaoArtigo atualizados: ${Number(result.inspecaoStats?.updated || 0)}`);
  console.log(`- InspecaoArtigo consolidados: ${Number(result.inspecaoStats?.merged || 0)}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
