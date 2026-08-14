import { PrismaClient } from '@prisma/client';
import { seedServiceStations } from './service-station-seed';
const prisma = new PrismaClient();

async function main() {
  const clienteModel = prisma.cliente as any;
  const navioModel = prisma.navio as any;
  const jangadaModel = prisma.jangada as any;
  const agendaModel = prisma.agenda as any;
  const userModel = prisma.user as any;
  const postModel = prisma.post as any;
  const stockModel = prisma.stock as any;
  const equipamentoModel = prisma.equipamento as any;
  const inspecaoModel = prisma.inspecao as any;
  const inspecaoArtigoModel = (prisma as any).inspecaoArtigo;
  const certificadoExtraidoModel = prisma.certificadoExtraido as any;
  const certificadoValidadeModel = prisma.certificadoValidade as any;

  const stations = await seedServiceStations(prisma);
  const acoresStationId = stations.get('ACORES')?.id ?? null;

  // Clientes
  await clienteModel.createMany({
    data: [
      { nome: 'Cliente A', numeroCliente: 'C001', nif: '123456789', email: 'clientea@email.com', telefone: '212345678', telmovel: '912345678', ilha: 'São Miguel', morada: 'Rua do Porto, 1', serviceStationId: acoresStationId },
      { nome: 'Cliente B', numeroCliente: 'C002', nif: '987654321', email: 'clienteb@email.com', telefone: '212345679', telmovel: '912345679', ilha: 'Faial', morada: 'Av. Central, 100', serviceStationId: acoresStationId },
    ],
    skipDuplicates: true,
  });

  // Navios
  await navioModel.createMany({
    data: [
      { nome: 'Navio Alpha', matricula: 'MAT001', ilha: 'São Miguel', tipoPesca: 'Arrasto', clienteId: 1, serviceStationId: acoresStationId, territorioGrupo: 'São Miguel' },
      { nome: 'Navio Beta', matricula: 'MAT002', ilha: 'Faial', tipoPesca: 'Cerco', clienteId: 2, serviceStationId: acoresStationId, territorioGrupo: 'Faial' },
    ],
    skipDuplicates: true,
  });

  // Jangadas
  await jangadaModel.createMany({
    data: [
      { serial: 'J001', owner: 'Cliente A', shipId: 1, model: 'COASTAL', brand: 'Zodiac', dataFabrico: '2020-01-01', packType: 'SOLAS', capacity: 6, serviceStationId: acoresStationId },
      { serial: 'J002', owner: 'Cliente B', shipId: 2, model: 'COASTAL', brand: 'Viking', dataFabrico: '2021-01-01', packType: 'ISO', capacity: 8, serviceStationId: acoresStationId },
    ],
    skipDuplicates: true,
  });

  // Agenda
  await agendaModel.createMany({
    data: [
      { nome: 'Agenda 1', matricula: 'MAT001', embarcacoesDePesca: 'Arrasto', tipoPesca: 'Arrasto', lotacao: 10, bandeira: 'Portugal', clienteId: 1 },
      { nome: 'Agenda 2', matricula: 'MAT002', embarcacoesDePesca: 'Cerco', tipoPesca: 'Cerco', lotacao: 8, bandeira: 'Portugal', clienteId: 2 },
    ],
    skipDuplicates: true,
  });

  // User e Post
  const user = await userModel.upsert({
    where: { email: 'admin@email.com' },
    update: {},
    create: { email: 'admin@email.com', name: 'Admin' },
  });
  await postModel.createMany({
    data: [
      { title: 'Primeiro Post', content: 'Bem-vindo ao sistema!', published: true, authorId: user.id },
      { title: 'Post de Teste', content: 'Post de exemplo.', published: false, authorId: user.id },
    ],
    skipDuplicates: true,
  });

  // Stock
  await stockModel.createMany({
    data: [
      { referencia: 'STK001', descricao: 'Coletes', categoria: 'Segurança', associavelJangada: true, precoVenda: 50, quantidade: 10 },
      { referencia: 'STK002', descricao: 'Kit Sinalização', categoria: 'Sinalização', associavelJangada: false, precoVenda: 120, quantidade: 5 },
    ],
    skipDuplicates: true,
  });

  // Equipamentos
  await equipamentoModel.createMany({
    data: [
      { nome: 'Compressor de Ar', tipo: 'Compressor', marca: 'Bauer', modelo: 'Mariner 320', serial: 'BAU-M320-0001', estado: 'Ativo', observacoes: 'Usado para enchimento de cilindros.' },
      { nome: 'Balança de Precisão', tipo: 'Medição', marca: 'Kern', modelo: 'PCB 10000-1', serial: 'KER-PCB-10000', estado: 'Ativo', observacoes: 'Calibração semestral recomendada.' },
    ],
    skipDuplicates: true,
  });

  // Inspeções
  await inspecaoModel.createMany({
    data: [
      { certificadoNumero: 'CERT001', navioNome: 'Navio Alpha', navioId: 1, jangadaId: 1, jangadaSerial: 'J001', dataInspecao: '2026-01-01', status: 'Concluída' },
      { certificadoNumero: 'CERT002', navioNome: 'Navio Beta', navioId: 2, jangadaId: 2, jangadaSerial: 'J002', dataInspecao: '2026-01-02', status: 'Concluída' },
    ],
    skipDuplicates: true,
  });

  // InspecaoArtigo
  if (inspecaoArtigoModel?.createMany) {
    await inspecaoArtigoModel.createMany({
      data: [
        { inspecaoId: 1, stockId: 1, referencia: 'STK001', descricao: 'Coletes', quantidadePlaneada: 6, quantidadeUsada: 6 },
        { inspecaoId: 2, stockId: 2, referencia: 'STK002', descricao: 'Kit Sinalização', quantidadePlaneada: 1, quantidadeUsada: 1 },
      ],
      skipDuplicates: true,
    });
  }

  // Certificados
  await certificadoExtraidoModel.createMany({
    data: [
      { fileName: 'certificado1.pdf', certificadoNumero: 'CERT001', sourceYear: 2025, raftSerial: 'J001', shipName: 'Navio Alpha', dataInspecao: '2026-01-01', isMaisRecente: true },
      { fileName: 'certificado2.pdf', certificadoNumero: 'CERT002', sourceYear: 2025, raftSerial: 'J002', shipName: 'Navio Beta', dataInspecao: '2026-01-02', isMaisRecente: true },
    ],
    skipDuplicates: true,
  });

  // CertificadoValidade
  await certificadoValidadeModel.createMany({
    data: [
      { certificadoId: 1, item: 'Coletes', validade: '2027-01-01', rowNumber: 1 },
      { certificadoId: 2, item: 'Kit Sinalização', validade: '2027-01-02', rowNumber: 2 },
    ],
    skipDuplicates: true,
  });

  console.log('Seed de todos os módulos concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });