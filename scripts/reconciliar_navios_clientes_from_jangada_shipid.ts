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
  console.error('No database connection string found.');
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;
const prisma = new PrismaClient();

const APPLY = (process.env.APPLY ?? '').toLowerCase() === 'true';
const REPORT_PATH = path.join(process.cwd(), 'tmp_reconciliacao_navios_clientes_jangada_shipid.json');

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeCompact(value: string | null | undefined): string {
  return normalizeText(value).replace(/\s+/g, '');
}

function isBadOwner(value: string | null | undefined): boolean {
  const n = normalizeText(value);
  if (!n) return true;
  if (['N D', 'N A', 'NA', 'ND', 'DESCONHECIDO', 'DESCONHECIDA'].includes(n)) return true;
  if (n.startsWith('CLIENTE ')) return true;
  if (n.includes('OREY')) return true;
  if (n.includes('SERVICE STATION')) return true;
  if (n.includes('CERTIFICADO') || n.includes('CERTIFICATE')) return true;
  return false;
}

function isGenericClienteName(name: string | null | undefined): boolean {
  return normalizeText(name).startsWith('CLIENTE ');
}

async function main() {
  const navios = await prisma.navio.findMany({
    select: {
      id: true,
      nome: true,
      clienteId: true,
      cliente: { select: { nome: true } },
    },
  });

  const clientes = await prisma.cliente.findMany({
    select: { id: true, nome: true },
  });

  const clienteByNorm = new Map(clientes.map((c) => [normalizeCompact(c.nome), c.id]));

  async function getOrCreateCliente(ownerDisplay: string): Promise<number | null> {
    const key = normalizeCompact(ownerDisplay);
    if (!key) return null;

    const found = clienteByNorm.get(key);
    if (found) return found;

    if (!APPLY) {
      const fake = -(clienteByNorm.size + 1);
      clienteByNorm.set(key, fake);
      return fake;
    }

    const created = await prisma.cliente.create({ data: { nome: ownerDisplay }, select: { id: true } });
    clienteByNorm.set(key, created.id);
    return created.id;
  }

  const jangadas = await prisma.jangada.findMany({
    where: { shipId: { not: null } },
    select: { shipId: true, owner: true },
  });

  const shipOwnerFreq = new Map<number, Map<string, { count: number; display: string }>>();

  for (const j of jangadas) {
    const shipId = j.shipId;
    if (!shipId) continue;
    if (isBadOwner(j.owner)) continue;

    const ownerNorm = normalizeCompact(j.owner);
    if (!ownerNorm) continue;

    const bucket = shipOwnerFreq.get(shipId) ?? new Map<string, { count: number; display: string }>();
    const cur = bucket.get(ownerNorm);
    if (!cur) {
      bucket.set(ownerNorm, { count: 1, display: j.owner });
    } else {
      cur.count += 1;
      if (j.owner.length > cur.display.length) cur.display = j.owner;
      bucket.set(ownerNorm, cur);
    }
    shipOwnerFreq.set(shipId, bucket);
  }

  const beforeSemCliente = await prisma.navio.count({ where: { clienteId: null } });

  let shipsWithOwnerEvidence = 0;
  let updated = 0;
  let already = 0;
  let skippedSpecific = 0;
  let createdClientes = 0;

  for (const n of navios) {
    const targetable = !n.clienteId || isGenericClienteName(n.cliente?.nome);
    if (!targetable) continue;

    const bucket = shipOwnerFreq.get(n.id);
    if (!bucket || !bucket.size) continue;

    shipsWithOwnerEvidence += 1;

    let best: { count: number; display: string } | null = null;
    for (const v of bucket.values()) {
      if (!best || v.count > best.count || (v.count === best.count && v.display.length > best.display.length)) {
        best = v;
      }
    }
    if (!best) continue;

    const clienteId = await getOrCreateCliente(best.display);
    if (!clienteId) continue;
    if (clienteId < 0) createdClientes += 1;

    if (n.clienteId === clienteId) {
      already += 1;
      continue;
    }

    if (n.clienteId && n.cliente?.nome && !isGenericClienteName(n.cliente.nome)) {
      skippedSpecific += 1;
      continue;
    }

    if (APPLY && clienteId > 0) {
      await prisma.navio.update({ where: { id: n.id }, data: { clienteId } });
    }

    updated += 1;
  }

  if (APPLY) {
    const clientesAfter = await prisma.cliente.count();
    createdClientes = Math.max(0, clientesAfter - clientes.length);
  }

  const afterSemCliente = await prisma.navio.count({ where: { clienteId: null } });

  const genericRows = await prisma.navio.findMany({
    where: { clienteId: { not: null } },
    select: { cliente: { select: { nome: true } } },
  });

  let afterGeneric = 0;
  for (const row of genericRows) {
    if (isGenericClienteName(row.cliente?.nome)) afterGeneric += 1;
  }

  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    timestamp: new Date().toISOString(),
    totals: {
      jangadasComShipId: jangadas.length,
      naviosComEvidenciaOwner: shipsWithOwnerEvidence,
      updated,
      already,
      skippedSpecific,
      createdClientes,
      beforeSemCliente,
      afterSemCliente,
      afterGeneric,
    },
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Modo: ${report.mode}`);
  console.log(`Jangadas com shipId: ${jangadas.length}`);
  console.log(`Navios com evidência de owner: ${shipsWithOwnerEvidence}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Já corretos: ${already}`);
  console.log(`Ignorados (cliente específico): ${skippedSpecific}`);
  console.log(`Clientes criados: ${createdClientes}`);
  console.log(`Sem cliente (antes/depois): ${beforeSemCliente} -> ${afterSemCliente}`);
  console.log(`Com cliente genérico após execução: ${afterGeneric}`);
  console.log(`Relatório: ${REPORT_PATH}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
