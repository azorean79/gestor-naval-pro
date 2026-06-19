import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const csvPath = path.join(process.cwd(), 'tmp_clientes_sem_ilha_com_navios_prioridade.csv');
  const rawLines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean);

  const header = rawLines[0].split(';');
  const idxId = header.indexOf('navioId');
  const idxNome = header.indexOf('navioNome');
  const idxMat = header.indexOf('matricula');

  const items = rawLines
    .slice(1)
    .map((line) => {
      const cols = line.split(';');
      return {
        id: Number(cols[idxId]),
        nome: cols[idxNome] ?? '',
        matricula: cols[idxMat] ?? '',
      };
    })
    .filter((x) => Number.isFinite(x.id) && x.id > 0);

  let foundById = 0;
  const missingById: Array<{ id: number; nome: string; matricula: string }> = [];
  let foundByPair = 0;
  const missingByPair: Array<{ id: number; nome: string; matricula: string }> = [];

  for (const it of items) {
    const byId = await prisma.navio.findUnique({
      where: { id: it.id },
      select: { id: true },
    });

    if (byId) foundById += 1;
    else missingById.push(it);

    const byPair = await prisma.navio.findFirst({
      where: { nome: it.nome, matricula: it.matricula },
      select: { id: true },
    });

    if (byPair) foundByPair += 1;
    else missingByPair.push(it);
  }

  console.log(
    JSON.stringify(
      {
        csvNavios: items.length,
        foundById,
        missingByIdCount: missingById.length,
        foundByPair,
        missingByPairCount: missingByPair.length,
        sampleMissingById: missingById.slice(0, 5),
        sampleMissingByPair: missingByPair.slice(0, 5),
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
