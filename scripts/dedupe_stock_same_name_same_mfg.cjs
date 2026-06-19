const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');

const EXPIRY_KEYWORDS = [
  'facho',
  'fogo de mao',
  'hand flare',
  'handflare',
  'paraquedas',
  'parachute',
  'rocket',
  'agua',
  'potable water',
  'drinking water',
  'racao',
  'ration',
  'fumo',
  'fumigeno',
  'smoke',
  'bateria',
  'battery',
  'luz exterior',
  'exterior light',
  'farmacia',
  'first aid',
  'primeiros socorros',
  'comprimido',
  'tablet',
  'enjoo',
  'seasick',
  'ots65',
  'valvula ots65',
  'thanner ots65',
  'tubo de alta pressao',
  'high pressure hose',
  'high pressure hoses',
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

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

function getDistinctNonEmpty(rows, field) {
  const set = new Set();
  for (const row of rows) {
    const value = String(row?.[field] || '').trim();
    if (value) set.add(value);
  }
  return Array.from(set);
}

function isExpirySensitiveGroup(rows) {
  return rows.some((row) => {
    const haystack = normalizeText([
      row.descricao,
      row.categoria,
      row.codigoFabricante,
      row.observacoes,
      row.aplicavelMarcaJangada,
      row.aplicavelModeloJangada,
    ].filter(Boolean).join(' '));
    return EXPIRY_KEYWORDS.some((keyword) => haystack.includes(normalizeText(keyword)));
  });
}

function scoreCanonical(row) {
  let score = 0;
  if (!String(row.referencia || '').startsWith('AUTO-')) score += 1000;
  if (row.codigoFabricante) score += 200;
  if (row.foto) score += 80;
  if (row.observacoes) score += 40;
  if (row.aplicavelMarcaJangada || row.aplicavelModeloJangada) score += 25;
  if (row.categoria) score += 20;
  if (row.quantidade > 0) score += 10;
  if (row.validade) score += 5;
  if (row.lote) score += 5;
  score -= row.id / 1000000;
  return score;
}

function chooseCanonical(rows) {
  return [...rows].sort((a, b) => scoreCanonical(b) - scoreCanonical(a))[0];
}

function sqlIntList(ids) {
  return ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0).join(', ');
}

