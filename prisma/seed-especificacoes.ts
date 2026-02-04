import { PrismaClient } from './app/generated-prisma-client/index.js';

const prisma = new PrismaClient();

async function seedEspecificacoesTecnicas() {
  console.log('🔧 Seeding especificações técnicas completas...');

  // ====================
  // ZODIAC
  // ====================
  const zodiac = await prisma.marcaJangada.upsert({
    where: { nome: 'ZODIAC' },
    update: {},
    create: { nome: 'ZODIAC', ativo: true },
  });

  // ZODIAC COASTER
  const coaster = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'COASTER', marcaId: zodiac.id } },
    update: { sistemaInsuflacao: 'Padrão', valvulasPadrao: 'Padrão' },
    create: { nome: 'COASTER', marcaId: zodiac.id, sistemaInsuflacao: 'Padrão', valvulasPadrao: 'Padrão' },
  });

  const lotacao4 = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 4 },
    update: {},
    create: { capacidade: 4 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: coaster.id, lotacaoId: lotacao4.id } },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: coaster.id,
      lotacaoId: lotacao4.id,
      quantidadeCilindros: 1,
      pesoCO2: 2.2,
      pesoN2: 0.14,
      volumeCilindro: 4.0,
    },
  });

  const lotacao6 = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 6 },
    update: {},
    create: { capacidade: 6 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: coaster.id, lotacaoId: lotacao6.id } },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: coaster.id,
      lotacaoId: lotacao6.id,
      quantidadeCilindros: 1,
      pesoCO2: 2.36,
      pesoN2: 0.15,
      volumeCilindro: 4.0,
    },
  });

  const lotacao8 = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 8 },
    update: {},
    create: { capacidade: 8 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: coaster.id, lotacaoId: lotacao8.id } },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: coaster.id,
      lotacaoId: lotacao8.id,
      quantidadeCilindros: 1,
      pesoCO2: 3.68,
      pesoN2: 0.235,
      volumeCilindro: 6.7,
    },
  });

  // ZODIAC PROPECHE CLV
  const propecheCLV = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'PROPECHE CLV', marcaId: zodiac.id } },
    update: {},
    create: { nome: 'PROPECHE CLV', marcaId: zodiac.id },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: propecheCLV.id, lotacaoId: lotacao6.id } },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: propecheCLV.id,
      lotacaoId: lotacao6.id,
      quantidadeCilindros: 1,
      pesoCO2: 1.487,
      pesoN2: 0.095,
      volumeCilindro: 2.83,
    },
  });

  // ZODIAC PROPECHE CLVI
  const propecheCLVI = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'PROPECHE CLVI', marcaId: zodiac.id } },
    update: {},
    create: { nome: 'PROPECHE CLVI', marcaId: zodiac.id },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: propecheCLVI.id, lotacaoId: lotacao6.id } },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: propecheCLVI.id,
      lotacaoId: lotacao6.id,
      quantidadeCilindros: 1,
      pesoCO2: 2.4,
      pesoN2: 0.144,
      volumeCilindro: 4.0,
    },
  });

  // ZODIAC MOR
  const mor = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'MOR', marcaId: zodiac.id } },
    update: {},
    create: { nome: 'MOR', marcaId: zodiac.id },
  });

  const lotacao10 = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 10 },
    update: {},
    create: { capacidade: 10 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: mor.id, lotacaoId: lotacao10.id } },
    update: {},
    create: {
      marcaId: zodiac.id,
      modeloId: mor.id,
      lotacaoId: lotacao10.id,
      quantidadeCilindros: 1,
      pesoCO2: 13.2,
      pesoN2: 0.792,
      volumeCilindro: 24.0,
    },
  });

  // ZODIAC TO (Throw-Over)
  const to = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'TO', marcaId: zodiac.id } },
    update: {},
    create: { nome: 'TO', marcaId: zodiac.id, sistemaInsuflacao: 'THANNER', valvulasPadrao: 'OTS65' },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao6.id } },
    update: {},
    create: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao6.id, quantidadeCilindros: 1, pesoCO2: 3.59, pesoN2: 0.18, volumeCilindro: 5.36 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao8.id } },
    update: {},
    create: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao8.id, quantidadeCilindros: 1, pesoCO2: 3.59, pesoN2: 0.18, volumeCilindro: 5.36 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao10.id } },
    update: {},
    create: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao10.id, quantidadeCilindros: 1, pesoCO2: 5.38, pesoN2: 0.27, volumeCilindro: 8.04 },
  });

  const lotacao12 = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 12 },
    update: {},
    create: { capacidade: 12 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao12.id } },
    update: {},
    create: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao12.id, quantidadeCilindros: 1, pesoCO2: 5.38, pesoN2: 0.27, volumeCilindro: 8.04 },
  });

  const lotacao16 = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 16 },
    update: {},
    create: { capacidade: 16 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao16.id } },
    update: {},
    create: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao16.id, quantidadeCilindros: 1, pesoCO2: 7.18, pesoN2: 0.36, volumeCilindro: 10.72 },
  });

  const lotacao20 = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 20 },
    update: {},
    create: { capacidade: 20 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao20.id } },
    update: {},
    create: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao20.id, quantidadeCilindros: 1, pesoCO2: 8.8, pesoN2: 0.44, volumeCilindro: 13.40 },
  });

  const lotacao25 = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 25 },
    update: {},
    create: { capacidade: 25 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao25.id } },
    update: {},
    create: { marcaId: zodiac.id, modeloId: to.id, lotacaoId: lotacao25.id, quantidadeCilindros: 1, pesoCO2: 10.77, pesoN2: 0.54, volumeCilindro: 16.08 },
  });

  // ZODIAC TO SR (Self-Righting)
  const toSR = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'TO SR', marcaId: zodiac.id } },
    update: {},
    create: { nome: 'TO SR', marcaId: zodiac.id, sistemaInsuflacao: 'THANNER', valvulasPadrao: 'OTS65' },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: toSR.id, lotacaoId: lotacao25.id } },
    update: {},
    create: { marcaId: zodiac.id, modeloId: toSR.id, lotacaoId: lotacao25.id, quantidadeCilindros: 1, pesoCO2: 12.57, pesoN2: 0.63, volumeCilindro: 18.76 },
  });

  const lotacao37 = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 37 },
    update: {},
    create: { capacidade: 37 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: toSR.id, lotacaoId: lotacao37.id } },
    update: {},
    create: { marcaId: zodiac.id, modeloId: toSR.id, lotacaoId: lotacao37.id, quantidadeCilindros: 2, pesoCO2: 8.8, pesoN2: 0.44, volumeCilindro: 13.4 },
  });

  const lotacao50 = await prisma.lotacaoJangada.upsert({
    where: { capacidade: 50 },
    update: {},
    create: { capacidade: 50 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: zodiac.id, modeloId: toSR.id, lotacaoId: lotacao50.id } },
    update: {},
    create: { marcaId: zodiac.id, modeloId: toSR.id, lotacaoId: lotacao50.id, quantidadeCilindros: 2, pesoCO2: 12.57, pesoN2: 0.63, volumeCilindro: 18.76 },
  });

  // ZODIAC MKIV
  const mkiv = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'MKIV', marcaId: zodiac.id } },
    update: {},
    create: { nome: 'MKIV', marcaId: zodiac.id, sistemaInsuflacao: 'Leafield', valvulasPadrao: 'A10, B10' },
  });

  console.log('✅ ZODIAC complete');

  // ====================
  // RFD
  // ====================
  const rfd = await prisma.marcaJangada.upsert({
    where: { nome: 'RFD' },
    update: {},
    create: { nome: 'RFD', ativo: true },
  });

  // RFD SEASAVA PLUS
  const seasavaPlus = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'SEASAVA PLUS', marcaId: rfd.id } },
    update: {},
    create: { nome: 'SEASAVA PLUS', marcaId: rfd.id, sistemaInsuflacao: 'Thanner', valvulasPadrao: 'OTS65, A10, B10' },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: rfd.id, modeloId: seasavaPlus.id, lotacaoId: lotacao6.id } },
    update: {},
    create: { marcaId: rfd.id, modeloId: seasavaPlus.id, lotacaoId: lotacao6.id, quantidadeCilindros: 1, pesoCO2: 1.980, pesoN2: 0.060, referenciaCilindro: '08719009' },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: rfd.id, modeloId: seasavaPlus.id, lotacaoId: lotacao12.id } },
    update: {},
    create: { marcaId: rfd.id, modeloId: seasavaPlus.id, lotacaoId: lotacao12.id, quantidadeCilindros: 1, pesoCO2: 9.38, referenciaCilindro: '08719009' },
  });

  // RFD SEASAVA PRO-ISO
  const seasavaProISO = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'SEASAVA PRO-ISO', marcaId: rfd.id } },
    update: {},
    create: { nome: 'SEASAVA PRO-ISO', marcaId: rfd.id, sistemaInsuflacao: 'Leafield', valvulasPadrao: 'A6, A7, A5, C7, D7, B10' },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: rfd.id, modeloId: seasavaProISO.id, lotacaoId: lotacao4.id } },
    update: {},
    create: { marcaId: rfd.id, modeloId: seasavaProISO.id, lotacaoId: lotacao4.id, quantidadeCilindros: 1, pesoCO2: 1.58 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: rfd.id, modeloId: seasavaProISO.id, lotacaoId: lotacao12.id } },
    update: {},
    create: { marcaId: rfd.id, modeloId: seasavaProISO.id, lotacaoId: lotacao12.id, quantidadeCilindros: 1, pesoCO2: 4.17 },
  });

  // RFD SURVIVA MKII
  const survivaMKII = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'SURVIVA MKII', marcaId: rfd.id } },
    update: {},
    create: { nome: 'SURVIVA MKII', marcaId: rfd.id, sistemaInsuflacao: 'VTE99', valvulasPadrao: 'Supernova' },
  });

  // RFD SURVIVA MKIII
  const survivaMKIII = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'SURVIVA MKIII', marcaId: rfd.id } },
    update: {},
    create: { nome: 'SURVIVA MKIII', marcaId: rfd.id, sistemaInsuflacao: 'THANNER', valvulasPadrao: 'OTS65' },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: rfd.id, modeloId: survivaMKIII.id, lotacaoId: lotacao10.id } },
    update: {},
    create: { marcaId: rfd.id, modeloId: survivaMKIII.id, lotacaoId: lotacao10.id, quantidadeCilindros: 1, pesoCO2: 5.94, pesoN2: 0.18 },
  });

  // RFD SURVIVA MKIV TO
  const survivaMKIVTO = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'SURVIVA MKIV TO', marcaId: rfd.id } },
    update: {},
    create: { nome: 'SURVIVA MKIV TO', marcaId: rfd.id, sistemaInsuflacao: 'Leafield', valvulasPadrao: 'A10, B10' },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: rfd.id, modeloId: survivaMKIVTO.id, lotacaoId: lotacao8.id } },
    update: {},
    create: { marcaId: rfd.id, modeloId: survivaMKIVTO.id, lotacaoId: lotacao8.id, quantidadeCilindros: 1, pesoCO2: 3.51, pesoN2: 0.23, referenciaCilindro: '50463005' },
  });

  // RFD FERRYMAN
  const ferryman = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'FERRYMAN', marcaId: rfd.id } },
    update: {},
    create: { nome: 'FERRYMAN', marcaId: rfd.id, sistemaInsuflacao: 'THANNER' },
  });

  console.log('✅ RFD complete');

  // ====================
  // DSB
  // ====================
  const dsb = await prisma.marcaJangada.upsert({
    where: { nome: 'DSB' },
    update: {},
    create: { nome: 'DSB', ativo: true },
  });

  const lr97 = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'LR97', marcaId: dsb.id } },
    update: {},
    create: { nome: 'LR97', marcaId: dsb.id, sistemaInsuflacao: 'THANNER', valvulasPadrao: 'OTS65' },
  });

  const lr07 = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'LR07', marcaId: dsb.id } },
    update: {},
    create: { nome: 'LR07', marcaId: dsb.id, sistemaInsuflacao: 'Leafield', valvulasPadrao: 'A10, A6, C7, D7, A5, A7' },
  });

  console.log('✅ DSB complete');

  // ====================
  // LALIZAS
  // ====================
  const lalizas = await prisma.marcaJangada.upsert({
    where: { nome: 'LALIZAS' },
    update: {},
    create: { nome: 'LALIZAS', ativo: true },
  });

  const isoRaft = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'ISO-RAFT', marcaId: lalizas.id } },
    update: {},
    create: { nome: 'ISO-RAFT', marcaId: lalizas.id, sistemaInsuflacao: 'HSR-OH-III', valvulasPadrao: 'AQF-5-100, 71891' },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: lalizas.id, modeloId: isoRaft.id, lotacaoId: lotacao4.id } },
    update: {},
    create: { marcaId: lalizas.id, modeloId: isoRaft.id, lotacaoId: lotacao4.id, quantidadeCilindros: 1, pesoCO2: 2.4 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: lalizas.id, modeloId: isoRaft.id, lotacaoId: lotacao12.id } },
    update: {},
    create: { marcaId: lalizas.id, modeloId: isoRaft.id, lotacaoId: lotacao12.id, quantidadeCilindros: 1, pesoCO2: 6.0 },
  });

  console.log('✅ LALIZAS complete');

  // ====================
  // PLASTIMO
  // ====================
  const plastimo = await prisma.marcaJangada.upsert({
    where: { nome: 'PLASTIMO' },
    update: {},
    create: { nome: 'PLASTIMO', ativo: true },
  });

  const cruiser = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'Cruiser', marcaId: plastimo.id } },
    update: {},
    create: { nome: 'Cruiser', marcaId: plastimo.id },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: plastimo.id, modeloId: cruiser.id, lotacaoId: lotacao4.id } },
    update: {},
    create: { marcaId: plastimo.id, modeloId: cruiser.id, lotacaoId: lotacao4.id, quantidadeCilindros: 1, pesoCO2: 1.1 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: plastimo.id, modeloId: cruiser.id, lotacaoId: lotacao8.id } },
    update: {},
    create: { marcaId: plastimo.id, modeloId: cruiser.id, lotacaoId: lotacao8.id, quantidadeCilindros: 1, pesoCO2: 2.2 },
  });

  const transocean = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'Transocean ISO 9650-1', marcaId: plastimo.id } },
    update: {},
    create: { nome: 'Transocean ISO 9650-1', marcaId: plastimo.id },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: plastimo.id, modeloId: transocean.id, lotacaoId: lotacao4.id } },
    update: {},
    create: { marcaId: plastimo.id, modeloId: transocean.id, lotacaoId: lotacao4.id, quantidadeCilindros: 1, pesoCO2: 1.1 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: plastimo.id, modeloId: transocean.id, lotacaoId: lotacao12.id } },
    update: {},
    create: { marcaId: plastimo.id, modeloId: transocean.id, lotacaoId: lotacao12.id, quantidadeCilindros: 1, pesoCO2: 3.0 },
  });

  console.log('✅ PLASTIMO complete');

  // ====================
  // Sea-Safe
  // ====================
  const seaSafe = await prisma.marcaJangada.upsert({
    where: { nome: 'Sea-Safe' },
    update: {},
    create: { nome: 'Sea-Safe', ativo: true },
  });

  const proLight = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'Pro-Light', marcaId: seaSafe.id } },
    update: {},
    create: { nome: 'Pro-Light', marcaId: seaSafe.id, sistemaInsuflacao: 'NSS' },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: seaSafe.id, modeloId: proLight.id, lotacaoId: lotacao4.id } },
    update: {},
    create: { marcaId: seaSafe.id, modeloId: proLight.id, lotacaoId: lotacao4.id, quantidadeCilindros: 1, pesoCO2: 1.28 },
  });

  await prisma.especificacaoTecnica.upsert({
    where: { marcaId_modeloId_lotacaoId: { marcaId: seaSafe.id, modeloId: proLight.id, lotacaoId: lotacao12.id } },
    update: {},
    create: { marcaId: seaSafe.id, modeloId: proLight.id, lotacaoId: lotacao12.id, quantidadeCilindros: 1, pesoCO2: 2.7 },
  });

  console.log('✅ Sea-Safe complete');

  // ====================
  // Eurovinil
  // ====================
  const eurovinil = await prisma.marcaJangada.upsert({
    where: { nome: 'Eurovinil' },
    update: {},
    create: { nome: 'Eurovinil', ativo: true },
  });

  const leisureSyntesy = await prisma.modeloJangada.upsert({
    where: { nome_marcaId: { nome: 'Leisure Syntesy', marcaId: eurovinil.id } },
    update: {},
    create: { nome: 'Leisure Syntesy', marcaId: eurovinil.id },
  });

  console.log('✅ Eurovinil complete');

  // ====================
  // Outras marcas
  // ====================
  await prisma.marcaJangada.upsert({ where: { nome: 'VIKING' }, update: {}, create: { nome: 'VIKING' } });
  await prisma.marcaJangada.upsert({ where: { nome: 'CREWAVER' }, update: {}, create: { nome: 'CREWAVER' } });
  await prisma.marcaJangada.upsert({ where: { nome: 'Switlik' }, update: {}, create: { nome: 'Switlik' } });
  await prisma.marcaJangada.upsert({ where: { nome: 'OCEAN SAFETY' }, update: {}, create: { nome: 'OCEAN SAFETY' } });
  await prisma.marcaJangada.upsert({ where: { nome: 'ARIMAR' }, update: {}, create: { nome: 'ARIMAR' } });
  await prisma.marcaJangada.upsert({ where: { nome: 'ALMAR' }, update: {}, create: { nome: 'ALMAR' } });

  console.log('✅ Outras marcas complete');
  console.log('✅ Especificações técnicas seeded!');
}

