import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// iconv-lite is already present in the workspace dependency tree and gives a much cleaner
// recovery for the legacy OMT text extraction than manual mojibake heuristics alone.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const iconv = require('iconv-lite') as { encode(input: string, encoding: string): Buffer; decode(input: Buffer, encoding: string): string };

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.gestornavalpro_DATABASE_URL ??
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
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

const PLACEHOLDER_MORADA_PATTERNS = [
  /^$/i,
  /^morada nao indicada$/i,
  /^morada não indicada$/i,
  /^ilha\s+/i,
  /^n\/d$/i,
  /^nd$/i,
  /^desconhecida$/i,
];

type OmtEntry = {
  license: string;
  nome: string;
  payload: string;
  moradaLine: string;
  postalLine: string;
  morada: string;
  codigoPostal: string | null;
  localidade: string | null;
};

type PlannedUpdate = {
  clienteId: number;
  nome: string;
  fromMorada: string | null;
  toMorada: string;
  fromCodigoPostal: string | null;
  toCodigoPostal: string | null;
  fromLocalidade: string | null;
  toLocalidade: string | null;
  license: string;
  reason: 'fill-missing-address' | 'replace-placeholder-address';
};

function fixMojibake(value: string) {
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

function normalizeText(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function normalizeTextWithIndexMap(value?: string | null) {
  const source = String(value || '');
  let normalized = '';
  const indexMap: number[] = [];
  let lastWasSpace = false;

  for (let i = 0; i < source.length; i += 1) {
    const expanded = source[i]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

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

  const startTrim = normalized.match(/^\s+/)?.[0].length ?? 0;
  const endTrim = normalized.match(/\s+$/)?.[0].length ?? 0;

  return {
    normalized: normalized.trim(),
    indexMap: indexMap.slice(startTrim, endTrim ? indexMap.length - endTrim : undefined),
  };
}

function isPlaceholderMorada(value?: string | null) {
  const trimmed = String(value || '').trim();
  return PLACEHOLDER_MORADA_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isHeaderOrNoise(line: string) {
  const upper = normalizeText(line);
  if (!upper) return true;
  if (upper.startsWith('ATIVIDADE MARITIMO TURISTICA')) return true;
  if (upper.startsWith('LICENCA OPERADOR MARITIMO TURISTICO MORADA')) return true;
  if (upper.startsWith('DATA DA ATUALIZACAO')) return true;
  if (/^\d+\s*\/\s*\d+$/.test(line.trim())) return true;
  if (/^--\s*\d+\s+OF\s+\d+\s*--$/i.test(line.trim())) return true;
  return false;
}

function extractPostalAndLocalidade(line?: string | null) {
  const raw = String(line || '').trim();
  if (!raw) return { codigoPostal: null, localidade: null };

  const match = raw.match(/^(\d{4,5}-\d{3}|\d{4})\s*(.*)$/);
  if (!match) return { codigoPostal: null, localidade: raw || null };

  const [, codigoPostal, rest] = match;
  const localidade = rest.replace(/^[-,\s]+/, '').trim() || null;
  return { codigoPostal, localidade };
}

function findAddressStartIndex(payload: string) {
  let bestIndex = -1;

  for (const pattern of ADDRESS_START_PATTERNS) {
    const match = pattern.exec(payload);
    if (!match || typeof match.index !== 'number' || match.index <= 0) continue;
    if (bestIndex === -1 || match.index < bestIndex) {
      bestIndex = match.index;
    }
  }

  return bestIndex;
}

function splitNameAndAddress(payload: string) {
  const index = findAddressStartIndex(payload);

  if (index === -1) {
    return { nome: payload.trim(), moradaLine: '' };
  }

  return {
    nome: payload.slice(0, index).trim().replace(/[.,;:-]+$/, '').trim(),
    moradaLine: payload.slice(index).trim(),
  };
}

function findUniquePrefixClienteMatch(payload: string, candidateKeys: string[]) {
  const { normalized, indexMap } = normalizeTextWithIndexMap(payload);
  let bestKey: string | null = null;
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

  if (!bestKey || bestLength <= 0 || !indexMap.length) {
    return null;
  }

  const splitMapIndex = Math.min(bestLength - 1, indexMap.length - 1);
  const splitIndex = indexMap[splitMapIndex] + 1;
  const moradaLine = payload.slice(splitIndex).replace(/^[\s,.;:-]+/, '').trim();

  if (!moradaLine) {
    return null;
  }

  return { key: bestKey, moradaLine };
}

function parseOmtEntries(filePath: string) {
  const rawText = fs.readFileSync(filePath, 'utf8');
  const text = fixMojibake(rawText);
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => !isHeaderOrNoise(line));

  const entries: OmtEntry[] = [];

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

    entries.push({
      license,
      nome,
      payload,
      moradaLine,
      postalLine: nextLine,
      morada,
      codigoPostal,
      localidade,
    });
  }

  return entries;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const omtPath = path.join(process.cwd(), 'tmp_omt_moradas.txt');

  if (!fs.existsSync(omtPath)) {
    console.error('tmp_omt_moradas.txt não encontrado.');
    process.exit(1);
  }

  console.log(`\n🧭 BACKFILL CLIENTES OMT → MORADAS\n`);
  console.log(`Modo: ${apply ? 'APLICAÇÃO' : 'DRY-RUN'}\n`);

  const omtEntries = parseOmtEntries(omtPath);
  const omtByName = new Map(omtEntries.map((entry) => [normalizeText(entry.nome), entry]));

  const clientes = await prisma.cliente.findMany({
    select: {
      id: true,
      nome: true,
      morada: true,
      codigoPostal: true,
      localidade: true,
      tipoCliente: true,
    },
    orderBy: { nome: 'asc' },
  });

  const plannedUpdates: PlannedUpdate[] = [];
  const unmatchedOmt: OmtEntry[] = [];

  const clientesByNormalizedName = new Map<string, typeof clientes>();
  for (const cliente of clientes) {
    const key = normalizeText(cliente.nome);
    const current = clientesByNormalizedName.get(key) || [];
    current.push(cliente);
    clientesByNormalizedName.set(key, current);
  }

  const clienteNameKeys = [...clientesByNormalizedName.keys()].sort((a, b) => b.length - a.length);

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
            morada: [prefixMatch.moradaLine, entry.postalLine]
              .filter(Boolean)
              .join(', ')
              .replace(/\s+,/g, ',')
              .trim(),
            codigoPostal,
            localidade,
          };
          matches = fallbackMatches;
        }
      }
    }

    if (matches.length !== 1) {
      unmatchedOmt.push(entry);
      continue;
    }

    const cliente = matches[0];
    const shouldFillAddress = !String(cliente.morada || '').trim();
    const shouldReplacePlaceholder = isPlaceholderMorada(cliente.morada);
    if (!shouldFillAddress && !shouldReplacePlaceholder) continue;

    plannedUpdates.push({
      clienteId: cliente.id,
      nome: cliente.nome,
      fromMorada: cliente.morada,
      toMorada: effectiveEntry.morada,
      fromCodigoPostal: cliente.codigoPostal,
      toCodigoPostal: cliente.codigoPostal || effectiveEntry.codigoPostal,
      fromLocalidade: cliente.localidade,
      toLocalidade: cliente.localidade || effectiveEntry.localidade,
      license: effectiveEntry.license,
      reason: shouldFillAddress ? 'fill-missing-address' : 'replace-placeholder-address',
    });
  }

  const summaryByReason = plannedUpdates.reduce<Record<string, number>>((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1;
    return acc;
  }, {});

  if (!apply) {
    console.log(`Entradas OMT lidas: ${omtEntries.length}`);
    console.log(`Atualizações planeadas: ${plannedUpdates.length}`);
    console.log(`Entradas OMT sem match único em Cliente: ${unmatchedOmt.length}`);
    console.log('Resumo por motivo:', summaryByReason);
    console.log('\nAmostra de atualizações:');
    for (const item of plannedUpdates.slice(0, 20)) {
      console.log(`- ${item.nome} | licença ${item.license} | "${item.fromMorada || ''}" → "${item.toMorada}" [${item.reason}]`);
    }
    if (plannedUpdates.length > 20) {
      console.log(`... e mais ${plannedUpdates.length - 20} atualizações`);
    }
    console.log('\nAmostra sem match único:');
    for (const item of unmatchedOmt.slice(0, 20)) {
      console.log(`- ${item.nome} | licença ${item.license} | ${item.morada}`);
    }
    if (unmatchedOmt.length > 20) {
      console.log(`... e mais ${unmatchedOmt.length - 20} entradas sem match único`);
    }
    console.log('\n⚠️  DRY-RUN — nenhum dado foi alterado.');
    console.log('   Para aplicar, corre com --apply');
    console.log('');
    return;
  }

  let updated = 0;
  for (const item of plannedUpdates) {
    await prisma.cliente.update({
      where: { id: item.clienteId },
      data: {
        morada: item.toMorada,
        codigoPostal: item.toCodigoPostal,
        localidade: item.toLocalidade,
      },
    });
    updated += 1;
  }

  console.log(`Entradas OMT lidas: ${omtEntries.length}`);
  console.log(`Atualizações aplicadas: ${updated}`);
  console.log(`Entradas OMT sem match único em Cliente: ${unmatchedOmt.length}`);
  console.log('Resumo por motivo:', summaryByReason);
  console.log('');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
