import 'dotenv/config'
import { PrismaClient } from '../prisma/app/generated-prisma-client'
import { withAccelerate } from '@prisma/extension-accelerate'

// URL do Prisma Accelerate
const ACCELERATE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19TTVZ5LXJiWktoUUtZMHpmSm5Yd3YiLCJhcGlfa2V5IjoiMDFLR0FCQjI2RjRQMTFTR0dQOEY5RjlCRkoiLCJ0ZW5hbnRfaWQiOiIyMDkxNzE0YjM5OTA5NzkzMzVjM2M1MWUxZjQxNTY0NGE0ZDk0ZmM5MzhkODU4NWY4MGExM2VlYjdkODQwOGZkIiwiaW50ZXJuYWxfc2VjcmV0IjoiN2U1MDI0MGUtYjdmYS00NjhjLTljZTQtZTM5NTA2OGQ1NmJlIn0.A-eGaWSZG_w0sMQ4BmVZ13ckdGeYuRb6lMG4T4yvblk"

console.log('Using Accelerate URL')

const prisma = new PrismaClient({
  accelerateUrl: ACCELERATE_URL,
}).$extends(withAccelerate())

async function main() {
  console.log('🌱 Iniciando seed da base de dados...')

  // Criar clientes
  const clientes = await Promise.all([
    prisma.cliente.upsert({
      where: { email: 'maritima@azores.pt' },
      update: {},
      create: {
        nome: 'Marítima Açoreana',
        email: 'maritima@azores.pt',
        telefone: '+351 296 123 456',
        endereco: 'Rua do Porto, 123, Ponta Delgada',
        nif: '500123456',
        tipo: 'armador',
        delegacao: 'Açores',
        tecnico: 'Julio Correia',
      },
    }),
    prisma.cliente.upsert({
      where: { email: 'pescamadeira@mail.pt' },
      update: {},
      create: {
        nome: 'Pescas da Madeira Lda',
        email: 'pescamadeira@mail.pt',
        telefone: '+351 291 987 654',
        endereco: 'Avenida do Mar, 45, Funchal',
        nif: '501234567',
        tipo: 'armador',
        delegacao: 'Madeira',
        tecnico: 'Julio Correia',
      },
    }),
  ])

  console.log('✅ Clientes criados:', clientes.length)

  // Criar navios para os clientes
  const navios = await Promise.all([
    prisma.navio.create({
      data: {
        nome: 'Atlântico Sul',
        tipo: 'pesca-alto-mar',
        matricula: 'PDL-001-2024',
        bandeira: 'Portugal',
        imo: 'IMO1234567',
        comprimento: 45.5,
        largura: 12.3,
        capacidade: 150,
        status: 'ativo',
        clienteId: clientes[0].id,
        delegacao: 'Açores',
        tecnico: 'Julio Correia',
      },
    }),
    prisma.navio.create({
      data: {
        nome: 'Mar Azul',
        tipo: 'pesca-costeiro',
        matricula: 'FNC-002-2024',
        bandeira: 'Portugal',
        comprimento: 28.0,
        largura: 8.5,
        capacidade: 80,
        status: 'ativo',
        clienteId: clientes[1].id,
        delegacao: 'Madeira',
        tecnico: 'Julio Correia',
      },
    }),
    prisma.navio.create({
      data: {
        nome: 'Estrela do Norte',
        tipo: 'maritimo-turistica',
        matricula: 'PDL-003-2024',
        bandeira: 'Portugal',
        comprimento: 35.0,
        largura: 10.0,
        capacidade: 200,
        status: 'ativo',
        clienteId: clientes[0].id,
        delegacao: 'Açores',
        tecnico: 'Julio Correia',
      },
    }),
  ])

  console.log('✅ Navios criados:', navios.length)

  // Criar marcas de jangadas
  const marcas = await Promise.all([
    prisma.marcaJangada.upsert({
      where: { nome: 'Viking' },
      update: {},
      create: { nome: 'Viking' },
    }),
    prisma.marcaJangada.upsert({
      where: { nome: 'RFD' },
      update: {},
      create: { nome: 'RFD' },
    }),
    prisma.marcaJangada.upsert({
      where: { nome: 'Survitec' },
      update: {},
      create: { nome: 'Survitec' },
    }),
  ])

  console.log('✅ Marcas de jangadas criadas:', marcas.length)

  // Criar lotações
  const lotacoes = await Promise.all([
    prisma.lotacaoJangada.upsert({
      where: { capacidade: 6 },
      update: {},
      create: { capacidade: 6 },
    }),
    prisma.lotacaoJangada.upsert({
      where: { capacidade: 10 },
      update: {},
      create: { capacidade: 10 },
    }),
    prisma.lotacaoJangada.upsert({
      where: { capacidade: 12 },
      update: {},
      create: { capacidade: 12 },
    }),
    prisma.lotacaoJangada.upsert({
      where: { capacidade: 20 },
      update: {},
      create: { capacidade: 20 },
    }),
  ])

  console.log('✅ Lotações criadas:', lotacoes.length)

  // Criar jangadas
  const jangadas = await Promise.all([
    prisma.jangada.create({
      data: {
        numeroSerie: 'VK-6P-2024-001',
        tipo: 'inflável',
        marcaId: marcas[0].id,
        lotacaoId: lotacoes[0].id,
        status: 'ativo',
        estado: 'instalada',
        navioId: navios[0].id,
        clienteId: clientes[0].id,
        dataFabricacao: new Date('2024-01-15'),
        dataInspecao: new Date('2024-06-10'),
        dataProximaInspecao: new Date('2025-06-10'),
        tecnico: 'Julio Correia',
      },
    }),
    prisma.jangada.create({
      data: {
        numeroSerie: 'RFD-10P-2023-045',
        tipo: 'inflável',
        marcaId: marcas[1].id,
        lotacaoId: lotacoes[1].id,
        status: 'ativo',
        estado: 'instalada',
        navioId: navios[0].id,
        clienteId: clientes[0].id,
        dataFabricacao: new Date('2023-05-20'),
        dataInspecao: new Date('2024-05-15'),
        dataProximaInspecao: new Date('2025-05-15'),
        tecnico: 'Julio Correia',
      },
    }),
    prisma.jangada.create({
      data: {
        numeroSerie: 'SV-12P-2024-012',
        tipo: 'semi-rígida',
        marcaId: marcas[2].id,
        lotacaoId: lotacoes[2].id,
        status: 'ativo',
        estado: 'instalada',
        navioId: navios[1].id,
        clienteId: clientes[1].id,
        dataFabricacao: new Date('2024-03-10'),
        dataInspecao: new Date('2024-08-01'),
        dataProximaInspecao: new Date('2025-08-01'),
        tecnico: 'Julio Correia',
      },
    }),
  ])

  console.log('✅ Jangadas criadas:', jangadas.length)

  // Criar itens de stock
  const stockItems = await Promise.all([
    prisma.stock.create({
      data: {
        nome: 'Facho de Mão LED',
        categoria: 'Equipamento de Segurança',
        refOrey: 'LED-001',
        refFabricante: 'SAFE-LED-100',
        quantidade: 50,
        quantidadeMinima: 10,
        precoUnitario: 25.50,
        fornecedor: 'Safety Equipment Ltd',
        localizacao: 'Armazém A - Prateleira 3',
        status: 'ativo',
      },
    }),
    prisma.stock.create({
      data: {
        nome: 'Paraquedas de Sinalização',
        categoria: 'Sinalização',
        refOrey: 'PARA-002',
        quantidade: 30,
        quantidadeMinima: 5,
        precoUnitario: 15.00,
        fornecedor: 'Marine Signals Co',
        localizacao: 'Armazém A - Prateleira 5',
        status: 'ativo',
      },
    }),
    prisma.stock.create({
      data: {
        nome: 'Água Potável 500ml',
        categoria: 'Equipamento de Sobrevivência',
        refOrey: 'AGUA-003',
        quantidade: 200,
        quantidadeMinima: 50,
        precoUnitario: 0.80,
        fornecedor: 'Aqua Supplies',
        localizacao: 'Armazém B - Zona 1',
        dataValidade: new Date('2026-12-31'),
        status: 'ativo',
      },
    }),
    prisma.stock.create({
      data: {
        nome: 'Rações de Emergência',
        categoria: 'Equipamento de Sobrevivência',
        refOrey: 'RAC-004',
        quantidade: 100,
        quantidadeMinima: 20,
        precoUnitario: 3.50,
        fornecedor: 'Emergency Food Ltd',
        localizacao: 'Armazém B - Zona 2',
        dataValidade: new Date('2027-06-30'),
        status: 'ativo',
      },
    }),
  ])

  console.log('✅ Itens de stock criados:', stockItems.length)

  // Criar agendamentos
  const agendamentos = await Promise.all([
    prisma.agendamento.create({
      data: {
        titulo: 'Inspeção Anual - Atlântico Sul',
        descricao: 'Inspeção completa de todas as jangadas e equipamentos de segurança',
        dataInicio: new Date('2025-07-01T09:00:00'),
        dataFim: new Date('2025-07-01T17:00:00'),
        tipo: 'inspecao',
        status: 'agendado',
        prioridade: 'alta',
        navioId: navios[0].id,
        responsavel: 'Julio Correia',
      },
    }),
    prisma.agendamento.create({
      data: {
        titulo: 'Manutenção Preventiva - Mar Azul',
        descricao: 'Verificação e manutenção dos sistemas de inflação',
        dataInicio: new Date('2025-06-15T10:00:00'),
        dataFim: new Date('2025-06-15T15:00:00'),
        tipo: 'manutencao',
        status: 'agendado',
        prioridade: 'normal',
        navioId: navios[1].id,
        responsavel: 'Julio Correia',
      },
    }),
  ])

  console.log('✅ Agendamentos criados:', agendamentos.length)

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
