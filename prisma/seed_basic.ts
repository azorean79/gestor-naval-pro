import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clientes
  await prisma.cliente.createMany({
    data: [
      { nome: 'Cliente A', numeroCliente: 'C001', nif: '123456789', email: 'clientea@email.com', telefone: '212345678', telmovel: '912345678' },
      { nome: 'Cliente B', numeroCliente: 'C002', nif: '987654321', email: 'clienteb@email.com', telefone: '212345679', telmovel: '912345679' },
    ],
    skipDuplicates: true,
  });

  // Navios
  await prisma.navio.createMany({
    data: [
      { nome: 'Navio Alpha', matricula: 'MAT001', ilha: 'São Miguel', tipoPesca: 'Arrasto', clienteId: 1 },
      { nome: 'Navio Beta', matricula: 'MAT002', ilha: 'Faial', tipoPesca: 'Cerco', clienteId: 2 },
    ],
    skipDuplicates: true,
  });

  // Jangadas
  await prisma.jangada.createMany({
    data: [
      {
        serial: 'J001',
        owner: 'Cliente A',
        shipId: 1,
        model: 'COASTAL',
        brand: 'Zodiac',
        dataFabrico: '2020-01-01',
        packType: 'SOLAS',
        capacity: 6
      },
      {
        serial: 'J002',
        owner: 'Cliente B',
        shipId: 2,
        model: 'COASTAL',
        brand: 'Viking',
        dataFabrico: '2021-01-01',
        packType: 'ISO',
        capacity: 8
      },
    ],
    skipDuplicates: true,
  });

  // Stock
  await prisma.stock.createMany({
    data: [
      {
        referencia: 'STK001',
        descricao: 'Coletes',
        categoria: 'Segurança',
        associavelJangada: true,
        precoVenda: 50,
        quantidade: 10
      },
      {
        referencia: 'STK002',
        descricao: 'Kit Sinalização',
        categoria: 'Sinalização',
        associavelJangada: false,
        precoVenda: 120,
        quantidade: 5
      },
    ],
    skipDuplicates: true,
  });

  // Inspeções
  await prisma.inspecao.createMany({
    data: [
      { certificadoNumero: 'CERT001', navioNome: 'Navio Alpha', navioId: 1, jangadaId: 1, jangadaSerial: 'J001', dataInspecao: '2026-01-01', status: 'Concluída' },
      { certificadoNumero: 'CERT002', navioNome: 'Navio Beta', navioId: 2, jangadaId: 2, jangadaSerial: 'J002', dataInspecao: '2026-01-02', status: 'Concluída' },
    ],
    skipDuplicates: true,
  });

  // Certificados
  await prisma.certificadoExtraido.createMany({
    data: [
      { fileName: 'certificado1.pdf', certificadoNumero: 'CERT001', sourceYear: 2025, raftSerial: 'J001', shipName: 'Navio Alpha', dataInspecao: '2026-01-01', isMaisRecente: true },
      { fileName: 'certificado2.pdf', certificadoNumero: 'CERT002', sourceYear: 2025, raftSerial: 'J002', shipName: 'Navio Beta', dataInspecao: '2026-01-02', isMaisRecente: true },
    ],
    skipDuplicates: true,
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