async function fetchDuplicateGroups() {
  const duplicateCodes = await prisma.$queryRawUnsafe(`
    SELECT "codigoFabricante"
    FROM "Stock"
    WHERE "codigoFabricante" IS NOT NULL
      AND BTRIM("codigoFabricante") <> ''
    GROUP BY "codigoFabricante"
    HAVING COUNT(*) > 1
    ORDER BY "codigoFabricante" ASC
  `);

  const groups = [];
  for (const row of duplicateCodes) {
    const codigoFabricante = String(row.codigoFabricante || '').trim();
    if (!codigoFabricante) continue;
    const group = await prisma.stock.findMany({
      where: { codigoFabricante },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        referencia: true,
        descricao: true,
        categoria: true,
        associavelJangada: true,
        aplicavelMarcaJangada: true,
        aplicavelModeloJangada: true,
        precoCompra: true,
        codigoFabricante: true,
        inventario: true,
        lote: true,
        validade: true,
        precoVenda: true,
        quantidade: true,
        quantidadeMinima: true,
        foto: true,
        localizacao: true,
        observacoes: true,
      },
    });

    if (group.length > 1) {
      groups.push(group);
    }
  }

  return groups;
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

    await tx.$executeRawUnsafe(
      `UPDATE "InspecaoArtigo"
       SET "stockId" = ${Number(canonical.id)},
           "referencia" = '${String(canonical.referencia).replace(/'/g, "''")}',
           "descricao" = '${String(canonical.descricao).replace(/'/g, "''")}',
           "observacoes" = ${appendUnique(item.observacoes, `Stock fundido para ${canonical.referencia}`) ? `'${String(appendUnique(item.observacoes, `Stock fundido para ${canonical.referencia}`)).replace(/'/g, "''")}'` : 'NULL'}
       WHERE "id" = ${Number(item.id)}`
    );
    updated += 1;
  }

  return { merged, deleted, updated, total: aliasInspecoes.length };
}

async function mergeGroup(tx, group) {
  const canonical = chooseCanonical(group);
  const aliases = group.filter((row) => row.id !== canonical.id);
  const allRows = [canonical, ...aliases];

  const distinctValidades = getDistinctNonEmpty(allRows, 'validade');
  const distinctLotes = getDistinctNonEmpty(allRows, 'lote');
  const expirySensitive = isExpirySensitiveGroup(allRows);

  if (distinctValidades.length > 1 || distinctLotes.length > 1) {
    return {
      status: 'skipped',
      reason: `lotes/validades diferentes (${distinctLotes.join(', ') || '-'} | ${distinctValidades.join(', ') || '-'})`,
      canonical,
      aliases,
      expirySensitive,
    };
  }

  const mergedQuantity = allRows.reduce((sum, row) => sum + Number(row.quantidade || 0), 0);
  const mergedMin = Math.max(...allRows.map((row) => Number(row.quantidadeMinima || 0)), 0) || null;
  const aliasRefs = aliases.map((row) => row.referencia).join(', ');
  const note = `Dedupe automático por descrição+cód. fabricante em ${new Date().toISOString().slice(0, 10)}. Aliases: ${aliasRefs}.`;

  await tx.movimentacaoStock.updateMany({
    where: { stockId: { in: aliases.map((row) => row.id) } },
    data: { stockId: canonical.id },
  });

  const inspecaoStats = await mergeInspecaoArtigos(tx, canonical, aliases);

  await tx.stock.update({
    where: { id: canonical.id },
    data: {
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
      quantidadeMinima: mergedMin,
      foto: firstNonEmpty(canonical.foto, ...aliases.map((row) => row.foto)),
      localizacao: firstNonEmpty(canonical.localizacao, ...aliases.map((row) => row.localizacao)),
      observacoes: appendUnique(canonical.observacoes, note),
    },
  });

  await tx.stock.deleteMany({
    where: { id: { in: aliases.map((row) => row.id) } },
  });

  return {
    status: 'merged',
    canonical,
    aliases,
    expirySensitive,
    inspecaoStats,
    mergedQuantity,
  };
}

async function main() {
  const groups = await fetchDuplicateGroups();
  console.log(`Grupos duplicados encontrados (cód. fabricante): ${groups.length}`);

  const preview = [];
  for (const group of groups) {
    const canonical = chooseCanonical(group);
    const aliases = group.filter((row) => row.id !== canonical.id);
    const distinctValidades = getDistinctNonEmpty(group, 'validade');
    const distinctLotes = getDistinctNonEmpty(group, 'lote');
    const expirySensitive = isExpirySensitiveGroup(group);
    const willSkip = distinctValidades.length > 1 || distinctLotes.length > 1;

    preview.push({
      descricao: canonical.descricao,
      codigoFabricante: canonical.codigoFabricante,
      canonicalRef: canonical.referencia,
      aliasRefs: aliases.map((row) => row.referencia),
      expirySensitive,
      distinctValidades,
      distinctLotes,
      action: willSkip ? 'skip' : 'merge',
    });
  }

  const mergeable = preview.filter((item) => item.action === 'merge');
  const skipped = preview.filter((item) => item.action === 'skip');

  console.log(`Mergeáveis: ${mergeable.length}`);
  console.log(`Ignorados por lote/validade divergente: ${skipped.length}`);

  const sample = preview.slice(0, 30);
  for (const item of sample) {
    console.log(`- [${item.action}] ${item.descricao} | mfg=${item.codigoFabricante} | can=${item.canonicalRef} | aliases=${item.aliasRefs.join(', ')}${item.expirySensitive ? ' | validade-sensível' : ''}`);
  }

  if (!APPLY) {
    console.log('\nModo preview: nada foi alterado. Use --apply para executar.');
    return;
  }

  let mergedGroups = 0;
  let skippedGroups = 0;
  let movedInspecaoRows = 0;
  let mergedInspecaoRows = 0;

  for (const group of groups) {
    const result = await prisma.$transaction((tx) => mergeGroup(tx, group));
    if (result.status === 'skipped') {
      skippedGroups += 1;
      if (VERBOSE) {
        console.log(`SKIP ${result.canonical.descricao} (${result.canonical.codigoFabricante}): ${result.reason}`);
      }
      continue;
    }

    mergedGroups += 1;
    movedInspecaoRows += Number(result.inspecaoStats?.updated || 0);
    mergedInspecaoRows += Number(result.inspecaoStats?.merged || 0);

    console.log(`MERGED ${result.canonical.descricao} | can=${result.canonical.referencia} | aliases=${result.aliases.map((row) => row.referencia).join(', ')}`);
  }

  console.log('\nResumo final');
  console.log(`- grupos fundidos: ${mergedGroups}`);
  console.log(`- grupos ignorados: ${skippedGroups}`);
  console.log(`- ligações InspecaoArtigo atualizadas: ${movedInspecaoRows}`);
  console.log(`- ligações InspecaoArtigo consolidadas: ${mergedInspecaoRows}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
