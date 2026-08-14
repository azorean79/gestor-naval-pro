const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeExactName(value) {
  return cleanText(value).replace(/\s+/g, ' ').toLowerCase();
}

function normalizeCode(value) {
  const raw = cleanText(value);
  if (!raw) return null;

  // Ex.: 0.08.11.14.0 -> 00811140
  // Aplicar apenas quando não existem letras e há separadores típicos
  const hasLetters = /[A-Z]/i.test(raw);
  if (hasLetters) return raw.toUpperCase();

  const hasSeparators = /[.\s\-\/]/.test(raw);
  const digitsOnly = raw.replace(/\D/g, '');

  if (hasSeparators && digitsOnly.length > 0) {
    return digitsOnly;
  }

  return raw.toUpperCase();
}

function mergeNotes(...parts) {
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const t = cleanText(p);
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.length ? out.join(' | ') : null;
}

function pickLongestText(values) {
  return values
    .map((v) => cleanText(v))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || null;
}

function buildComponents(rows) {
  const idToRow = new Map(rows.map((r) => [r.id, r]));
  const adjacency = new Map(rows.map((r) => [r.id, new Set()]));
  const keyToIds = new Map();

  for (const row of rows) {
    const keys = [];
    if (row.normCodigo) keys.push(`C:${row.normCodigo}`);
    if (row.normReferencia) keys.push(`R:${row.normReferencia}`);
    if (row.normDescricao) keys.push(`D:${row.normDescricao}`);

    for (const key of keys) {
      if (!keyToIds.has(key)) keyToIds.set(key, []);
      keyToIds.get(key).push(row.id);
    }
  }

  for (const ids of keyToIds.values()) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        adjacency.get(ids[i]).add(ids[j]);
        adjacency.get(ids[j]).add(ids[i]);
      }
    }
  }

  const visited = new Set();
  const components = [];

  for (const row of rows) {
    if (visited.has(row.id)) continue;
    const stack = [row.id];
    visited.add(row.id);
    const compIds = [];

    while (stack.length) {
      const id = stack.pop();
      compIds.push(id);
      for (const next of adjacency.get(id) || []) {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push(next);
        }
      }
    }

    components.push(compIds.map((id) => idToRow.get(id)));
  }

  return components;
}

function chooseCanonicalCode(component) {
  const normalizedCodes = component
    .map((r) => r.normCodigo)
    .filter(Boolean);
  if (normalizedCodes.length > 0) return normalizedCodes[0];

  const normalizedRefs = component
    .map((r) => r.normReferencia)
    .filter(Boolean);
  if (normalizedRefs.length > 0) return normalizedRefs[0];

  return null;
}

function chooseKeeper(component, canonicalCode) {
  const score = (r) => {
    let s = 0;
    if (canonicalCode && r.referencia === canonicalCode) s += 100;
    if (canonicalCode && r.codigoFabricante === canonicalCode) s += 90;
    if (r.codigoFabricante) s += 30;
    if (r.referencia) s += 20;
    if (r.descricao) s += 10;
    s += Number(r.quantidade || 0);
    s += Number(r.quantidadeMinima || 0);
    return s;
  };

  return [...component].sort((a, b) => score(b) - score(a) || b.id - a.id)[0];
}

