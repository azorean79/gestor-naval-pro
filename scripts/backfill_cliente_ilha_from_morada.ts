import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

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

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

const ilhaByPostalPrefix: Record<string, Ilha> = {
  '958': 'Santa Maria',
  '950': 'São Miguel',
  '956': 'São Miguel',
  '960': 'São Miguel',
  '962': 'São Miguel',
  '963': 'São Miguel',
  '965': 'São Miguel',
  '968': 'São Miguel',
  '970': 'Terceira',
  '976': 'Terceira',
  '988': 'Graciosa',
  '980': 'São Jorge',
  '985': 'São Jorge',
  '990': 'Faial',
  '993': 'Pico',
  '994': 'Pico',
  '995': 'Pico',
  '996': 'Flores',
  '997': 'Flores',
  '998': 'Corvo',
};

const directHints: Array<{ ilha: Ilha; patterns: string[] }> = [
  { ilha: 'Santa Maria', patterns: ['SANTA MARIA', 'VILA DO PORTO'] },
  { ilha: 'São Miguel', patterns: ['SAO MIGUEL', 'PONTA DELGADA', 'RIBEIRA GRANDE', 'LAGOA', 'VILA FRANCA DO CAMPO', 'NORDESTE', 'POVOACAO'] },
  { ilha: 'Terceira', patterns: ['TERCEIRA', 'ANGRA DO HEROISMO', 'PRAIA DA VITORIA'] },
  { ilha: 'Graciosa', patterns: ['GRACIOSA', 'SANTA CRUZ DA GRACIOSA', 'SAO MATEUS DA GRACIOSA'] },
  { ilha: 'São Jorge', patterns: ['SAO JORGE', 'VELAS', 'CALHETA', 'URZELINA'] },
  { ilha: 'Pico', patterns: ['PICO', 'MADALENA', 'LAJES DO PICO', 'SAO ROQUE DO PICO'] },
  { ilha: 'Faial', patterns: ['FAIAL', 'HORTA', 'PRAIA DO ALMOXARIFE', 'CASTELO BRANCO'] },
  { ilha: 'Flores', patterns: ['FLORES', 'SANTA CRUZ DAS FLORES', 'LAJES DAS FLORES'] },
  { ilha: 'Corvo', patterns: ['CORVO'] },
];

function inferIlhaFromKeywords(morada: string | null | undefined): Ilha | null {
  const m = normalize(morada);
  if (!m) return null;

  const matches: Ilha[] = [];
  for (const item of directHints) {
    if (item.patterns.some((p) => m.includes(p))) {
      matches.push(item.ilha);
    }
  }

  const unique = Array.from(new Set(matches));
  if (unique.length === 1) return unique[0];
  return null;
}

function inferIlhaFromPostalCode(morada: string | null | undefined): Ilha | null {
  const raw = morada ?? '';
  if (!raw.trim()) return null;

  // Código postal PT típico: 4 dígitos + hífen + 3 dígitos (ex: 9680-315)
  const regex = /\b(\d{4})-\d{3}\b/g;
  const hits = new Set<Ilha>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const first3 = match[1].slice(0, 3);
    const ilha = ilhaByPostalPrefix[first3];
    if (ilha) hits.add(ilha);
  }

  if (hits.size === 1) return Array.from(hits)[0];
  return null;
}

function inferIlhaFromMorada(morada: string | null | undefined): { ilha: Ilha | null; source: 'keyword' | 'postal' | null } {
  const byKeyword = inferIlhaFromKeywords(morada);
  const byPostal = inferIlhaFromPostalCode(morada);

  if (byKeyword && byPostal) {
    if (byKeyword === byPostal) return { ilha: byKeyword, source: 'keyword' };
    return { ilha: null, source: null };
  }
  if (byKeyword) return { ilha: byKeyword, source: 'keyword' };
  if (byPostal) return { ilha: byPostal, source: 'postal' };
  return { ilha: null, source: null };
}

async function main() {
  const clientes = await prisma.cliente.findMany({
    where: { OR: [{ ilha: null }, { ilha: '' }] },
    select: { id: true, nome: true, morada: true, ilha: true },
    orderBy: { id: 'asc' },
  });

  let updated = 0;
  const detalhes: Array<{ id: number; nome: string; ilhaNova: Ilha; source: 'keyword' | 'postal'; morada: string | null }> = [];

  for (const c of clientes) {
    const { ilha: ilhaInferida, source } = inferIlhaFromMorada(c.morada);
    if (!ilhaInferida) continue;
    if (!source) continue;

    await prisma.cliente.update({
      where: { id: c.id },
      data: { ilha: ilhaInferida },
    });

    updated += 1;
    detalhes.push({ id: c.id, nome: c.nome, ilhaNova: ilhaInferida, source, morada: c.morada });
  }

  const semIlhaDepois = await prisma.cliente.count({ where: { OR: [{ ilha: null }, { ilha: '' }] } });

  console.log(
    JSON.stringify(
      {
        clientesSemIlhaAntes: clientes.length,
        updated,
        clientesSemIlhaDepois: semIlhaDepois,
        detalhes,
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