async function seedConteudoPacks() {
  console.log('📦 Seeding conteúdo dos packs...');

  // Pack SOLAS A
  const solasA = await prisma.tipoPack.upsert({
    where: { nome: 'SOLAS A' },
    update: { categoria: 'SOLAS A', descricao: 'Pack SOLAS A - Longas viagens oceânicas (>24h)' },
    create: { nome: 'SOLAS A', categoria: 'SOLAS A', descricao: 'Pack SOLAS A - Longas viagens oceânicas (>24h)' },
  });

  await prisma.conteudoPack.upsert({
    where: { tipoPackId: solasA.id },
    update: {},
    create: {
      tipoPackId: solasA.id,
      racoesEmergencia: 1,
      aguaPotavel: 3.0,
      kitPrimeirosSocorros: true,
      comprimidosEnjooPorPessoa: 6,
      sacosEnjooPorPessoa: 1,
      foguetesParaquedas: 4,
      fachosMao: 6,
      sinaisFumo: 2,
      lanternaEstanque: true,
      heliógrafo: true,
      apito: true,
      faca: true,
      esponjas: 2,
      abreLatas: 3,
      coposGraduados: 1,
      mantasTermicas: 2,
      kitPesca: true,
      manualSobrevivencia: true,
      tabelaSinais: true,
      foleEnchimento: true,
      tampoesFuros: true,
      kitReparacao: true,
      ancorasQuantidade: 1,
    },
  });

  // Pack SOLAS B
  const solasB = await prisma.tipoPack.upsert({
    where: { nome: 'SOLAS B' },
    update: { categoria: 'SOLAS B', descricao: 'Pack SOLAS B - Viagens curtas perto da costa (<24h)' },
    create: { nome: 'SOLAS B', categoria: 'SOLAS B', descricao: 'Pack SOLAS B - Viagens curtas perto da costa (<24h)' },
  });

  await prisma.conteudoPack.upsert({
    where: { tipoPackId: solasB.id },
    update: {},
    create: {
      tipoPackId: solasB.id,
      racoesEmergencia: 0,
      aguaPotavel: 0,
      kitPrimeirosSocorros: true,
      comprimidosEnjooPorPessoa: 3,
      sacosEnjooPorPessoa: 1,
      foguetesParaquedas: 2,
      fachosMao: 3,
      sinaisFumo: 1,
      lanternaEstanque: true,
      heliógrafo: true,
      apito: true,
      faca: true,
      esponjas: 2,
      coposGraduados: 0,
      mantasTermicas: 1,
      kitPesca: false,
      manualSobrevivencia: true,
      tabelaSinais: true,
      foleEnchimento: true,
      tampoesFuros: true,
      kitReparacao: true,
      ancorasQuantidade: 1,
    },
  });

  // Pack ISO 9650-1 (>24h)
  const iso24h = await prisma.tipoPack.upsert({
    where: { nome: 'ISO 9650-1 (>24h)' },
    update: { categoria: 'ISO 9650-1 (>24h)', descricao: 'Pack ISO para embarcações de recreio - Mais de 24 horas' },
    create: { nome: 'ISO 9650-1 (>24h)', categoria: 'ISO 9650-1 (>24h)', descricao: 'Pack ISO para embarcações de recreio - Mais de 24 horas' },
  });

  await prisma.conteudoPack.upsert({
    where: { tipoPackId: iso24h.id },
    update: {},
    create: {
      tipoPackId: iso24h.id,
      racoesEmergencia: 1,
      aguaPotavel: 1.5,
      kitPrimeirosSocorros: true,
      comprimidosEnjooPorPessoa: 6,
      sacosEnjooPorPessoa: 1,
      foguetesParaquedas: 4,
      fachosMao: 6,
      sinaisFumo: 2,
      lanternaEstanque: true,
      heliógrafo: true,
      apito: true,
      faca: true,
      esponjas: 2,
      abreLatas: 3,
      coposGraduados: 1,
      mantasTermicas: 2,
      kitPesca: true,
      manualSobrevivencia: true,
      tabelaSinais: true,
      foleEnchimento: true,
      tampoesFuros: true,
      kitReparacao: true,
      ancorasQuantidade: 1,
    },
  });

  // Pack ISO 9650-1 (<24h)
  const isoMenos24h = await prisma.tipoPack.upsert({
    where: { nome: 'ISO 9650-1 (<24h)' },
    update: { categoria: 'ISO 9650-1 (<24h)', descricao: 'Pack ISO para embarcações de recreio - Menos de 24 horas' },
    create: { nome: 'ISO 9650-1 (<24h)', categoria: 'ISO 9650-1 (<24h)', descricao: 'Pack ISO para embarcações de recreio - Menos de 24 horas' },
  });

  await prisma.conteudoPack.upsert({
    where: { tipoPackId: isoMenos24h.id },
    update: {},
    create: {
      tipoPackId: isoMenos24h.id,
      racoesEmergencia: 0,
      aguaPotavel: 0.5,
      kitPrimeirosSocorros: true,
      comprimidosEnjooPorPessoa: 3,
      sacosEnjooPorPessoa: 1,
      foguetesParaquedas: 2,
      fachosMao: 3,
      sinaisFumo: 1,
      lanternaEstanque: true,
      heliógrafo: true,
      apito: true,
      faca: true,
      esponjas: 2,
      mantasTermicas: 1,
      kitPesca: false,
      manualSobrevivencia: true,
      tabelaSinais: true,
      foleEnchimento: true,
      tampoesFuros: true,
      kitReparacao: true,
      ancorasQuantidade: 1,
    },
  });

  // Pack E (Coastal)
  const packE = await prisma.tipoPack.upsert({
    where: { nome: 'Pack E' },
    update: { categoria: 'Coastal/E', descricao: 'Pack E - Navegação muito próxima da costa ou águas abrigadas' },
    create: { nome: 'Pack E', categoria: 'Coastal/E', descricao: 'Pack E - Navegação muito próxima da costa ou águas abrigadas' },
  });

  await prisma.conteudoPack.upsert({
    where: { tipoPackId: packE.id },
    update: {},
    create: {
      tipoPackId: packE.id,
      racoesEmergencia: 0,
      aguaPotavel: 0,
      kitPrimeirosSocorros: false,
      foguetesParaquedas: 1,
      fachosMao: 2,
      sinaisFumo: 1,
      lanternaEstanque: true,
      apito: true,
      faca: true,
      esponjas: 1,
      kitPesca: false,
      manualSobrevivencia: false,
      tabelaSinais: false,
      foleEnchimento: true,
      tampoesFuros: true,
      kitReparacao: true,
      ancorasQuantidade: 1,
    },
  });

  // Pack Coastal
  const packCoastal = await prisma.tipoPack.upsert({
    where: { nome: 'Coastal' },
    update: { categoria: 'Coastal/E', descricao: 'Pack Coastal - Navegação costeira' },
    create: { nome: 'Coastal', categoria: 'Coastal/E', descricao: 'Pack Coastal - Navegação costeira' },
  });

  await prisma.conteudoPack.upsert({
    where: { tipoPackId: packCoastal.id },
    update: {},
    create: {
      tipoPackId: packCoastal.id,
      racoesEmergencia: 0,
      aguaPotavel: 0,
      kitPrimeirosSocorros: true,
      foguetesParaquedas: 2,
      fachosMao: 3,
      sinaisFumo: 1,
      lanternaEstanque: true,
      apito: true,
      faca: true,
      esponjas: 2,
      mantasTermicas: 1,
      kitPesca: false,
      manualSobrevivencia: true,
      tabelaSinais: true,
      foleEnchimento: true,
      tampoesFuros: true,
      kitReparacao: true,
      ancorasQuantidade: 1,
    },
  });

  console.log('✅ Conteúdo dos packs seeded!');
}

async function main() {
  try {
    await seedEspecificacoesTecnicas();
    await seedConteudoPacks();
    console.log('\n🎉 Seed completo!');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
