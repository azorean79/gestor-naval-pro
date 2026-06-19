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

function normalizeText(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

async function main() {
  const certificados2025 = await prisma.certificadoExtraido.count({ where: { sourceYear: 2025 } });
  const totalClientes = await prisma.cliente.count();

  const clientes = await prisma.cliente.findMany({ select: { id: true, nome: true } });
  const bucket = new Map<string, { ids: number[]; nomes: string[] }>();

  for (const c of clientes) {
    const k = normalizeText(c.nome);
    const entry = bucket.get(k) ?? { ids: [], nomes: [] };
    entry.ids.push(c.id);
    entry.nomes.push(c.nome);
    bucket.set(k, entry);
  }

  const duplicatedNormalized = [...bucket.entries()]
    .filter(([, v]) => v.ids.length > 1)
    .map(([norm, v]) => ({ norm, count: v.ids.length, nomes: v.nomes }));

  console.log(`Certificados (sourceYear=2025): ${certificados2025}`);
  console.log(`Total clientes: ${totalClientes}`);
  console.log(`Duplicados por nome normalizado: ${duplicatedNormalized.length}`);
  if (duplicatedNormalized.length) {
    console.log('Exemplos de duplicados (até 10):');
    for (const d of duplicatedNormalized.slice(0, 10)) {
      console.log(`- ${d.norm} -> ${d.nomes.join(' | ')}`);
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
