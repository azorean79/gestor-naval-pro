const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BULLETIN_MARKER = 'SB 12/24 Ver.1 - Consolidation of multiple branded part numbers';

const ORDER_REFERENCES = [
  '01174009','12865009','06484009','12874009','12866009','12868009','12867009','12875009','12869009','12870009','12871009','12872009','80913820',
];

const CANONICAL_REFERENCES = [
  '30202051','MED-KIT-SOLAS','30202207','30202205','30202206','30203190','LGT-RL5-INT','LGT-RL5-EXT','LGT-RL6-KIT','LGT-RB2-KIT',
];

async function main() {
  const byReference = await prisma.stock.updateMany({
    where: {
      referencia: { in: [...ORDER_REFERENCES, ...CANONICAL_REFERENCES] },
    },
    data: {
      associavelJangada: false,
    },
  });

  const byBulletinNote = await prisma.stock.updateMany({
    where: {
      observacoes: { contains: BULLETIN_MARKER },
    },
    data: {
      associavelJangada: false,
    },
  });

  const sample = await prisma.stock.findMany({
    where: {
      OR: [
        { referencia: { in: ORDER_REFERENCES.slice(0, 5) } },
        { referencia: { in: CANONICAL_REFERENCES.slice(0, 5) } },
      ],
    },
    select: {
      referencia: true,
      associavelJangada: true,
      estadoArtigo: true,
      referenciaSubstituta: true,
    },
    orderBy: { referencia: 'asc' },
  });

  console.log('✅ Correção de aplicabilidade do boletim concluída');
  console.log(JSON.stringify({
    updatedByReference: byReference.count,
    updatedByBulletinNote: byBulletinNote.count,
    sample,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
