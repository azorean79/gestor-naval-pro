// Script para cadastrar a jangada do certificado 'MESTRE MIGUEL' (5017330300330)

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });


// Inicializar PrismaClient puro para ambiente local
const prisma = new PrismaClient();

async function main() {
  // Dados do certificado MESTRE MIGUEL
  // Conecta ou cria a marca 'RFD'
  let marcaObj = await prisma.marcaJangada.findFirst({ where: { nome: 'RFD' } });
  if (!marcaObj) {
    marcaObj = await prisma.marcaJangada.create({ data: { nome: 'RFD' } });
  }

  const jangadaData = {
    numeroSerie: '5017330300330',
    marca: { connect: { id: marcaObj.id } },
    modelo: 'SEASAVA PLUS R',
    capacidade: 8,
    dataFabricacao: new Date('2018-08-08'),
    status: 'ativo',
    certificado: 'AZ25-002',
    numCertificado: 'AZ25-002',
    dataValidadeCertificado: new Date('2026-01-07'),
    navioNome: 'MESTRE MIGUEL',
    tipo: 'PU', // Material de fabrico
    // Adicione outros campos conforme necessário
  };

  // Verifica se já existe
  const existente = await prisma.jangada.findFirst({
    where: { numeroSerie: jangadaData.numeroSerie }
  });
  if (existente) {
    console.log('Jangada já cadastrada:', existente.numeroSerie);
    await prisma.$disconnect();
    return;
  }

  // Cadastra a jangada
  const novaJangada = await prisma.jangada.create({ data: jangadaData });
  console.log('Jangada cadastrada:', novaJangada);

  // Cadastra componentes principais
  const componentes = [
    { nome: 'Seasickness Tables', validade: new Date('2027-04-01'), quantidade: 1, estado: 'ok' },
    { nome: 'Handflares', validade: new Date('2027-02-01'), quantidade: 1, estado: 'ok' },
    { nome: 'Teste Hid.', validade: new Date('2017-11-01'), quantidade: 1, estado: 'ok' },
  ];
  for (const comp of componentes) {
    await prisma.inspecaoComponente.create({
      data: {
        jangadaId: novaJangada.id,
        nome: comp.nome,
        validade: comp.validade,
        quantidade: comp.quantidade,
        estado: comp.estado,
      }
    });
  }

  console.log('Componentes cadastrados para a jangada:', novaJangada.numeroSerie);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Erro ao cadastrar:', e);
  process.exit(1);
});
