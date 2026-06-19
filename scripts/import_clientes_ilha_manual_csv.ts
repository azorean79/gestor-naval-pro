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

type Ilha =
  | 'Santa Maria'
  | 'São Miguel'
  | 'Terceira'
  | 'Graciosa'
  | 'São Jorge'
  | 'Pico'
  | 'Faial'
  | 'Flores'
  | 'Corvo';

const validIlhas: Ilha[] = [
  'Santa Maria',
  'São Miguel',
  'Terceira',
  'Graciosa',
  'São Jorge',
  'Pico',
  'Faial',
  'Flores',
  'Corvo',
];

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function asValidIlha(value: string | null | undefined): Ilha | null {
  const n = normalize(value);
  if (!n) return null;
  for (const i of validIlhas) {
    if (normalize(i) === n) return i;
  }
  return null;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ';' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }

    cur += ch;
  }
  out.push(cur);
  return out;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const csvPath = path.join(process.cwd(), 'tmp_clientes_sem_ilha_com_navios_para_preencher.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(csvPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    console.log(JSON.stringify({ message: 'CSV has no data rows.' }, null, 2));
    return;
  }

  const header = parseCsvLine(lines[0]);
  const idxClienteId = header.indexOf('clienteId');
  const idxClienteNome = header.indexOf('clienteNome');
  const idxIlhaManual = header.indexOf('ilhaManual');

  if (idxClienteId === -1 || idxClienteNome === -1 || idxIlhaManual === -1) {
    console.error('CSV header missing required columns: clienteId, clienteNome, ilhaManual');
    process.exit(1);
  }

  const byCliente = new Map<number, { nome: string; ilhas: Set<Ilha>; rows: number[] }>();
  const invalidRows: Array<{ line: number; clienteId: number; clienteNome: string; ilhaManual: string }> = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const clienteId = Number(cols[idxClienteId] ?? '');
    const clienteNome = (cols[idxClienteNome] ?? '').trim();
    const ilhaRaw = (cols[idxIlhaManual] ?? '').trim();

    if (!Number.isFinite(clienteId) || clienteId <= 0) continue;
    if (!ilhaRaw) continue;

    const ilha = asValidIlha(ilhaRaw);
    if (!ilha) {
      invalidRows.push({ line: i + 1, clienteId, clienteNome, ilhaManual: ilhaRaw });
      continue;
    }

    if (!byCliente.has(clienteId)) {
      byCliente.set(clienteId, { nome: clienteNome, ilhas: new Set<Ilha>(), rows: [] });
    }

    const bucket = byCliente.get(clienteId)!;
    bucket.ilhas.add(ilha);
    bucket.rows.push(i + 1);
  }

  const conflicts: Array<{ clienteId: number; nome: string; ilhas: Ilha[]; rows: number[] }> = [];
  const candidates: Array<{ clienteId: number; nome: string; ilha: Ilha; rows: number[] }> = [];

  for (const [clienteId, data] of byCliente.entries()) {
    const ilhas = Array.from(data.ilhas);
    if (ilhas.length === 1) {
      candidates.push({ clienteId, nome: data.nome, ilha: ilhas[0], rows: data.rows });
    } else if (ilhas.length > 1) {
      conflicts.push({ clienteId, nome: data.nome, ilhas, rows: data.rows });
    }
  }

  let updated = 0;
  const applied: Array<{ clienteId: number; nome: string; ilha: Ilha }> = [];

  if (apply) {
    for (const c of candidates) {
      await prisma.cliente.update({
        where: { id: c.clienteId },
        data: { ilha: c.ilha },
      });
      updated += 1;
      applied.push({ clienteId: c.clienteId, nome: c.nome, ilha: c.ilha });
    }
  }

  const semIlhaDepois = await prisma.cliente.count({ where: { OR: [{ ilha: null }, { ilha: '' }] } });

  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        csvFile: csvPath,
        candidates: candidates.length,
        conflicts: conflicts.length,
        invalidRows: invalidRows.length,
        updated,
        semIlhaDepois,
        candidatesPreview: candidates.slice(0, 20),
        conflictsPreview: conflicts.slice(0, 20),
        invalidRowsPreview: invalidRows.slice(0, 20),
        appliedPreview: applied.slice(0, 20),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
