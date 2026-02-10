// scripts/seed-dados-minimos.js
// Popula o banco com dados mínimos para funcionamento do dashboard

require('dotenv').config({ path: '.env' });

// Cria PrismaClient com Accelerate
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL
});

async function main() {
  // Cliente
  const cliente = await prisma.cliente.upsert({
    where: { email: 'cliente@exemplo.com' },
    update: {},
    create: {
      nome: 'Cliente Exemplo',
      email: 'cliente@exemplo.com',
      telefone: '999999999',
      nif: '123456789',
      tipo: 'cliente',
      delegacao: 'Açores',
      tecnico: 'Julio Correia',
    },
  });

  // Navio
  const navio = await prisma.navio.upsert({
    where: { nome: 'Navio Exemplo' },
    update: {},
    create: {
      nome: 'Navio Exemplo',
      tipo: 'pesca',
      status: 'ativo',
      clienteId: cliente.id,
      tecnico: 'Julio Correia',
    },
  });

  // Jangada
  const jangada = await prisma.jangada.upsert({
    where: { numeroSerie: 'JANGADA-001' },
    update: {},
    create: {
      numeroSerie: 'JANGADA-001',
      tipo: 'SOLAS',
      status: 'ativo',
      clienteId: cliente.id,
      navioId: navio.id,
      dataFabricacao: new Date('2022-01-01'),
      dataInspecao: new Date('2025-01-01'),
      dataProximaInspecao: new Date('2026-01-01'),
      tecnico: 'Julio Correia',
    },
  });

  // Cilindro
  const cilindro = await prisma.cilindro.upsert({
    where: { numeroSerie: 'CIL-001' },
    update: {},
    create: {
      numeroSerie: 'CIL-001',
      tipo: 'CO2',
      status: 'ativo',
      dataFabricacao: new Date('2022-01-01'),
      dataTeste: new Date('2025-01-01'),
      dataProximoTeste: new Date('2026-01-01'),
      pressaoTrabalho: 6.0,
      pressaoTeste: 6.5,
    },
  });

  // Stock
  await prisma.stock.upsert({
    where: { nome_categoria: { nome: 'Facho de Mão', categoria: 'Pirotécnicos' } },
    update: {},
    create: {
      nome: 'Facho de Mão',
      categoria: 'Pirotécnicos',
      quantidade: 10,
      quantidadeMinima: 2,
      precoUnitario: 25.0,
      status: 'ativo',
    },
  });

  // Agendamento
  await prisma.agendamento.create({
    data: {
      titulo: 'Inspeção Anual',
      tipo: 'inspecao',
      status: 'agendado',
      prioridade: 'normal',
      dataInicio: new Date(),
      dataFim: new Date(Date.now() + 2 * 60 * 60 * 1000),
      navioId: navio.id,
      jangadaId: jangada.id,
      responsavel: 'Julio Correia',
    },
  });

  // Inspecao
  await prisma.inspecao.create({
    data: {
      numero: 'INSP-001',
      tipoInspecao: 'anual',
      dataInspecao: new Date('2025-01-01'),
      dataProxima: new Date('2026-01-01'),
      resultado: 'aprovada',
      status: 'realizada',
      tecnico: 'Julio Correia',
      navioId: navio.id,
      jangadaId: jangada.id,
      cilindroId: cilindro.id,
    },
  });

  // CustoInspecao
  await prisma.custoInspecao.create({
    data: {
      valor: 150.0,
      descricao: 'Material',
      tipo: 'material',
      inspecaoId: (await prisma.inspecao.findFirst({ where: { numero: 'INSP-001' } })).id,
    },
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
