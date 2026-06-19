import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import {
  naviosSantaMaria,
  naviosGraciosa,
  naviosPico,
  naviosSaoJorge,
  naviosFaial,
  naviosTerceira,
  naviosFlores,
  naviosCorvo,
  naviosSaoMiguel,
} from '../src/database/navios_sao_miguel';

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

type SeedShip = { nome: string; matricula: string };

function normalizeText(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function allSeedShips(): Array<{ ilha: string; ship: SeedShip }> {
  return [
    ...naviosSantaMaria.map((ship) => ({ ilha: 'Santa Maria', ship })),
    ...naviosGraciosa.map((ship) => ({ ilha: 'Graciosa', ship })),
    ...naviosPico.map((ship) => ({ ilha: 'Pico', ship })),
    ...naviosSaoJorge.map((ship) => ({ ilha: 'São Jorge', ship })),
    ...naviosFaial.map((ship) => ({ ilha: 'Faial', ship })),
    ...naviosTerceira.map((ship) => ({ ilha: 'Terceira', ship })),
    ...naviosFlores.map((ship) => ({ ilha: 'Flores', ship })),
    ...naviosCorvo.map((ship) => ({ ilha: 'Corvo', ship })),
    ...naviosSaoMiguel.map((ship) => ({ ilha: 'São Miguel', ship })),
  ];
}

function inferTipoPescaFromMatricula(matricula: string | undefined): string {
  const m = (matricula ?? '').trim().toUpperCase();
  if (m.endsWith('-L') || m.endsWith(' L') || m.endsWith('L')) {
    return 'Pesca Local';
  }
  if (m.endsWith('-C') || m.endsWith(' C') || m.endsWith('C')) {
    return 'Pesca Costeira';
  }
  return 'Marítimo Turística';
}

async function getOrCreateClienteByIlha(ilha: string): Promise<number> {
  const existing = await prisma.cliente.findFirst({
    where: {
      ilha,
    },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await prisma.cliente.create({
    data: {
      nome: `Cliente ${ilha}`,
      ilha,
      morada: `Ilha ${ilha}`,
    },
    select: { id: true },
  });

  return created.id;
}

async function main() {
  const seedShips = allSeedShips();

  const navios = await prisma.navio.findMany({
    select: { id: true, nome: true, matricula: true, ilha: true, clienteId: true },
  });

  const navioByNome = new Map(navios.map((n) => [normalizeText(n.nome), n]));
  const navioByMatricula = new Map(navios.map((n) => [normalizeText(n.matricula), n]));

  const clienteIdByIlha = new Map<string, number>();
  let matched = 0;
  let updated = 0;
  let created = 0;
  let alreadyCorrect = 0;
  let nomeCanonicoAtualizado = 0;

  for (const item of seedShips) {
    const nomeNorm = normalizeText(item.ship.nome);
    const matriculaNorm = normalizeText(item.ship.matricula);
    const navio = navioByMatricula.get(matriculaNorm) ?? navioByNome.get(nomeNorm);

    const nomeCanonico = item.ship.nome;
    const newMatricula = item.ship.matricula || navio?.matricula || 'N/D';
    const tipoPesca = inferTipoPescaFromMatricula(newMatricula);

    let clienteId = clienteIdByIlha.get(item.ilha);
    if (!clienteId) {
      clienteId = await getOrCreateClienteByIlha(item.ilha);
      clienteIdByIlha.set(item.ilha, clienteId);
    }

    if (!navio) {
      await prisma.navio.create({
        data: {
          nome: nomeCanonico,
          matricula: newMatricula,
          ilha: item.ilha,
          tipoPesca,
          clienteId,
        },
      });

      created += 1;
      matched += 1;
      continue;
    }

    matched += 1;

    const needsUpdate =
      navio.clienteId !== clienteId ||
      navio.ilha !== item.ilha ||
      navio.matricula !== newMatricula ||
      navio.nome !== nomeCanonico;

    if (!needsUpdate) {
      alreadyCorrect += 1;
      continue;
    }

    await prisma.navio.update({
      where: { id: navio.id },
      data: {
        nome: nomeCanonico,
        clienteId,
        ilha: item.ilha,
        matricula: newMatricula,
        tipoPesca,
      },
    });

    if (navio.nome !== nomeCanonico) {
      nomeCanonicoAtualizado += 1;
    }

    updated += 1;
  }

  const withClient = await prisma.navio.count({ where: { clienteId: { not: null } } });
  const withoutClient = await prisma.navio.count({ where: { clienteId: null } });

  console.log('Associação navio->cliente por seed de ilhas concluída.');
  console.log(`Seed ships: ${seedShips.length}`);
  console.log(`Navios encontrados no banco: ${matched}`);
  console.log(`Criados agora: ${created}`);
  console.log(`Atualizados agora: ${updated}`);
  console.log(`Nomes canonizados (acentuação/caixa): ${nomeCanonicoAtualizado}`);
  console.log(`Já corretos: ${alreadyCorrect}`);
  console.log(`Navios com cliente: ${withClient}`);
  console.log(`Navios sem cliente: ${withoutClient}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
