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

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/├ü/g, 'Á'],
  [/├ü/g, 'á'],
  [/├â/g, 'Ã'],
  [/├â/g, 'ã'],
  [/├ç/g, 'Ç'],
  [/├ç/g, 'ç'],
  [/├ë/g, 'É'],
  [/├ë/g, 'é'],
  [/├¡/g, 'á'],
  [/├®/g, 'í'],
  [/├│/g, 'ó'],
  [/├║/g, 'ú'],
  [/├ /g, 'à'],
  [/Â/g, ''],
  [/\uFFFD/g, ''],
];

function fixMojibake(text: string): string {
  let out = text;
  for (const [from, to] of REPLACEMENTS) {
    out = out.replace(from, to);
  }

  // Correções específicas observadas nos nomes importados
  out = out.replace(/ANDRE\b/g, 'ANDRÉ');
  out = out.replace(/JOSÉ\b/g, 'JOSÉ');

  // Compactar espaços
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

function looksBroken(text: string): boolean {
  return /├|�|Â/.test(text);
}

async function main() {
  const clientes = await prisma.cliente.findMany({ select: { id: true, nome: true } });

  let updated = 0;
  const changes: Array<{ id: number; before: string; after: string }> = [];

  for (const c of clientes) {
    if (!looksBroken(c.nome)) continue;
    const fixed = fixMojibake(c.nome);
    if (!fixed || fixed === c.nome) continue;

    await prisma.cliente.update({ where: { id: c.id }, data: { nome: fixed } });
    updated += 1;
    changes.push({ id: c.id, before: c.nome, after: fixed });
  }

  console.log(`Clientes com acentuação corrigida: ${updated}`);
  for (const ch of changes) {
    console.log(`- [${ch.id}] ${ch.before} => ${ch.after}`);
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
