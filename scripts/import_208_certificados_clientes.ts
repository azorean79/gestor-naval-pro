import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.gestornavalpro_DATABASE_URL ??
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env/.env.local');
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;
const prisma = new PrismaClient();

type CertRow = {
  file: string;
  raftSerial?: string;
  shipName?: string;
  emergencyPackType?: string;
  validitiesCount?: number;
};

type CertRowsFile = {
  totalRows?: number;
  rows?: CertRow[];
};

type JsonOwnerRow = {
  arquivo?: string;
  linha?: number;
  dados?: unknown[];
};

function safeString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.result === 'string') return obj.result.trim();
    if (typeof obj.text === 'string') return obj.text.trim();
    if (Array.isArray(obj.richText)) {
      const txt = obj.richText
        .map((x) => (x && typeof x === 'object' && 'text' in x ? String((x as { text?: unknown }).text ?? '') : ''))
        .join('')
        .trim();
      if (txt) return txt;
    }
  }
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeText(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function parseShipFromFile(fileName: string): string {
  return fileName.replace(/\.xlsx$/i, '').replace(/^AZ\d{2}-\d+\s*/i, '').trim();
}

function isOwnerLabel(text: string): boolean {
  const n = normalizeText(text);
  return n === 'SHIP OWNER' || n === 'ARMADOR' || n.startsWith('SHIP OWNER ') || n.startsWith('ARMADOR ');
}

function isBadOwner(text: string): boolean {
  const n = normalizeText(text);
  if (!n) return true;
  if (n.length < 4) return true;
  if (isOwnerLabel(text)) return true;
  if (n.includes('SIGNATURE')) return true;
  if (n.includes('OREY GROUP') || n.includes('OREY FINANCIAL')) return true;
  return false;
}

function extractOwnerFromDados(dados: unknown[]): string | null {
  const cells = dados.map((d) => safeString(d));
  let labelIdx = -1;

  for (let i = 0; i < cells.length; i++) {
    if (isOwnerLabel(cells[i])) {
      labelIdx = i;
      break;
    }
  }

  if (labelIdx < 0) return null;

  const candidates: string[] = [];
  for (let i = labelIdx + 1; i < cells.length; i++) {
    const c = cells[i];
    if (!c || isBadOwner(c)) continue;
    candidates.push(c);
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] ?? null;
}

function readJsonWithEncodingFallback(filePath: string): unknown {
  const rawBuffer = fs.readFileSync(filePath);
  let rawUtf8 = rawBuffer.toString('utf8');
  if (rawUtf8.charCodeAt(0) === 0xfeff) rawUtf8 = rawUtf8.slice(1);

  try {
    return JSON.parse(rawUtf8);
  } catch {
    const rawUtf16 = rawBuffer.toString('utf16le').replace(/^\uFEFF/, '');
    return JSON.parse(rawUtf16);
  }
}

async function main() {
  const certRowsPath = path.join(process.cwd(), 'scripts', 'jangadas_navios_associadas_2025.json');
  const ownersRawPath = path.join(process.cwd(), 'jangadas_certificados_2025.json');
  const reportPath = path.join(process.cwd(), 'scripts', 'import_208_certificados_clientes_report.json');

  const certRowsJson = readJsonWithEncodingFallback(certRowsPath) as CertRowsFile;
  const certRows = Array.isArray(certRowsJson.rows) ? certRowsJson.rows : [];

  const ownerRows = readJsonWithEncodingFallback(ownersRawPath) as JsonOwnerRow[];
  const ownerByFileNorm = new Map<string, string>();

  for (const row of ownerRows) {
    const file = safeString(row.arquivo);
    const dados = Array.isArray(row.dados) ? row.dados : [];
    if (!file || !dados.length) continue;

    const owner = extractOwnerFromDados(dados);
    if (!owner || isBadOwner(owner)) continue;

    const fileNorm = normalizeText(file);
    if (!ownerByFileNorm.has(fileNorm)) {
      ownerByFileNorm.set(fileNorm, owner);
    }
  }

  const existingNavios = await prisma.navio.findMany({ select: { id: true, nome: true, clienteId: true } });
  const navioByNorm = new Map(existingNavios.map((n) => [normalizeText(n.nome), n]));

  const existingClientes = await prisma.cliente.findMany({ select: { id: true, nome: true } });
  const clienteByNorm = new Map(existingClientes.map((c) => [normalizeText(c.nome), c]));

  let certificadosUpserted = 0;
  let naviosCreated = 0;
  let clientesCreated = 0;
  let clientesMatched = 0;
  let navioClienteLinksUpdated = 0;

  for (const row of certRows) {
    const file = safeString(row.file);
    if (!file) continue;

    const fileNorm = normalizeText(file);
    const ownerName = ownerByFileNorm.get(fileNorm);
    const shipName = safeString(row.shipName) || parseShipFromFile(file) || 'N/D';
    const serial = safeString(row.raftSerial) || null;

    let clienteId: number | null = null;
    if (ownerName) {
      const ownerNorm = normalizeText(ownerName);
      const found = clienteByNorm.get(ownerNorm);
      if (found) {
        clienteId = found.id;
        clientesMatched += 1;
      } else {
        const createdCliente = await prisma.cliente.create({ data: { nome: ownerName }, select: { id: true, nome: true } });
        clienteByNorm.set(ownerNorm, createdCliente);
        clienteId = createdCliente.id;
        clientesCreated += 1;
      }
    }

    const shipNorm = normalizeText(shipName);
    let navio = navioByNorm.get(shipNorm) ?? null;
    if (!navio) {
      const createdNavio = await prisma.navio.create({
        data: {
          nome: shipName,
          matricula: 'N/D',
          ilha: 'N/D',
          tipoPesca: 'N/D',
          clienteId: clienteId ?? null,
        },
        select: { id: true, nome: true, clienteId: true },
      });
      navioByNorm.set(shipNorm, createdNavio);
      navio = createdNavio;
      naviosCreated += 1;
    } else if (clienteId && navio.clienteId !== clienteId) {
      await prisma.navio.update({ where: { id: navio.id }, data: { clienteId } });
      navio = { ...navio, clienteId };
      navioByNorm.set(shipNorm, navio);
      navioClienteLinksUpdated += 1;
    }

    const hasQuadro = Boolean(safeString(row.emergencyPackType));
    const validitiesCount = typeof row.validitiesCount === 'number' ? row.validitiesCount : 0;

    await prisma.certificadoExtraido.upsert({
      where: { fileName: file },
      create: {
        fileName: file,
        sourceYear: 2025,
        certificadoNumero: file.replace(/\.xlsx$/i, '').split(' ')[0] || null,
        raftSerial: serial,
        shipName,
        emergencyPackType: safeString(row.emergencyPackType) || null,
        hasQuadro,
        validitiesCount,
      },
      update: {
        sourceYear: 2025,
        certificadoNumero: file.replace(/\.xlsx$/i, '').split(' ')[0] || null,
        raftSerial: serial,
        shipName,
        emergencyPackType: safeString(row.emergencyPackType) || null,
        hasQuadro,
        validitiesCount,
      },
    });

    certificadosUpserted += 1;
  }

  const report = {
    timestamp: new Date().toISOString(),
    sourceCertRows: path.relative(process.cwd(), certRowsPath),
    sourceOwners: path.relative(process.cwd(), ownersRawPath),
    certRowsTotal: certRows.length,
    ownerFilesMapped: ownerByFileNorm.size,
    certificadosUpserted,
    naviosCreated,
    clientesCreated,
    clientesMatched,
    navioClienteLinksUpdated,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Importação dos 208 certificados + clientes concluída.');
  console.log(`Certificados processados: ${certRows.length}`);
  console.log(`Certificados upserted: ${certificadosUpserted}`);
  console.log(`Owners mapeados por ficheiro: ${ownerByFileNorm.size}`);
  console.log(`Clientes criados: ${clientesCreated} | clientes já existentes (matches): ${clientesMatched}`);
  console.log(`Navios criados: ${naviosCreated} | ligações navio->cliente atualizadas: ${navioClienteLinksUpdated}`);
  console.log(`Relatório: ${path.relative(process.cwd(), reportPath)}`);
}

main()
  .catch((error: unknown) => {
    console.error('Erro na importação de 208 certificados/clientes:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
