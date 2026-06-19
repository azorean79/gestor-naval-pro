const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const REFS = {
  m10: 'PAINTER-10M',
  m28: 'PAINTER-28M',
  m36: 'PAINTER-36M',
};

async function main() {
  const jangadas = await prisma.jangada.findMany({
    where: {
      model: { contains: 'SEASAVA PLUS', mode: 'insensitive' },
    },
    select: { id: true, serial: true },
  });

  let updated = 0;
  let created = 0;
  let deleted = 0;
  let unchanged = 0;

  for (const j of jangadas) {
    const artigos = await prisma.artigoJangada.findMany({
      where: {
        jangadaId: j.id,
        referencia: { in: [REFS.m10, REFS.m28, REFS.m36] },
      },
      orderBy: { id: 'asc' },
      select: { id: true, referencia: true, name: true, codigoFabricante: true, quantidade: true },
    });

    const has10 = artigos.find((a) => a.referencia === REFS.m10);
    const oldRefs = artigos.filter((a) => a.referencia === REFS.m28 || a.referencia === REFS.m36);

    if (has10 && oldRefs.length === 0) {
      unchanged += 1;
      continue;
    }

    if (has10 && oldRefs.length > 0) {
      await prisma.artigoJangada.deleteMany({
        where: { id: { in: oldRefs.map((a) => a.id) } },
      });
      deleted += oldRefs.length;
      updated += 1;
      continue;
    }

    if (!has10 && oldRefs.length > 0) {
      const first = oldRefs[0];
      await prisma.artigoJangada.update({
        where: { id: first.id },
        data: {
          referencia: REFS.m10,
          codigoFabricante: REFS.m10,
          name: 'Painter Line / Retenida 10m',
        },
      });
      updated += 1;

      const remaining = oldRefs.slice(1);
      if (remaining.length > 0) {
        await prisma.artigoJangada.deleteMany({
          where: { id: { in: remaining.map((a) => a.id) } },
        });
        deleted += remaining.length;
      }
      continue;
    }

    await prisma.artigoJangada.create({
      data: {
        jangadaId: j.id,
        referencia: REFS.m10,
        codigoFabricante: REFS.m10,
        name: 'Painter Line / Retenida 10m',
        quantidade: 1,
      },
    });
    created += 1;
  }

  console.log(
    JSON.stringify(
      {
        seasavaPlusTotal: jangadas.length,
        updated,
        created,
        deleted,
        unchanged,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('Erro ao ajustar retenidas das SEASAVA PLUS:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
