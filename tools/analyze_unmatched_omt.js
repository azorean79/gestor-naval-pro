const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const iconv = require('iconv-lite');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.gestornavalpro_DATABASE_URL ||
  process.env.GESTOR_DB;

if (!connectionString) {
  throw new Error('No database connection string found.');
}

process.env.DATABASE_URL = connectionString;
const prisma = new PrismaClient();

const ADDRESS_START_PATTERNS = [
  /\bRUA\b/ui,
  /\bR\.\s/ui,
  /\bAV(?:ENIDA)?\.?\s/ui,
  /\bESTRADA\b/ui,
  /\bCANADA\b/ui,
  /\bCAMINHO\b/ui,
  /\bCALCADA\b/ui,
  /\bCALÇADA\b/ui,
  /\bTRAVESSA\b/ui,
  /\bLARGO\b/ui,
  /\bPRAÇA\b/ui,
  /\bPRACA\b/ui,
  /\bBAIRRO\b/ui,
  /\bMARINA\b/ui,
  /\bPORTO\b/ui,
  /\bROCHA\b/ui,
  /\bLADEIRA\b/ui,
  /\bLUGAR\b/ui,
  /\bCLUBE\s+NAVAL\b/ui,
  /\bAPARTADO\b/ui,
  /\bMONTE\b/ui,
  /\bVARADOURO\b/ui,
  /\bTERMO\b/ui,
  /\bAVENIDA\b/ui,
  /\bGROTA\b/ui,
  /\bRAMAL\b/ui,
  /\bURBANIZACAO\b/ui,
  /\bURBANIZAÇÃO\b/ui,
  /\bLOTE\b/ui,
];

const PLACEHOLDER_MORADA_PATTERNS = [/^$/i, /^morada nao indicada$/i, /^morada não indicada$/i, /^ilha\s+/i, /^n\/d$/i, /^nd$/i, /^desconhecida$/i];

