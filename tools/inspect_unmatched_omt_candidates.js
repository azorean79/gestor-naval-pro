const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

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

const names = [
  '2 Fish Boat Works, Lda',
  'André Filipe da Silva Tavares',
  'Azores4Fun - Turismo e Aventura Unipessoal, Lda',
  'Belong Nature, Unip. Lda',
  'Bernardete Lurdes Soares da Rosa',
  'Fábio Thomaz Vieira',
  'Gonçalo Miguel Bettencourt Azevedo',
  'Naturfactor, Lda',
  'Season Challenge - Desenvolvimento Local e Atividades Marítimo-Turísticas Lda',
];

function tokenize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

async function main() {
  for (const name of names) {
    const tokens = unique(tokenize(name)).filter((token) => token.length >= 4).slice(0, 6);
    const rows = await prisma.cliente.findMany({
      where: tokens.length
        ? {
            OR: tokens.map((token) => ({
              nome: { contains: token, mode: 'insensitive' },
            })),
          }
        : undefined,
      select: {
        id: true,
        nome: true,
        morada: true,
        tipoCliente: true,
      },
      take: 15,
      orderBy: { nome: 'asc' },
    });

    console.log(`\n### ${name}`);
    if (!rows.length) {
      console.log('- sem candidatos');
      continue;
    }

    for (const row of rows) {
      console.log(`- ${row.id} | ${row.nome} | ${row.morada || ''} | ${row.tipoCliente || ''}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
