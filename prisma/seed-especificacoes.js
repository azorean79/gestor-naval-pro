const { PrismaClient } = require('./app/generated-prisma-client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL,
    },
  },
});

async function seedEspecificacoesTecnicas() {
  console.log('🔧 Seeding especificações técnicas completas...');

  // ====================
  // ZODIAC
  // ====================
  const zodiac = await prisma.marcaJangada.upsert({
    where: { nome: 'ZODIAC' },
    update: {},
    create: { nome: 'ZODIAC', ativo: true }
  });

  const coaster = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'COASTER', marcaId: zodiac.id } },
    update: { sistemaInsuflacao: 'Padrão', valvulasPadrao: 'Padrão' },
    create: { nome: 'COASTER', marcaId: zodiac.id, sistemaInsuflacao: 'Padrão', valvulasPadrao: 'Padrão' },
  });

  const lotacao4P = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 4 },
    update: {},
    create: { capacidade: 4 }
  });

  await prisma.especificacaoTecnica.upsert({
    where: {
      marcaId_modeloId_lotacaoId: {
        marcaId: zodiac.id,
        modeloId: coaster.id,
        lotacaoId: lotacao4P.id
      }
    },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: coaster.id,
      lotacaoId: lotacao4P.id,
      quantidadeCilindros: 1,
      pesoCO2: 0.33,
      volumeCilindro: 0.56
    }
  });

  const lotacao6P = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 6 },
    update: {},
    create: { capacidade: 6 }
  });

  await prisma.especificacaoTecnica.upsert({
    where: {
      marcaId_modeloId_lotacaoId: {
        marcaId: zodiac.id,
        modeloId: coaster.id,
        lotacaoId: lotacao6P.id
      }
    },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: coaster.id,
      lotacaoId: lotacao6P.id,
      quantidadeCilindros: 1,
      pesoCO2: 0.33,
      volumeCilindro: 0.56
    }
  });

  const lotacao8P = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 8 },
    update: {},
    create: { capacidade: 8 }
  });

  await prisma.especificacaoTecnica.upsert({
    where: {
      marcaId_modeloId_lotacaoId: {
        marcaId: zodiac.id,
        modeloId: coaster.id,
        lotacaoId: lotacao8P.id
      }
    },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: coaster.id,
      lotacaoId: lotacao8P.id,
      quantidadeCilindros: 1,
      pesoCO2: 0.5,
      volumeCilindro: 0.85
    }
  });

  // PROPECHE CLV
  const propecheCLV = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'PROPECHE CLV', marcaId: zodiac.id } },
    update: {},
    create: { nome: 'PROPECHE CLV', marcaId: zodiac.id },
  });

  await prisma.especificacaoTecnica.upsert({
    where: {
      marcaId_modeloId_lotacaoId: {
        marcaId: zodiac.id,
        modeloId: propecheCLV.id,
        lotacaoId: lotacao4P.id
      }
    },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: propecheCLV.id,
      lotacaoId: lotacao4P.id,
      quantidadeCilindros: 1,
      pesoCO2: 0.33,
      volumeCilindro: 0.56
    }
  });

  await prisma.especificacaoTecnica.upsert({
    where: {
      marcaId_modeloId_lotacaoId: {
        marcaId: zodiac.id,
        modeloId: propecheCLV.id,
        lotacaoId: lotacao6P.id
      }
    },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: propecheCLV.id,
      lotacaoId: lotacao6P.id,
      quantidadeCilindros: 1,
      pesoCO2: 0.33,
      volumeCilindro: 0.56
    }
  });

  // PROPECHE CLVI
  const propecheCLVI = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'PROPECHE CLVI', marcaId: zodiac.id } },
    update: {},
    create: { nome: 'PROPECHE CLVI', marcaId: zodiac.id },
  });

  await prisma.especificacaoTecnica.upsert({
    where: {
      marcaId_modeloId_lotacaoId: {
        marcaId: zodiac.id,
        modeloId: propecheCLVI.id,
        lotacaoId: lotacao6P.id
      }
    },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: propecheCLVI.id,
      lotacaoId: lotacao6P.id,
      quantidadeCilindros: 1,
      pesoCO2: 0.33,
      volumeCilindro: 0.56
    }
  });

  console.log('✅ Seed básico completo!');
  console.log('📦 Especificações criadas para ZODIAC COASTER, PROPECHE CLV e CLVI');
}

seedEspecificacoesTecnicas()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