function fixMojibake(value) {
  const recoveredFromCp850 = iconv.decode(iconv.encode(value, 'cp850'), 'utf8')
    .replace(/^\?+/, '')
    .replace(/^\uFEFF/, '');

  const normalized = recoveredFromCp850
    .replace(/(^|[\s,(])º\s+(\d)/g, '$1nº $2')
    .replace(/nº\s*,\s*/g, 'nº ')
    .replace(/[^\S\r\n]{2,}/g, ' ');

  const originalNoise = (value.match(/[├┬�]/g) || []).length;
  const recoveredNoise = (normalized.match(/[├┬�]/g) || []).length;
  return recoveredNoise <= originalNoise ? normalized : value;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function normalizeTextWithIndexMap(value) {
  const source = String(value || '');
  let normalized = '';
  const indexMap = [];
  let lastWasSpace = false;

  for (let i = 0; i < source.length; i += 1) {
    const expanded = source[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    for (const char of expanded) {
      const mapped = /[A-Z0-9]/.test(char) ? char : ' ';
      if (mapped === ' ') {
        if (lastWasSpace) continue;
        normalized += ' ';
        indexMap.push(i);
        lastWasSpace = true;
        continue;
      }
      normalized += mapped;
      indexMap.push(i);
      lastWasSpace = false;
    }
  }

  const startTrim = (normalized.match(/^\s+/) || [''])[0].length;
  const endTrim = (normalized.match(/\s+$/) || [''])[0].length;

  return {
    normalized: normalized.trim(),
    indexMap: indexMap.slice(startTrim, endTrim ? indexMap.length - endTrim : undefined),
  };
}

function isPlaceholderMorada(value) {
  const trimmed = String(value || '').trim();
  return PLACEHOLDER_MORADA_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isHeaderOrNoise(line) {
  const upper = normalizeText(line);
  if (!upper) return true;
  if (upper.startsWith('ATIVIDADE MARITIMO TURISTICA')) return true;
  if (upper.startsWith('LICENCA OPERADOR MARITIMO TURISTICO MORADA')) return true;
  if (upper.startsWith('DATA DA ATUALIZACAO')) return true;
  if (/^\d+\s*\/\s*\d+$/.test(line.trim())) return true;
  if (/^--\s*\d+\s+OF\s+\d+\s*--$/i.test(line.trim())) return true;
  return false;
}

function extractPostalAndLocalidade(line) {
  const raw = String(line || '').trim();
  if (!raw) return { codigoPostal: null, localidade: null };
  const match = raw.match(/^(\d{4,5}-\d{3}|\d{4})\s*(.*)$/);
  if (!match) return { codigoPostal: null, localidade: raw || null };
  const [, codigoPostal, rest] = match;
  return { codigoPostal, localidade: rest.replace(/^[-,\s]+/, '').trim() || null };
}

function findAddressStartIndex(payload) {
  let bestIndex = -1;
  for (const pattern of ADDRESS_START_PATTERNS) {
    const match = pattern.exec(payload);
    if (!match || typeof match.index !== 'number' || match.index <= 0) continue;
    if (bestIndex === -1 || match.index < bestIndex) bestIndex = match.index;
  }
  return bestIndex;
}

function splitNameAndAddress(payload) {
  const index = findAddressStartIndex(payload);
  if (index === -1) return { nome: payload.trim(), moradaLine: '' };
  return {
    nome: payload.slice(0, index).trim().replace(/[.,;:-]+$/, '').trim(),
    moradaLine: payload.slice(index).trim(),
  };
}

function findUniquePrefixClienteMatch(payload, candidateKeys) {
  const { normalized, indexMap } = normalizeTextWithIndexMap(payload);
  let bestKey = null;
  let bestLength = -1;

  for (const key of candidateKeys) {
    if (!normalized.startsWith(key)) continue;
    const nextChar = normalized[key.length];
    if (nextChar && nextChar !== ' ') continue;
    if (key.length > bestLength) {
      bestKey = key;
      bestLength = key.length;
    } else if (key.length === bestLength && bestKey !== key) {
      bestKey = null;
    }
  }

  if (!bestKey || bestLength <= 0 || !indexMap.length) return null;

  const splitMapIndex = Math.min(bestLength - 1, indexMap.length - 1);
  const splitIndex = indexMap[splitMapIndex] + 1;
  const moradaLine = payload.slice(splitIndex).replace(/^[\s,.;:-]+/, '').trim();
  if (!moradaLine) return null;
  return { key: bestKey, moradaLine };
}

function parseOmtEntries(filePath) {
  const rawText = fs.readFileSync(filePath, 'utf8');
  const text = fixMojibake(rawText);
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => !isHeaderOrNoise(line));
  const entries = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^(\d{1,2}\/\d{4})\s+(.+)$/);
    if (!match) continue;

    const [, license, payload] = match;
    const { nome, moradaLine } = splitNameAndAddress(payload);
    const nextLine = lines[i + 1] && !/^\d{1,2}\/\d{4}\s+/.test(lines[i + 1]) ? lines[i + 1] : '';
    if (nextLine) i += 1;

    const morada = [moradaLine, nextLine].filter(Boolean).join(', ').replace(/\s+,/g, ',').trim();
    const { codigoPostal, localidade } = extractPostalAndLocalidade(nextLine);
    if (!nome || !morada) continue;
    entries.push({ license, nome, payload, moradaLine, postalLine: nextLine, morada, codigoPostal, localidade });
  }

  return entries;
}

function normalizeEmpresaBase(value) {
  return normalizeText(value)
    .replace(/\bSOCIEDADE\b/g, ' ')
    .replace(/\bSOC\b/g, ' ')
    .replace(/\bUNIPESSOAL\b/g, ' ')
    .replace(/\bUNIP\b/g, ' ')
    .replace(/\bLDA\b/g, ' ')
    .replace(/\bLIMITADA\b/g, ' ')
    .replace(/\bACTIVIDADES\b/g, ' ATIVIDADES ')
    .replace(/\bMARITIMO\b/g, ' MARITIMO ')
    .replace(/\bTURISTICAS\b/g, ' TURISTICAS ')
    .replace(/\bIMPORTACAO\b/g, ' IMPORTACAO ')
    .replace(/\bEXPORTACAO\b/g, ' EXPORTACAO ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePersonBase(value) {
  return normalizeText(value)
    .replace(/\bDE\b|\bDA\b|\bDO\b|\bDOS\b|\bDAS\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isEmpresaLike(value) {
  return /\b(LDA|UNIP|UNIPESSOAL|SOCIEDADE|TURISMO|ATIVIDADES|ACTIVIDADES|IMPORTACAO|EXPORTACAO|LODGING)\b/i.test(value);
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}

function scoreCandidate(entryName, clienteNome, empresaLike) {
  const normalize = empresaLike ? normalizeEmpresaBase : normalizePersonBase;
  const source = normalize(entryName);
  const target = normalize(clienteNome);
  if (!source || !target) return null;

  const sourceTokens = source.split(' ').filter(Boolean);
  const targetTokens = target.split(' ').filter(Boolean);
  const overlap = sourceTokens.filter((token) => targetTokens.includes(token)).length;
  const distance = levenshtein(source, target);
  const coverage = overlap / Math.max(sourceTokens.length, 1);

  return {
    source,
    target,
    overlap,
    coverage,
    distance,
    score: coverage * 100 - distance,
  };
}

(async () => {
  const omtEntries = parseOmtEntries(path.join(process.cwd(), 'tmp_omt_moradas.txt'));
  const clientes = await prisma.cliente.findMany({
    select: { id: true, nome: true, morada: true, codigoPostal: true, localidade: true },
    orderBy: { nome: 'asc' },
  });

  const clientesByNormalizedName = new Map();
  for (const cliente of clientes) {
    const key = normalizeText(cliente.nome);
    const current = clientesByNormalizedName.get(key) || [];
    current.push(cliente);
    clientesByNormalizedName.set(key, current);
  }
  const clienteNameKeys = [...clientesByNormalizedName.keys()].sort((a, b) => b.length - a.length);

  const unmatched = [];
  for (const entry of omtEntries) {
    let effectiveEntry = entry;
    let matches = clientesByNormalizedName.get(normalizeText(entry.nome)) || [];

    if (matches.length !== 1) {
      const prefixMatch = findUniquePrefixClienteMatch(entry.payload, clienteNameKeys);
      if (prefixMatch) {
        const fallbackMatches = clientesByNormalizedName.get(prefixMatch.key) || [];
        if (fallbackMatches.length === 1) {
          const { codigoPostal, localidade } = extractPostalAndLocalidade(entry.postalLine);
          effectiveEntry = {
            ...entry,
            nome: fallbackMatches[0].nome,
            moradaLine: prefixMatch.moradaLine,
            morada: [prefixMatch.moradaLine, entry.postalLine].filter(Boolean).join(', ').replace(/\s+,/g, ',').trim(),
            codigoPostal,
            localidade,
          };
          matches = fallbackMatches;
        }
      }
    }

    if (matches.length !== 1) {
      unmatched.push(entry);
      continue;
    }

    const cliente = matches[0];
    const shouldFillAddress = !String(cliente.morada || '').trim();
    const shouldReplacePlaceholder = isPlaceholderMorada(cliente.morada);
    if (!shouldFillAddress && !shouldReplacePlaceholder) continue;
  }

  const clientsByEmpresaBase = new Map();
  const clientsByPersonBase = new Map();
  for (const cliente of clientes) {
    const empresaKey = normalizeEmpresaBase(cliente.nome);
    const personKey = normalizePersonBase(cliente.nome);
    if (!clientsByEmpresaBase.has(empresaKey)) clientsByEmpresaBase.set(empresaKey, []);
    if (!clientsByPersonBase.has(personKey)) clientsByPersonBase.set(personKey, []);
    clientsByEmpresaBase.get(empresaKey).push(cliente);
    clientsByPersonBase.get(personKey).push(cliente);
  }

  console.log(`Unmatched: ${unmatched.length}`);
  for (const entry of unmatched) {
    const empresaLike = isEmpresaLike(entry.nome);
    const baseKey = empresaLike ? normalizeEmpresaBase(entry.nome) : normalizePersonBase(entry.nome);
    const exactBaseMatches = empresaLike ? (clientsByEmpresaBase.get(baseKey) || []) : (clientsByPersonBase.get(baseKey) || []);
    const tokenCandidates = clientes.filter((cliente) => {
      const source = normalizeText(cliente.nome);
      return normalizeText(entry.nome)
        .split(' ')
        .filter((token) => token.length >= 5)
        .every((token) => source.includes(token) || token.includes(source));
    }).slice(0, 10);
    const fuzzyCandidates = clientes
      .map((cliente) => ({ cliente, metrics: scoreCandidate(entry.nome, cliente.nome, empresaLike) }))
      .filter((row) => row.metrics && (row.metrics.coverage >= 0.5 || row.metrics.distance <= 8))
      .sort((a, b) => b.metrics.score - a.metrics.score || a.metrics.distance - b.metrics.distance)
      .slice(0, 5);

    console.log(`\n### ${entry.nome} | ${entry.license}`);
    console.log(`morada: ${entry.morada}`);
    console.log(`baseKey: ${baseKey}`);

    if (exactBaseMatches.length) {
      console.log('base matches:');
      for (const match of exactBaseMatches) {
        console.log(`- ${match.id} | ${match.nome} | ${match.morada || ''}`);
      }
    } else {
      console.log('base matches: none');
    }

    if (tokenCandidates.length) {
      console.log('token candidates:');
      for (const match of tokenCandidates) {
        console.log(`- ${match.id} | ${match.nome} | ${match.morada || ''}`);
      }
    } else {
      console.log('token candidates: none');
    }

    if (fuzzyCandidates.length) {
      console.log('fuzzy candidates:');
      for (const { cliente, metrics } of fuzzyCandidates) {
        console.log(`- ${cliente.id} | ${cliente.nome} | overlap=${metrics.overlap} coverage=${metrics.coverage.toFixed(2)} distance=${metrics.distance} | ${cliente.morada || ''}`);
      }
    } else {
      console.log('fuzzy candidates: none');
    }
  }
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