async function run() {
  const rows = await prisma.stock.findMany({
    select: {
      id: true,
      referencia: true,
      codigoFabricante: true,
      descricao: true,
      estadoArtigo: true,
      categoria: true,
      associavelJangada: true,
      aplicavelMarcaJangada: true,
      aplicavelModeloJangada: true,
      precoCompra: true,
      precoVenda: true,
      quantidade: true,
      quantidadeMinima: true,
      localizacao: true,
      observacoes: true,
      updatedAt: true,
    },
    orderBy: { id: 'asc' },
  });

  const enriched = rows.map((r) => ({
    ...r,
    normReferencia: normalizeCode(r.referencia),
    normCodigo: normalizeCode(r.codigoFabricante),
    normDescricao: normalizeExactName(r.descricao),
  }));

  const components = buildComponents(enriched);
  const singletons = components.filter((c) => c.length === 1);
  const groups = components.filter((c) => c.length > 1);

  let normalizedSingles = 0;
  let groupsMerged = 0;
  let rowsDeleted = 0;
  let movementReassigned = 0;

  // 1) Dedup por componentes ligados por referência/código normalizados e/ou descrição idêntica
  for (const component of groups) {
    const canonicalCode = chooseCanonicalCode(component);
    if (!canonicalCode) continue;

    const keeper = chooseKeeper(component, canonicalCode);
    const duplicates = component.filter((r) => r.id !== keeper.id);

    const quantidadeTotal = component.reduce((acc, r) => acc + Number(r.quantidade || 0), 0);
    const quantidadeMinimaMax = component.reduce((acc, r) => {
      const v = r.quantidadeMinima;
      if (v == null) return acc;
      return acc == null ? v : Math.max(acc, v);
    }, null);

    const mergedData = {
      referencia: canonicalCode,
      codigoFabricante: canonicalCode,
      descricao: pickLongestText(component.map((r) => r.descricao)) || canonicalCode,
      estadoArtigo: component.some((r) => String(r.estadoArtigo || '').toUpperCase() === 'ATIVO') ? 'ATIVO' : keeper.estadoArtigo,
      categoria: pickLongestText(component.map((r) => r.categoria)) || keeper.categoria,
      associavelJangada: component.some((r) => Boolean(r.associavelJangada)),
      aplicavelMarcaJangada: pickLongestText(component.map((r) => r.aplicavelMarcaJangada)) || null,
      aplicavelModeloJangada: pickLongestText(component.map((r) => r.aplicavelModeloJangada)) || null,
      precoCompra: keeper.precoCompra,
      precoVenda: component.find((r) => Number(r.precoVenda || 0) > 0)?.precoVenda ?? keeper.precoVenda,
      quantidade: quantidadeTotal,
      quantidadeMinima: quantidadeMinimaMax,
      localizacao: pickLongestText(component.map((r) => r.localizacao)) || keeper.localizacao,
      observacoes: mergeNotes(...component.map((r) => r.observacoes)),
    };

    await prisma.$transaction(async (tx) => {
      for (const dup of duplicates) {
        // Libertar unique de referencia antes de atualizar keeper
        await tx.stock.update({
          where: { id: dup.id },
          data: { referencia: `__MERGE_TMP_${dup.id}__` },
        });

        const upd = await tx.movimentacaoStock.updateMany({
          where: { stockId: dup.id },
          data: { stockId: keeper.id },
        });
        movementReassigned += upd.count;
      }

      await tx.stock.update({
        where: { id: keeper.id },
        data: mergedData,
      });

      await tx.stock.deleteMany({
        where: { id: { in: duplicates.map((d) => d.id) } },
      });
    });

    groupsMerged += 1;
    rowsDeleted += duplicates.length;
  }

  // 2) Normaliza linhas isoladas (após merges, para evitar conflito de unique)
  for (const [component] of singletons) {
    const canonicalCode = component.normCodigo || component.normReferencia;
    const nextRef = canonicalCode || component.referencia;
    const nextCode = canonicalCode || component.codigoFabricante;

    const changed =
      nextRef !== component.referencia ||
      nextCode !== component.codigoFabricante;

    if (!changed) continue;

    const blocker = await prisma.stock.findFirst({
      where: {
        referencia: nextRef,
        NOT: { id: component.id },
      },
      select: { id: true },
    });

    if (blocker) {
      // Evitar quebrar o script por conflito residual; este caso fica para uma próxima execução de merge
      continue;
    }

    await prisma.stock.update({
      where: { id: component.id },
      data: {
        referencia: nextRef,
        codigoFabricante: nextCode,
      },
    });

    normalizedSingles += 1;
  }

  // 3) Validação pós-processo
  const dottedLeft = await prisma.stock.count({
    where: {
      OR: [
        { referencia: { contains: '.' } },
        { codigoFabricante: { contains: '.' } },
      ],
    },
  });

  const finalRows = await prisma.stock.findMany({
    select: { id: true, referencia: true, codigoFabricante: true },
  });

  const duplicatedNormalizedBuckets = new Map();
  for (const row of finalRows) {
    const nr = normalizeCode(row.referencia);
    const nc = normalizeCode(row.codigoFabricante);
    const keys = [];
    if (nr) keys.push(`R:${nr}`);
    if (nc) keys.push(`C:${nc}`);
    for (const k of keys) {
      if (!duplicatedNormalizedBuckets.has(k)) duplicatedNormalizedBuckets.set(k, []);
      duplicatedNormalizedBuckets.get(k).push(row.id);
    }
  }

  const conflictBuckets = Array.from(duplicatedNormalizedBuckets.entries())
    .filter(([, ids]) => ids.length > 1)
    .length;

  const allAfter = await prisma.stock.findMany({
    select: { descricao: true },
  });

  const nameMap = new Map();
  for (const row of allAfter) {
    const key = normalizeExactName(row.descricao);
    if (!key) continue;
    nameMap.set(key, (nameMap.get(key) || 0) + 1);
  }
  const duplicateExactNames = Array.from(nameMap.values()).filter((v) => v > 1).length;

  console.log('✅ Normalização e deduplicação concluídas');
  console.log(JSON.stringify({
    totalLidos: rows.length,
    normalizadosSemMerge: normalizedSingles,
    gruposUnificados: groupsMerged,
    linhasRemovidas: rowsDeleted,
    movimentacoesReatribuídas: movementReassigned,
    comPontosRestantes: dottedLeft,
    bucketsNormalizadosComMaisDe1: conflictBuckets,
    descricoes100pctIguaisRepetidas: duplicateExactNames,
  }, null, 2));
}

if (require.main === module) {
  run()
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { run, normalizeCode };
